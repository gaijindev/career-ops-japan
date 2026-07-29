#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ALLOWED_SOURCES = new Set(['tokyodev', 'gaijinpot', 'hellowork']);
const SECRET_ENV_NAMES = /(?:API_KEY|TOKEN|PASSWORD|SECRET|CLIENT_SECRET)/i;

function usage() {
  return [
    'Usage: node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo [--no-network]',
    '',
    'Runs the committed, synthetic Japan fixture workflow. Network is disabled by default.',
  ].join('\n');
}

function parseArgs(argv) {
  const args = { noNetwork: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--no-network') {
      args.noNetwork = true;
    } else if (arg === '--fixture-set' || arg === '--output-dir') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      args[arg.slice(2).replace('-', '')] = value;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (args.help) return args;
  if (!args.fixtureset) throw new Error('--fixture-set is required');
  if (!args.outputdir) throw new Error('--output-dir is required');
  return args;
}

async function assertTracked(pathname) {
  const repoRelative = relative(ROOT, pathname);
  if (!repoRelative || repoRelative.startsWith('..') || isAbsolute(repoRelative)) {
    throw new Error(`fixture must be inside the repository: ${pathname}`);
  }
  try {
    await execFileAsync('git', ['ls-files', '--error-unmatch', '--', repoRelative], { cwd: ROOT });
  } catch {
    throw new Error(`fixture is not committed: ${repoRelative}`);
  }
}

function assertSyntheticFixture(fixture, pathname) {
  if (!fixture || !/^[a-z0-9-]+$/.test(fixture.id || '')) {
    throw new Error(`fixture id must be lowercase and sanitized: ${pathname}`);
  }
  if (!ALLOWED_SOURCES.has(fixture.source)) {
    throw new Error(`${fixture.id}: unsupported demo source ${fixture.source}`);
  }
  if (typeof fixture.document_html !== 'string' || !/fixture|sanitized|example/i.test(fixture.document_html)) {
    throw new Error(`${fixture.id}: fixture document must contain synthetic evidence`);
  }
  const serialized = JSON.stringify(fixture);
  if (SECRET_ENV_NAMES.test(serialized) || /(?:sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._-]{12,})/i.test(serialized)) {
    throw new Error(`${fixture.id}: fixture contains a credential-like value`);
  }
}

async function loadFixtureSet(fixtureSetPath) {
  const manifestPath = join(fixtureSetPath, 'manifest.json');
  await assertTracked(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.format !== 'career-ops-japan-demo-v1' || !Array.isArray(manifest.fixtures) || manifest.fixtures.length === 0) {
    throw new Error('manifest.json must use career-ops-japan-demo-v1 and list fixtures');
  }
  const fixtures = [];
  for (const relativeFixturePath of manifest.fixtures) {
    if (typeof relativeFixturePath !== 'string' || relativeFixturePath.includes('..') || isAbsolute(relativeFixturePath)) {
      throw new Error(`manifest fixture path is unsafe: ${relativeFixturePath}`);
    }
    const fixturePath = resolve(fixtureSetPath, relativeFixturePath);
    if (!fixturePath.startsWith(`${fixtureSetPath}/`)) throw new Error(`manifest fixture path escapes fixture set: ${relativeFixturePath}`);
    await assertTracked(fixturePath);
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    assertSyntheticFixture(fixture, fixturePath);
    fixtures.push(fixture);
  }
  return { manifest, fixtures };
}

function installNoNetworkGuard() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Japan fixture demo attempted network access while --no-network is enabled');
  };
  return () => { globalThis.fetch = originalFetch; };
}

function trackerDocument(entries) {
  return [
    '# Japan fixture demo tracker',
    '',
    '| Fixture | Source | Role | Company | Status | Recommendation |',
    '|---|---|---|---|---|---|',
    ...entries,
    '',
  ].join('\n');
}

