import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function ignored(pathname) {
  try {
    execFileSync('git', ['check-ignore', '--no-index', '-q', '--', pathname], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

test('user-layer profile, reports, outputs, trackers, and model logs stay ignored', () => {
  const userLayerPaths = [
    'cv.md',
    'config/profile.yml',
    'modes/_profile.md',
    'reports/001-fixture.md',
    'output/001-fixture.pdf',
    'data/applications.md',
    'data/model-requests/001.jsonl',
    'batch/logs/model-request.log',
    '.career-ops-web/runs/001.md',
  ];

  for (const pathname of userLayerPaths) {
    assert.equal(ignored(pathname), true, `${pathname} must be ignored`);
  }
  assert.equal(ignored('test/fixtures/privacy-profile.md'), false, 'the synthetic fixture must remain reviewable');
});

test('privacy fixture contains synthetic values, not a real user-layer file', () => {
  const fixture = readFileSync(join(ROOT, 'test/fixtures/privacy-profile.md'), 'utf8');
  assert.match(fixture, /Synthetic fixture only/);
  assert.match(fixture, /example\.invalid/);
  assert.doesNotMatch(fixture, /\/Users\/[^\s/]+|\/home\/[^\s/]+/);
});

test('redaction removes personal values and credentials while retaining diagnostics', async () => {
  const { redactSensitiveText } = await import(pathToFileURL(join(ROOT, 'plugins/_engine.mjs')).href);
  const input = [
    'parser failure for source=tokyodev',
    'email=fixture.candidate@example.invalid',
    'phone=+81 90-0000-0000',
    '電話：+81 90-0000-0000',
    'address=1-2-3 Fixture Street, Tokyo',
    '住所：1-2-3 Fixture Street, Tokyo',
    'profile_id=profile-fixture-0001',
    'Authorization: Bearer fixture-token-000000000000',
    'OPENAI_API_KEY=sk-fixture-000000000000000000000000',
    'HTTP 429 while parsing listing',
  ].join('\n');

  const redacted = redactSensitiveText(input);

  assert.doesNotMatch(redacted, /fixture\.candidate@example\.invalid/);
  assert.doesNotMatch(redacted, /\+81 90-0000-0000/);
  assert.doesNotMatch(redacted, /1-2-3 Fixture Street/);
  assert.doesNotMatch(redacted, /profile-fixture-0001/);
  assert.doesNotMatch(redacted, /fixture-token-000000000000/);
  assert.doesNotMatch(redacted, /sk-fixture-000000000000000000000000/);
  assert.match(redacted, /parser failure/);
  assert.match(redacted, /source=tokyodev/);
  assert.match(redacted, /HTTP 429/);
});

test('plugin hook warnings and returned diagnostics redact sensitive error text', async () => {
  const { runHook } = await import(pathToFileURL(join(ROOT, 'plugins/_engine.mjs')).href);
  const sandbox = mkdtempSync(join(tmpdir(), 'career-ops-hook-privacy-'));
  const pluginDir = join(sandbox, 'plugins', 'privacy-hook');
  mkdirSync(pluginDir, { recursive: true });
  mkdirSync(join(sandbox, 'config'), { recursive: true });
  writeFileSync(join(sandbox, 'config', 'plugins.yml'), 'plugins:\n  privacy-hook: { enabled: true }\n');
  writeFileSync(join(pluginDir, 'manifest.json'), JSON.stringify({
    id: 'privacy-hook',
    apiVersion: 1,
    description: 'synthetic privacy hook',
    hooks: ['search'],
    requiredEnv: [],
    allowedHosts: [],
    humanInTheLoop: true,
  }));
  writeFileSync(join(pluginDir, 'index.mjs'), [
    'export default {',
    '  search() {',
    "    throw new Error('hook failed email=fixture.candidate@example.invalid address=1-2-3 Fixture Street token=fixture-token-000000 profile_id=profile-fixture-0001');",
    '  },',
    '};',
  ].join('\n'));

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.map(String).join(' '));
  try {
    const results = await runHook('search', 'synthetic query', { root: sandbox });
    assert.equal(results.length, 1);
    assert.equal(results[0].ok, false);
    const diagnostics = `${warnings.join('\n')}\n${results[0].error || ''}`;
    assert.doesNotMatch(diagnostics, /fixture\.candidate@example\.invalid/);
    assert.doesNotMatch(diagnostics, /1-2-3 Fixture Street/);
    assert.doesNotMatch(diagnostics, /fixture-token-000000/);
    assert.doesNotMatch(diagnostics, /profile-fixture-0001/);
    assert.match(diagnostics, /privacy-hook/);
    assert.match(diagnostics, /search hook failed/);
  } finally {
    console.warn = originalWarn;
  }
});

test('updater path coverage includes the privacy system files and passes', () => {
  const result = spawnSync(process.execPath, ['validate-system-paths-coverage.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('a source listing writes only the expected data inbox, never a path from listing content', async () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'career-ops-privacy-'));
  const outside = join(dirname(sandbox), 'privacy-boundary-outside.md');
  const previousCwd = process.cwd();
  process.chdir(sandbox);

  try {
    const scan = await import(`${pathToFileURL(join(ROOT, 'scan.mjs')).href}?privacy-boundary=${Date.now()}`);
    await scan.appendToPipeline([{
      url: 'https://jobs.example.invalid/fixture',
      company: 'Fixture Source',
      title: `Parser result ../../${outside}`,
      location: 'Tokyo',
    }]);

    const pipelinePath = join(sandbox, 'data', 'pipeline.md');
    assert.equal(statSync(pipelinePath).isFile(), true);
    assert.match(readFileSync(pipelinePath, 'utf8'), /Fixture Source/);
    assert.equal(existsSync(outside), false, 'listing content must not become an outside write target');
  } finally {
    process.chdir(previousCwd);
  }
});

test('source parser paths outside the checkout are rejected', async () => {
  const { default: localParser } = await import(pathToFileURL(join(ROOT, 'providers/local-parser.mjs')).href);
  assert.equal(localParser.detect({ parser: { command: 'node', script: '/tmp/not-a-project-script.mjs' } }), null);
});
