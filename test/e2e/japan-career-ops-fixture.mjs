import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { scanStructuredSource } from '../../scan.mjs';
import { fingerprintJapanJob } from '../../providers/_japan-job-schema.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const SUPPORTED_SOURCES = new Map([
  ['tokyodev', '../../providers/tokyodev.mjs'],
  ['gaijinpot', '../../providers/gaijinpot.mjs'],
  ['hellowork', '../../providers/hellowork.mjs'],
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function labelPath(fixture) {
  if (!/^[a-z0-9-]+\.json$/i.test(fixture.label_file || '')) {
    throw new Error(`invalid label file for ${fixture.id}`);
  }
  return join(ROOT, 'evals', 'japan', 'labels', fixture.label_file);
}

function fixtureEntry(fixture) {
  return {
    source_url: fixture.source_url,
    document_text: fixture.document_html,
  };
}

async function loadProvider(source) {
  const modulePath = SUPPORTED_SOURCES.get(source);
  if (!modulePath) return null;
  const module = await import(modulePath);
  return module.default;
}

function diagnosticForMissingFields(fixture, job, diagnostics) {
  if (fixture.scenario === 'missing-salary' && job && job.salary_min === undefined && job.salary_max === undefined) {
    diagnostics.push('missing-salary: salary not stated; offer quality remains unknown');
  }
  if (fixture.scenario === 'anonymous-employer') {
    diagnostics.push('anonymous-employer: employer identity is hidden or not confidently available');
  }
}

function buildMarkdownReport(fixture, label, normalizedJobs, diagnostics, profile) {
  const job = normalizedJobs[0];
  const sections = [
    `# Japan fixture evaluation — ${fixture.id}`,
    '',
    `- Source: ${fixture.source}`,
    `- Category: ${fixture.category}`,
    `- Title: ${job?.title || fixture.title}`,
    `- Employer: ${job?.company_name || fixture.company}`,
    `- Location: ${job?.location_text || fixture.location}`,
    `- Model: deterministic-test-model`,
    '',
  ];

  for (const [name, section] of [
    ['Role fit', label.role_fit],
    ['Eligibility', label.eligibility],
    ['Offer quality', label.offer_quality],
    ['Confidence', label.confidence],
    ['Recommendation', label.recommendation],
  ]) {
    sections.push(`## ${name}: ${section.judgment}`);
    sections.push(`- Judgment: ${section.judgment}`);
    for (const evidence of section.evidence) {
      sections.push(`- Evidence (${evidence.source}): “${evidence.quote}”`);
    }
    if (section.uncertainty) sections.push(`- Uncertainty: ${section.uncertainty}`);
    sections.push('');
  }

  const needsSponsorship = profile?.needs_sponsorship === true || profile?.location?.needs_sponsorship === true;
  if (needsSponsorship && (job?.visa_sponsorship === 'no' || fixture.scenario === 'no-sponsorship')) {
    sections.push('## Eligibility blocker');
    sections.push('- Sponsorship-needed profile meets an explicit no-sponsorship signal; verify before applying.');
    sections.push('');
  }
  sections.push('## Diagnostics');
  sections.push(...(diagnostics.length ? diagnostics.map((item) => `- ${item}`) : ['- none']));
  sections.push('');
  return `${sections.join('\n').trim()}\n`;
}

function buildHtmlReport(markdown) {
  const body = markdown
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith('- ')) return `<p>${escapeHtml(line.slice(2))}</p>`;
      return line ? `<p>${escapeHtml(line)}</p>` : '';
    })
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Japan fixture evaluation</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:2rem auto;line-height:1.45}h1{font-size:1.5rem}h2{font-size:1.1rem;border-bottom:1px solid #ddd;padding-bottom:.25rem}</style></head><body>${body}</body></html>\n`;
}

function trackerEntry(fixture, job, label, status) {
  const source = job?.source_platform || fixture.source;
  const title = job?.title || fixture.title;
  const company = job?.company_name || fixture.company;
  return `| ${fixture.id} | ${source} | ${title} | ${company} | ${status} | ${label.recommendation.judgment} |`;
}