async function runDemo({ fixtureSet, outputDir, noNetwork = true }) {
  const fixtureSetPath = resolve(fixtureSet);
  const requestedOutputDir = resolve(outputDir);
  const { fixtures } = await loadFixtureSet(fixtureSetPath);

  if (noNetwork !== true) throw new Error('Japan fixture demo only supports --no-network mode');
  const restoreNetworkGuard = installNoNetworkGuard();
  const previousCwd = process.cwd();
  const moduleSandbox = await mkdtemp(join(tmpdir(), 'career-ops-japan-demo-module-'));
  try {
    // scan.mjs loads dotenv during import. Import the shared E2E harness from
    // a fresh directory so a user's repository .env is never read by demo
    // startup, while the actual fixture output remains under requestedOutputDir.
    process.chdir(moduleSandbox);
    const { runJapanFixtureWorkflow } = await import('../test/e2e/japan-career-ops-fixture.mjs');
    process.chdir(previousCwd);
    await rm(requestedOutputDir, { recursive: true, force: true });
    await mkdir(requestedOutputDir, { recursive: true });
    console.log(`Japan fixture demo (network: disabled)`);
    console.log(`[1/4] loaded ${fixtures.length} committed synthetic fixtures`);

    const results = [];
    for (const fixture of fixtures) {
      results.push(await runJapanFixtureWorkflow({
        source: fixture.source,
        fixture,
        profile: fixture.profile || {
          location: { needs_sponsorship: true },
          target_roles: { primary: ['software engineer', 'data analyst', 'product manager'] },
        },
        outputDir: requestedOutputDir,
        model: 'deterministic-test-model',
      }));
    }
    console.log(`[2/4] processed ${results.length} fixture listings through scan, normalize, evaluate`);

    const trackerEntries = results.flatMap((result) => result.trackerEntries);
    const reportPaths = results.flatMap((result) => result.reportPaths);
    const htmlPaths = results.flatMap((result) => result.generatedArtifactPaths);
    const trackerPath = join(requestedOutputDir, 'tracker', 'applications.md');
    const manifestPath = join(requestedOutputDir, 'artifacts', 'manifest.json');
    await mkdir(join(requestedOutputDir, 'tracker'), { recursive: true });
    await mkdir(join(requestedOutputDir, 'artifacts'), { recursive: true });
    await writeFile(trackerPath, trackerDocument(trackerEntries), 'utf8');
    await writeFile(manifestPath, `${JSON.stringify({
      fixture_count: fixtures.length,
      report_count: results.length,
      html_artifact_count: htmlPaths.length,
      tracker_entry_count: trackerEntries.length,
      network: 'disabled',
    }, null, 2)}\n`, 'utf8');
    await writeFile(join(requestedOutputDir, 'summary.json'), `${JSON.stringify({
      fixture_ids: fixtures.map((fixture) => fixture.id),
      reports: reportPaths.map((pathname) => relative(requestedOutputDir, pathname)),
      html_artifacts: htmlPaths.map((pathname) => relative(requestedOutputDir, pathname)),
      tracker: relative(requestedOutputDir, trackerPath),
      network: 'disabled',
    }, null, 2)}\n`, 'utf8');
    console.log(`[3/4] wrote ${results.length} reports + ${htmlPaths.length} HTML artifacts`);
    console.log(`[4/4] wrote tracker: ${relative(ROOT, trackerPath)}`);
    console.log(`Demo complete: ${fixtures.length} fixtures, ${results.length} reports, ${htmlPaths.length} HTML artifacts, ${trackerEntries.length} tracker entries`);
    return { results, trackerPath, manifestPath };
  } finally {
    process.chdir(previousCwd);
    await rm(moduleSandbox, { recursive: true, force: true });
    restoreNetworkGuard();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
    } else {
      await runDemo({ fixtureSet: args.fixtureset, outputDir: args.outputdir, noNetwork: args.noNetwork });
    }
  } catch (error) {
    console.error(`Japan fixture demo failed: ${error.message}`);
    console.error(usage());
    process.exitCode = 1;
  }
}

export { loadFixtureSet, parseArgs, runDemo };
