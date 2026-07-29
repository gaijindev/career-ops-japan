import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../tests/helpers.mjs';

const fixture = JSON.parse(readFileSync(join(ROOT, 'test/fixtures/japan-scan-results.json'), 'utf8'));
const { loadProviders } = await import(pathToFileURL(join(ROOT, 'providers/_registry.mjs')).href);
const {
  PROVIDERS_DIR,
  classifyStructuredSourceError,
  formatPipelineOffer,
  normalizeUrlForDedup,
  scanStructuredSource,
} = await import(pathToFileURL(join(ROOT, 'scan.mjs')).href);

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

test('A pasted URL with an unrecognized source remains a usable bare pipeline entry', () => {
  assert.equal(
    formatPipelineOffer({ url: fixture.manual_url }),
    `- [ ] ${fixture.manual_url}`,
  );
});
