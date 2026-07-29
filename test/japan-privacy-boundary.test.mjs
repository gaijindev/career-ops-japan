import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
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
    'address=1-2-3 Fixture Street, Tokyo',
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
