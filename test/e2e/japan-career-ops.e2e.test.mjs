import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import yaml from 'js-yaml';

import { runJapanFixtureWorkflow } from './japan-career-ops-fixture.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const EVALS_DIR = join(ROOT, 'evals', 'japan');
const LISTINGS_DIR = join(EVALS_DIR, 'listings');
const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');

async function loadFixtureProfile() {
  return yaml.load(await readFile(join(FIXTURES_DIR, 'profile.yml'), 'utf8'));
}

async function loadCases() {
  const files = (await readdir(LISTINGS_DIR)).filter((file) => file.endsWith('.json')).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(join(LISTINGS_DIR, file), 'utf8'))));
}

async function loadLabel(item) {
  return JSON.parse(await readFile(join(EVALS_DIR, 'labels', item.label_file), 'utf8'));
}

test('Japan benchmark has exactly 36 sanitized, labeled listing cases', async () => {
  const cases = await loadCases();
  assert.equal(cases.length, 36);

  const sources = new Set(cases.map((item) => item.source));
  assert.deepEqual([...sources].sort(), ['gaijinpot', 'hellowork', 'tokyodev']);
  for (const item of cases) {
    assert.match(item.id, /^jp-\d{2}$/);
    assert.ok(item.category);
    assert.ok(item.document_html);
    assert.match(item.document_html, /fixture|sanitized|example/i);
    assert.ok(item.label_file);
    const label = await loadLabel(item);
    for (const section of ['role_fit', 'eligibility', 'offer_quality', 'confidence', 'recommendation']) {
      assert.equal(typeof label[section]?.judgment, 'string');
      assert.ok(Array.isArray(label[section]?.evidence) && label[section].evidence.length > 0);
      assert.ok(label[section].evidence.every((evidence) => evidence.source && evidence.quote));
    }
  }
});

test('fixture workflow is offline, evaluates all sources, generates local artifacts, and tracks sanitized jobs', async () => {
  const profile = await loadFixtureProfile();
  const cases = await loadCases();
  const outputDir = await mkdtemp(join(tmpdir(), 'career-ops-japan-e2e-'));
  let networkCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    networkCalls += 1;
    throw new Error('live network access is forbidden in Japan fixture E2E');
  };

  try {
    const results = [];
    for (const fixture of cases) {
      results.push(await runJapanFixtureWorkflow({
        source: fixture.source,
        fixture,
        profile,
        outputDir,
        model: 'deterministic-test-model',
      }));
    }

    assert.equal(networkCalls, 0);
    assert.equal(results.length, 36);
    assert.ok(results.every((result) => Array.isArray(result.normalizedJobs)));
    assert.ok(results.every((result) => Array.isArray(result.reportPaths)));
    assert.ok(results.every((result) => Array.isArray(result.generatedArtifactPaths)));
    assert.ok(results.every((result) => Array.isArray(result.trackerEntries)));
    assert.ok(results.every((result) => Array.isArray(result.diagnostics)));

    const expectedTracker = await readFile(join(FIXTURES_DIR, 'expected-tracker.md'), 'utf8');
    const trackerText = results.flatMap((result) => result.trackerEntries).join('\n');
    assert.equal(trackerText, expectedTracker.trim());

    const userLayerText = `${JSON.stringify(results)}${trackerText}`;
    assert.doesNotMatch(userLayerText, /Aaron|Chanthavong|aaron|@gmail|@outlook|real[- ]?candidate/i);
    assert.doesNotMatch(userLayerText, /Fixture Candidate|Synthetic Fixture CV|requires employer sponsorship/i);
    assert.doesNotMatch(userLayerText, /password|secret|token|authorization/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fixture workflow diagnoses malformed, incomplete, stale, duplicate, unsupported, blocked, and sponsorship-blocked cases', async () => {
  const profile = await loadFixtureProfile();
  const cases = await loadCases();
  const outputDir = await mkdtemp(join(tmpdir(), 'career-ops-japan-errors-'));
  const byScenario = new Map(cases.map((item) => [item.scenario, item]));

  for (const scenario of ['malformed-html', 'missing-salary', 'anonymous-employer', 'stale', 'duplicate', 'unsupported', 'blocked', 'no-sponsorship']) {
    const fixture = byScenario.get(scenario);
    assert.ok(fixture, `fixture scenario ${scenario} should exist`);
    const result = await runJapanFixtureWorkflow({
      source: fixture.source,
      fixture,
      profile,
      outputDir,
      model: 'deterministic-test-model',
    });
    assert.ok(result.diagnostics.some((diagnostic) => diagnostic.includes(scenario)), scenario);
  }

  const sponsorship = await runJapanFixtureWorkflow({
    source: byScenario.get('no-sponsorship').source,
    fixture: byScenario.get('no-sponsorship'),
    profile,
    outputDir,
    model: 'deterministic-test-model',
  });
  const sponsorshipReport = await readFile(sponsorship.reportPaths[0], 'utf8');
  assert.match(sponsorshipReport, /Eligibility blocker/);
  assert.ok(sponsorship.diagnostics.some((diagnostic) => /sponsorship-needed.*no-sponsorship/i.test(diagnostic)));
});
