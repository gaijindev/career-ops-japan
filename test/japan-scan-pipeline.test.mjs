import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../tests/helpers.mjs';

const fixture = JSON.parse(readFileSync(join(ROOT, 'test/fixtures/japan-scan-results.json'), 'utf8'));
const {
  loadProviders,
  resolveProvider,
} = await import(pathToFileURL(join(ROOT, 'providers/_registry.mjs')).href);
const {
  PROVIDERS_DIR,
  classifyStructuredSourceError,
  formatPipelineOffer,
  normalizeUrlForDedup,
  scanStructuredSource,
} = await import(pathToFileURL(join(ROOT, 'scan.mjs')).href);
const { verifyCompanies } = await import(pathToFileURL(join(ROOT, 'verify-portals.mjs')).href);

function readLocalFixture(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

test('Japan structured providers feed the scan pipeline with normalized metadata and URL dedup, without network access', async () => {
  const providers = await loadProviders(PROVIDERS_DIR);
  const offers = [];
  let networkCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    networkCalls++;
    throw new Error('network fetch is not allowed in this fixture-only test');
  };

  try {
    for (const source of fixture.sources) {
      const provider = providers.get(source.provider);
      assert.ok(provider, `provider ${source.provider} should load`);

      const result = await scanStructuredSource(source.entry, provider, {
        fetchText: async (url) => {
          const relative = source.responses?.[url];
          if (!relative) throw new Error(`unexpected fixture fetch: ${url}`);
          return readLocalFixture(relative);
        },
      });

      assert.equal(result.status, 'ok');
      offers.push(...result.offers);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  const deduped = [];
  const seen = new Set();
  for (const offer of offers) {
    const key = normalizeUrlForDedup(offer.url);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(offer);
  }

  assert.equal(networkCalls, 0);
  assert.equal(deduped.length, 3);

  for (const offer of deduped) {
    assert.equal(typeof offer.source_platform, 'string');
    assert.equal(typeof offer.source_url, 'string');
    assert.ok(Array.isArray(offer.source_fields_present));
    assert.equal(typeof offer.raw_source_text, 'string');
    assert.equal(offer.url, offer.source_url);
    assert.equal(offer.company, offer.company_name);
    assert.equal(offer.location, offer.location_text);
  }

  assert.deepEqual(
    deduped.map((offer) => offer.source_platform).sort(),
    ['gaijinpot', 'hellowork', 'tokyodev'],
  );
});

test('Structured-source failures map to explicit blocked/stale/incomplete/changed statuses', () => {
  for (const sample of fixture.statuses) {
    assert.equal(
      classifyStructuredSourceError(new Error(sample.message)),
      sample.status,
      sample.label,
    );
  }
});

test('Explicit source selection is authoritative when source and provider conflict', async () => {
  const providers = await loadProviders(PROVIDERS_DIR);
  const resolved = resolveProvider(
    {
      name: 'Conflicting explicit source',
      source: 'tokyodev',
      provider: 'hellowork',
      careers_url: 'https://www.tokyodev.com/jobs/senior',
    },
    providers,
  );

  assert.equal(resolved?.provider?.id, 'tokyodev');
});

test('Explicit source overlays provider for legacy detector and fetch compatibility', async () => {
  const providers = await loadProviders(PROVIDERS_DIR);
  const entry = {
    name: 'Teamtailor conflict fixture',
    source: 'teamtailor',
    provider: 'hellowork',
    careers_url: 'https://careers.example.com/jobs',
  };
  const resolved = resolveProvider(entry, providers);

  assert.equal(resolved?.provider?.id, 'teamtailor');
  assert.equal(resolved?.entry?.provider, 'teamtailor');

  const result = await scanStructuredSource(resolved.entry, resolved.provider, {
    fetchText: async (url, options) => {
      assert.equal(url, 'https://careers.example.com/jobs.rss');
      assert.deepEqual(options, { redirect: 'error' });
      return '<rss><channel><item><title>Platform Engineer</title><link>https://careers.example.com/jobs/platform-engineer</link><tt:city>Tokyo</tt:city><tt:country>Japan</tt:country></item></channel></rss>';
    },
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.offers[0]?.title, 'Platform Engineer');
});

test('Explicit source bypasses ATS liveness shortcuts while provider-only entries retain legacy routing', async () => {
  const routingFixture = fixture.verify_source_routing;
  const atsCalls = [];
  const providerCalls = [];
  const providers = new Map([
    ['teamtailor', {
      id: routingFixture.provider,
      fetch: async (entry, ctx) => {
        providerCalls.push({ entry, maxPages: ctx.maxPages });
        return [{ title: 'Teamtailor fixture job' }];
      },
    }],
    ['greenhouse', {
      id: 'greenhouse',
      fetch: async () => [],
    }],
  ]);
  const fetchJson = async (url) => {
    atsCalls.push(url);
    return { jobs: [{ id: 'ats-should-not-run' }] };
  };
  const httpCtx = {
    fetchJson: async () => ({ jobs: [] }),
    fetchText: async () => '',
  };

  const sourceResults = await verifyCompanies([routingFixture.entry], { fetchJson, providers, httpCtx });
  assert.equal(sourceResults[0]?.provider, 'teamtailor');
  assert.equal(sourceResults[0]?.status, 'live');
  assert.equal(atsCalls.length, 0);
  assert.equal(providerCalls.length, 1);
  assert.equal(providerCalls[0].entry.provider, 'teamtailor');
  assert.equal(providerCalls[0].maxPages, 1);

  const unsupportedResults = await verifyCompanies([
    { ...routingFixture.entry, source: 'missing-source' },
  ], { fetchJson, providers, httpCtx });
  assert.equal(unsupportedResults[0]?.status, 'skipped');
  assert.equal(unsupportedResults[0]?.reason, 'unsupported source: missing-source');
  assert.equal(atsCalls.length, 0);

  const legacyResults = await verifyCompanies([
    { ...routingFixture.entry, source: undefined, provider: 'greenhouse' },
  ], { fetchJson, providers, httpCtx });
  assert.equal(legacyResults[0]?.ats, 'greenhouse');
  assert.equal(legacyResults[0]?.status, 'live');
  assert.equal(atsCalls.length, 1);
  assert.equal(providerCalls.length, 1);
});

test('Unsupported explicit source and legacy provider diagnostics stay distinct', async () => {
  const providers = await loadProviders(PROVIDERS_DIR);

  assert.deepEqual(
    resolveProvider(
      { name: 'Bad source', source: 'not-a-provider', provider: 'hellowork' },
      providers,
    ),
    { error: 'unsupported source: not-a-provider' },
  );

  assert.deepEqual(
    resolveProvider(
      { name: 'Bad legacy provider', provider: 'not-a-provider' },
      providers,
    ),
    { error: 'unsupported provider: not-a-provider' },
  );
});

test('A pasted URL with an unrecognized source remains a usable bare pipeline entry', () => {
  assert.equal(
    formatPipelineOffer({ url: fixture.manual_url }),
    `- [ ] ${fixture.manual_url}`,
  );
});
