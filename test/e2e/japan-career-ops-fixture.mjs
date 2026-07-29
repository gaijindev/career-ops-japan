import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { classifyStructuredSourceError, scanStructuredSource } from '../../scan.mjs';
import {
  assertNormalizedJapanJob,
  fingerprintJapanJob,
} from '../../providers/_japan-job-schema.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const CV_PATH = join(ROOT, 'test', 'e2e', 'fixtures', 'cv.md');
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

function needsSponsorship(profile) {
  return profile?.needs_sponsorship === true || profile?.location?.needs_sponsorship === true;
}

function salaryText(job) {
  if (!job || job.salary_min === undefined || job.salary_max === undefined) return 'not stated';
  return `${job.salary_currency || 'unknown'} ${job.salary_min}-${job.salary_max} ${job.salary_period || 'period unknown'}`;
}

function listingSummary(job) {
  return {
    source: job?.source_platform || 'unknown',
    source_job_id: job?.source_job_id || 'not available',
    title: job?.title || 'not available',
    salary: salaryText(job),
    eligibility: job?.visa_sponsorship || 'unknown',
  };
}

function rawSourceExcerpt(job, preferredQuote) {
  const rawSourceText = job?.raw_source_text?.trim();
  if (!rawSourceText) return undefined;
  if (preferredQuote && rawSourceText.includes(preferredQuote)) return preferredQuote;
  return rawSourceText.slice(0, 120);
}

function jobEvidence(job, fixture, source, preferredQuote) {
  if (!job) return [{ source: 'fixture.diagnostic', quote: fixture.scenario, structural: true }];
  return [{ source, quote: rawSourceExcerpt(job, preferredQuote) }];
}

/**
 * Deterministic model/provider stub. It consumes the normalized job and the
 * synthetic profile/CV; human labels are not model input and cannot render the
 * report. A test may wrap this function through the model argument to inspect
 * the exact inputs without changing the evaluation.
 */
export function deterministicJapanModel({ fixture, normalizedJob, profile, cvText, listingStatus }) {
  if (!cvText || !/sanitized benchmark input/i.test(cvText)) {
    throw new Error('fixture CV was not loaded by the deterministic model');
  }

  const roleText = `${normalizedJob?.title || ''}`.toLowerCase();
  const targetRoleText = (profile?.target_roles?.primary || []).join(' ').toLowerCase();
  const cvLower = cvText.toLowerCase();
  const roleFit = !normalizedJob
    ? 'unknown'
    : /software|data|product/.test(roleText)
      && /software|data|product/.test(targetRoleText)
      && /platform|data|product|ai/.test(cvLower)
      ? 'strong'
      : 'moderate';
  const eligibility = !normalizedJob
    ? 'unknown'
    : normalizedJob.visa_sponsorship === 'no' && needsSponsorship(profile)
      ? 'blocked'
      : 'review';
  const offerQuality = !normalizedJob
    ? 'unknown'
    : normalizedJob.salary_min === undefined || normalizedJob.salary_max === undefined
      ? 'unknown'
      : 'moderate';
  const confidence = !normalizedJob || fixture.scenario === 'anonymous-employer'
    ? 'low'
    : fixture.scenario === 'missing-salary'
      ? 'medium'
      : 'high';
  const recommendation = listingStatus === 'blocked'
    ? 'hold'
    : ['stale', 'unsupported', 'changed'].includes(listingStatus)
      ? 'reject'
      : eligibility === 'blocked'
        ? 'reject'
        : offerQuality === 'unknown'
          ? 'hold'
        : fixture.scenario === 'anonymous-employer'
          ? 'hold'
          : 'advance';

  return {
    listing: listingSummary(normalizedJob),
    role_fit: {
      judgment: roleFit,
      evidence: jobEvidence(normalizedJob, fixture, 'job.raw_source_text', normalizedJob?.title),
      uncertainty: 'Role fit is derived from normalized title/category signals and synthetic CV evidence.',
    },
    eligibility: {
      judgment: eligibility,
      evidence: jobEvidence(normalizedJob, fixture, 'job.raw_source_text'),
      uncertainty: 'Verify authorization, language, residency, and sponsorship with the employer.',
    },
    offer_quality: {
      judgment: offerQuality,
      evidence: jobEvidence(normalizedJob, fixture, 'job.raw_source_text'),
      uncertainty: 'Verify compensation, hours, benefits, and employment conditions.',
    },
    confidence: {
      judgment: confidence,
      evidence: jobEvidence(normalizedJob, fixture, 'job.raw_source_text'),
      uncertainty: 'Confidence reflects source completeness and freshness only.',
    },
    recommendation: {
      judgment: recommendation,
      evidence: [{ source: 'workflow.status', quote: `status=${listingStatus}`, structural: true }],
      uncertainty: 'Recommendation is a deterministic triage label for benchmark regression review.',
    },
  };
}

