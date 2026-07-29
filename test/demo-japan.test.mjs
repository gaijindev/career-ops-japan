import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const ROOT = join(import.meta.dirname, '..');
const DEMO_SCRIPT = join(ROOT, 'scripts', 'demo-japan.mjs');
const FIXTURE_SET = join(ROOT, 'evals', 'japan', 'demo');
const execFileAsync = promisify(execFile);

async function snapshotTree(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const pathname = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(pathname);
      } else {
        const bytes = await readFile(pathname);
        files.push([
          relative(root, pathname),
          {
            byteLength: bytes.length,
            sha256: createHash('sha256').update(bytes).digest('hex'),
            bytes,
          },
        ]);
      }
    }
  }
  await visit(root);
  return files;
}

test('Japan fixture demo is deterministic, offline, and writes the documented artifact set', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'career-ops-japan-demo-'));
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    DEMO_SCRIPT,
    '--fixture-set', 'evals/japan/demo',
    '--output-dir', outputDir,
    '--no-network',
  ], {
    cwd: ROOT,
    env: {
      ...process.env,
      OPENAI_API_KEY: 'must-not-be-read',
      ANTHROPIC_API_KEY: 'must-not-be-read',
      CAREER_OPS_DEMO_NETWORK_PROBE: 'must-fail-if-used',
    },
  });

  assert.equal(stderr, '');
  assert.match(stdout, /Japan fixture demo/);
  assert.match(stdout, /network: disabled/);
  assert.match(stdout, /Demo complete: 3 fixtures, 3 reports, 3 HTML artifacts, 3 tracker entries/);

  const reportFiles = (await readdir(join(outputDir, 'reports'))).sort();
  assert.deepEqual(reportFiles, [
    'demo-gaijinpot.html',
    'demo-gaijinpot.md',
    'demo-hellowork.html',
    'demo-hellowork.md',
    'demo-tokyodev.html',
    'demo-tokyodev.md',
  ]);
  assert.match(await readFile(join(outputDir, 'reports', 'demo-tokyodev.md'), 'utf8'), /deterministic-test-model/);
  assert.match(await readFile(join(outputDir, 'reports', 'demo-gaijinpot.html'), 'utf8'), /<!doctype html>/i);
  assert.match(await readFile(join(outputDir, 'tracker', 'applications.md'), 'utf8'), /demo-tokyodev/);

  const manifest = JSON.parse(await readFile(join(outputDir, 'artifacts', 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest, {
    fixture_count: 3,
    report_count: 3,
    html_artifact_count: 3,
    tracker_entry_count: 3,
    network: 'disabled',
  });

  const firstTree = await snapshotTree(outputDir);
  assert.ok(firstTree.some(([pathname]) => pathname === '.career-ops-japan-demo.json'));
  const secondRun = await execFileAsync(process.execPath, [
    DEMO_SCRIPT,
    '--fixture-set', 'evals/japan/demo',
    '--output-dir', outputDir,
  ], { cwd: ROOT, env: process.env });
  assert.equal(secondRun.stderr, '');
  assert.equal(secondRun.stdout, stdout);
  assert.deepEqual(await snapshotTree(outputDir), firstTree);
});

test('Japan fixture demo rejects a user-layer output target without touching its sentinel', async () => {
  const outputDir = join(ROOT, 'data', 'task-10-review-sentinel');
  const sentinelPath = join(outputDir, 'sentinel.txt');
  await mkdir(outputDir, { recursive: true });
  await writeFile(sentinelPath, 'must survive\n', 'utf8');

  try {
    await assert.rejects(
      execFileAsync(process.execPath, [
        DEMO_SCRIPT,
        '--fixture-set', 'evals/japan/demo',
        '--output-dir', outputDir,
      ], { cwd: ROOT }),
      (error) => {
        assert.match(error.stderr, /unsafe output directory|user-layer/i);
        return true;
      },
    );
    assert.equal(await readFile(sentinelPath, 'utf8'), 'must survive\n');
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
