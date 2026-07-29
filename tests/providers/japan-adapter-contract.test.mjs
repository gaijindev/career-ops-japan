import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../helpers.mjs';

const { createJapanAdapterContract } = await import(pathToFileURL(join(ROOT, 'providers/_japan-adapter-contract.mjs')).href);
const { normalizeJapanJob } = await import(pathToFileURL(join(ROOT, 'providers/_japan-job-schema.mjs')).href);

function makeParsedRecord(overrides = {}) {
  return {
    source_platform: 'japan-dev',
    source_url: 'https://jobs.example.com/roles/123?utm_source=feed',
    source_job_id: 'job-123',
    title: 'Senior Platform Engineer',
    company_name: 'Example KK',
    location_text: 'Tokyo, Japan',
    scraped_at: '2026-07-29T00:00:00.000Z',
    raw_source_text: 'source text',
    source_fields_present: ['source_job_id', 'visa_sponsorship', 'japanese_level'],
    visa_sponsorship: 'unknown',
    japanese_level: 'not_applicable',
    ...overrides,
  };
}

test('createJapanAdapterContract requires search, parse, and normalize functions', () => {
  assert.throws(() => createJapanAdapterContract({ parse() {}, normalize() {} }), /search/);
  assert.throws(() => createJapanAdapterContract({ search() {}, normalize() {} }), /parse/);
  assert.throws(() => createJapanAdapterContract({ search() {}, parse() {}, normalize: true }), /normalize/);
});

test('adapter contract wraps search, parse, and normalize', async () => {
  const adapter = createJapanAdapterContract({
    async search(query) {
      return [{ href: 'https://jobs.example.com/roles/123', query }];
    },
    parse(raw) {
      return makeParsedRecord({ source_url: `${raw.href}?utm_source=feed` });
    },
    normalize(parsed) {
      return normalizeJapanJob(parsed);
    },
  });

  const raw = await adapter.search({ keyword: 'platform' });
  assert.deepEqual(raw, [{ href: 'https://jobs.example.com/roles/123', query: { keyword: 'platform' } }]);

  const parsed = adapter.parse(raw[0]);
  assert.equal(parsed.source_job_id, 'job-123');

  const normalized = adapter.normalize(parsed);
  assert.equal(normalized.canonical_url, 'https://jobs.example.com/roles/123');
});

test('adapter contract rejects invalid normalized records', () => {
  const adapter = createJapanAdapterContract({
    search() { return []; },
    parse() { return makeParsedRecord(); },
    normalize(parsed) {
      return normalizeJapanJob({ ...parsed, title: '' });
    },
  });

  assert.throws(() => adapter.normalize(adapter.parse({})), /title/);
});

test('adapter contract rejects duplicate fingerprints', () => {
  const adapter = createJapanAdapterContract({
    search() { return []; },
    parse() { return makeParsedRecord(); },
    normalize(parsed) {
      return normalizeJapanJob(parsed);
    },
  });

  adapter.normalize(adapter.parse({}));
  assert.throws(() => adapter.normalize(adapter.parse({})), /duplicate fingerprint/i);
});

test('adapter contract rejects guessed values for fields absent from the parsed source', () => {
  const adapter = createJapanAdapterContract({
    search() { return []; },
    parse() {
      return makeParsedRecord({
        source_fields_present: ['source_job_id', 'japanese_level'],
        visa_sponsorship: undefined,
      });
    },
    normalize(parsed) {
      return normalizeJapanJob({
        ...parsed,
        visa_sponsorship: 'yes',
      });
    },
  });

  assert.throws(() => adapter.normalize(adapter.parse({})), /visa_sponsorship/);
});

test('adapter contract rejects omitting source_job_id when the parsed source exposed it', () => {
  const adapter = createJapanAdapterContract({
    search() { return []; },
    parse() {
      return makeParsedRecord({
        source_fields_present: ['source_job_id'],
        source_job_id: undefined,
      });
    },
    normalize(parsed) {
      return normalizeJapanJob(parsed);
    },
  });

  assert.throws(() => adapter.normalize(adapter.parse({})), /source_job_id/);
});