function buildMarkdownReport(fixture, evaluation, normalizedJobs, diagnostics) {
  const job = normalizedJobs[0];
  const listing = evaluation.listing || listingSummary(job);
  const sections = [
    `# Japan fixture evaluation — ${fixture.id}`,
    '',
    `- Source: ${listing.source}`,
    `- Source job ID: ${listing.source_job_id}`,
    `- Title: ${listing.title}`,
    `- Employer: ${job?.company_name || 'not available'}`,
    `- Location: ${job?.location_text || 'not available'}`,
    `- Advertised salary: ${listing.salary}`,
    `- Eligibility signal: ${listing.eligibility}`,
    `- CV evidence basis: cv.md#experience`,
    `- Model: deterministic-test-model`,
    '',
  ];

  for (const [name, section] of [
    ['Role fit', evaluation.role_fit],
    ['Eligibility', evaluation.eligibility],
    ['Offer quality', evaluation.offer_quality],
    ['Confidence', evaluation.confidence],
    ['Recommendation', evaluation.recommendation],
  ]) {
    sections.push(`## ${name}: ${section.judgment}`);
    sections.push(`- Judgment: ${section.judgment}`);
    for (const evidence of section.evidence) {
      const structuralMarker = evidence.structural === true ? ' [structural diagnostic]' : '';
      sections.push(`- Evidence${structuralMarker} (${evidence.source}): “${evidence.quote}”`);
    }
    if (section.uncertainty) sections.push(`- Uncertainty: ${section.uncertainty}`);
    sections.push('');
  }

  const jobNeedsSponsorshipBlock = evaluation.eligibility.judgment === 'blocked';
  if (jobNeedsSponsorshipBlock) {
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

function trackerEntry(fixture, job, evaluation, status) {
  const source = job?.source_platform || fixture.source;
  const title = job?.title || fixture.title;
  const company = job?.company_name || fixture.company;
  return `| ${fixture.id} | ${source} | ${title} | ${company} | ${status} | ${evaluation.recommendation.judgment} |`;
}

async function evaluateFixture({ fixture, normalizedJobs, diagnostics, profile, cvText, model, listingStatus }) {
  if (typeof model === 'string' && model !== 'deterministic-test-model') {
    throw new Error(`unexpected E2E model: ${model}`);
  }
  const modelInput = {
    fixture,
    normalizedJob: normalizedJobs[0] || null,
    profile,
    cvText,
    listingStatus,
  };
  const modelResult = typeof model === 'function'
    ? await model(modelInput)
    : undefined;
  const evaluation = modelResult || deterministicJapanModel(modelInput);
  return {
    evaluation,
    markdown: buildMarkdownReport(fixture, evaluation, normalizedJobs, diagnostics),
  };
}

/**
 * Run one sanitized listing through scan → normalize → deduplicate → evaluate → generate → track.
 * The only source I/O is the supplied fixture document; fetchText never calls global fetch.
 *
 * @param {{source: string, fixture: object, profile: object, outputDir: string, model: string|Function}} input
 * @returns {Promise<{normalizedJobs: object[], reportPaths: string[], generatedArtifactPaths: string[], trackerEntries: string[], diagnostics: string[]}>}
 */
export async function runJapanFixtureWorkflow({ source, fixture, profile, outputDir, model }) {
  if (!fixture || !/^[a-z0-9-]+$/.test(fixture.id || '')) throw new Error('fixture id must be sanitized');
  await mkdir(outputDir, { recursive: true });
  const diagnostics = [];
  const normalizedJobs = [];
  let listingStatus = 'ok';
  const providerSource = fixture.requested_source || source;
  const provider = await loadProvider(providerSource);
  const cvText = await readFile(CV_PATH, 'utf8');

  if (fixture.scenario === 'unsupported') {
    listingStatus = 'unsupported';
    diagnostics.push(`unsupported: ${fixture.requested_source || 'unknown source'} is not registered`);
  } else if (!provider) {
    listingStatus = 'unsupported';
    diagnostics.push(`unsupported: ${providerSource} is not registered`);
  } else {
    const scanOnce = async (documentHtml) => scanStructuredSource(
      fixtureEntry({ ...fixture, document_html: documentHtml }),
      provider,
      {
        fetchText: async () => documentHtml,
      },
    );

    const first = await scanOnce(fixture.document_html);
    if (first.status === 'ok') {
      normalizedJobs.push(...first.offers);
      if (fixture.classification_error) {
        listingStatus = classifyStructuredSourceError(new Error(fixture.classification_error));
        diagnostics.push(`${fixture.scenario}: status=${listingStatus}: ${fixture.classification_error}`);
        if (['stale', 'blocked'].includes(listingStatus)) {
          diagnostics.push(`${fixture.scenario}: adapter normalized ${first.offers.length} fixture job before status gate`);
          normalizedJobs.length = 0;
        }
      }
      if (fixture.duplicate_document_html) {
        const duplicate = await scanOnce(fixture.duplicate_document_html);
        if (duplicate.status === 'ok') normalizedJobs.push(...duplicate.offers);
      }
    } else {
      listingStatus = first.status;
      diagnostics.push(`${fixture.scenario}: status=${first.status}: ${first.error}`);
    }
  }

  const uniqueJobs = [];
  const fingerprints = new Set();
  for (const job of normalizedJobs) {
    assertNormalizedJapanJob(job);
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
  if (fixture.scenario === 'no-sponsorship' && normalizedJobs[0]?.visa_sponsorship === 'no' && needsSponsorship(profile)) {
    diagnostics.push('sponsorship-needed no-sponsorship: explicit no-sponsorship signal blocks eligibility');
  }

  const { evaluation, markdown } = await evaluateFixture({ fixture, normalizedJobs, diagnostics, profile, cvText, model, listingStatus });
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
    trackerEntries: [trackerEntry(fixture, normalizedJobs[0], evaluation, status)],
    diagnostics,
  };
}