async function evaluateFixture({ fixture, label, normalizedJobs, diagnostics, profile, model }) {
  if (model !== 'deterministic-test-model') throw new Error(`unexpected E2E model: ${model}`);
  const job = normalizedJobs[0];
  const needsSponsorship = profile?.needs_sponsorship === true || profile?.location?.needs_sponsorship === true;
  if (fixture.scenario === 'no-sponsorship' && needsSponsorship) {
    diagnostics.push('sponsorship-needed no-sponsorship: explicit no-sponsorship signal blocks eligibility');
  }
  return buildMarkdownReport(fixture, label, normalizedJobs, diagnostics, profile);
}

/**
 * Run one sanitized listing through scan → normalize → deduplicate → evaluate → generate → track.
 * The only source I/O is the supplied fixture document; fetchText never calls global fetch.
 *
 * @param {{source: string, fixture: object, profile: object, outputDir: string, model: string}} input
 * @returns {Promise<{normalizedJobs: object[], reportPaths: string[], generatedArtifactPaths: string[], trackerEntries: string[], diagnostics: string[]}>}
 */
export async function runJapanFixtureWorkflow({ source, fixture, profile, outputDir, model }) {
  if (!fixture || !/^[a-z0-9-]+$/.test(fixture.id || '')) throw new Error('fixture id must be sanitized');
  await mkdir(outputDir, { recursive: true });
  const diagnostics = [];
  const normalizedJobs = [];
  const providerSource = fixture.requested_source || source;
  const provider = await loadProvider(providerSource);
  const label = JSON.parse(await readFile(labelPath(fixture), 'utf8'));

  if (fixture.scenario === 'unsupported') {
    diagnostics.push(`unsupported: ${fixture.requested_source || 'unknown source'} is not registered`);
  } else if (!provider) {
    diagnostics.push(`unsupported: ${providerSource} is not registered`);
  } else {
    const scanOnce = async (documentHtml, scanError) => scanStructuredSource(
      scanError
        ? {
          source_url: fixture.source_url,
          sourceUrl: fixture.source_url,
          url: fixture.source_url,
          careers_url: fixture.source_url,
          hellowork: { urls: [fixture.source_url] },
        }
        : fixtureEntry({ ...fixture, document_html: documentHtml }),
      provider,
      {
        fetchText: async () => {
          if (scanError) throw new Error(scanError);
          return documentHtml;
        },
      },
    );

    const first = await scanOnce(fixture.document_html, fixture.scan_error);
    if (first.status === 'ok') {
      normalizedJobs.push(...first.offers);
      if (fixture.duplicate_document_html) {
        const duplicate = await scanOnce(fixture.duplicate_document_html);
        if (duplicate.status === 'ok') normalizedJobs.push(...duplicate.offers);
      }
    } else {
      diagnostics.push(`${fixture.scenario}: scan ${first.status}: ${first.error}`);
    }
  }

  const uniqueJobs = [];
  const fingerprints = new Set();
  for (const job of normalizedJobs) {
    const fingerprint = fingerprintJapanJob(job);
    if (fingerprints.has(fingerprint)) {
      diagnostics.push('duplicate: duplicate listing removed by normalized fingerprint');
      continue;
    }
    fingerprints.add(fingerprint);
    uniqueJobs.push(job);
  }
  normalizedJobs.length = 0;
  normalizedJobs.push(...uniqueJobs);
  diagnosticForMissingFields(fixture, normalizedJobs[0], diagnostics);

  const markdown = await evaluateFixture({ fixture, label, normalizedJobs, diagnostics, profile, model });
  const reportDir = join(outputDir, 'reports');
  await mkdir(reportDir, { recursive: true });
  const markdownPath = join(reportDir, `${fixture.id}.md`);
  const htmlPath = join(reportDir, `${fixture.id}.html`);
  const html = buildHtmlReport(markdown);
  await writeFile(markdownPath, markdown, 'utf8');
  await writeFile(htmlPath, html, 'utf8');

  const generatedArtifactPaths = [htmlPath];
  if (fixture.generate_pdf === true) {
    diagnostics.push('pdf-skipped: existing generator writes the repository PDF manifest, so fixture E2E keeps the run local and side-effect free');
  }

  const status = normalizedJobs.length > 0 ? 'review' : 'diagnostic';
  return {
    normalizedJobs,
    reportPaths: [markdownPath, htmlPath],
    generatedArtifactPaths,
    trackerEntries: [trackerEntry(fixture, normalizedJobs[0], label, status)],
    diagnostics,
  };
}
