import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  assertNormalizedJapanJob,
  canonicalizeJapanJobUrl,
  fingerprintJapanJob,
  normalizeJapanJob,
} from './japan-job-schema.mjs';

function sha1(text) {
  return createHash('sha1').update(text).digest('hex');
}

function makeInput(overrides = {}) {
  return {
    source_platform: 'japan-dev',
    source_url: ' HTTPS://Jobs.Example.com/roles/123/?utm_source=linkedin&ref=feed#apply ',
    source_job_id: 'job-123',
    title: ' Senior Platform Engineer ',
    company_name: ' Example KK ',
    location_text: ' Tokyo, Japan ',
    scraped_at: '2026-07-29T00:00:00.000Z',
    posted_at: '2026-07-20T12:34:56+09:00',
    updated_at: new Date('2026-07-28T18:00:00+09:00'),
    raw_source_text: '年収 600万円〜850万円\nVisa: unknown\nJapanese: not applicable',
    salary_min: '6,000,000',
    salary_max: '8500000',
    salary_currency: 'jpy',
    salary_period: 'year',
    work_mode: 'unknown',
    visa_sponsorship: 'unknown',
    japanese_level: 'not_applicable',
    source_fields_present: [
      'salary_min',
      'salary_max',
      'salary_currency',
      'salary_period',
      'visa_sponsorship',
      'japanese_level',
      'posted_at',
      'updated_at',
    ],
    ...overrides,
  };
}

test('normalizeJapanJob normalizes required fields, salary numbers, timestamps, and raw text hash', () => {
  const input = makeInput();
  const normalized = normalizeJapanJob(input);

  assert.deepEqual(normalized, {
    source_platform: 'japan-dev',
    source_url: 'HTTPS://Jobs.Example.com/roles/123/?utm_source=linkedin&ref=feed#apply',
    canonical_url: 'https://jobs.example.com/roles/123',
    source_job_id: 'job-123',
    title: 'Senior Platform Engineer',
    company_name: 'Example KK',
    location_text: 'Tokyo, Japan',
    scraped_at: '2026-07-29T00:00:00.000Z',
    posted_at: '2026-07-20T03:34:56.000Z',
    updated_at: '2026-07-28T09:00:00.000Z',
    raw_source_text: input.raw_source_text,
    raw_text_hash: sha1(input.raw_source_text),
    salary_min: 6000000,
    salary_max: 8500000,
    salary_currency: 'JPY',
    salary_period: 'year',
    work_mode: 'unknown',
    visa_sponsorship: 'unknown',
    japanese_level: 'not_applicable',
    source_fields_present: [
      'japanese_level',
      'posted_at',
      'salary_currency',
      'salary_max',
      'salary_min',
      'salary_period',
      'updated_at',
      'visa_sponsorship',
    ],
  });

  assert.doesNotThrow(() => JSON.stringify(normalized));
});

test('normalizeJapanJob omits source_job_id when it is not provided', () => {
  const normalized = normalizeJapanJob(makeInput({ source_job_id: undefined }));

  assert.equal(Object.hasOwn(normalized, 'source_job_id'), false);
});

test('normalizeJapanJob preserves unknown versus not_applicable markers', () => {
  const normalized = normalizeJapanJob(makeInput({
    work_mode: 'not_applicable',
    visa_sponsorship: 'unknown',
    japanese_level: 'not_applicable',
  }));

  assert.equal(normalized.work_mode, 'not_applicable');
  assert.equal(normalized.visa_sponsorship, 'unknown');
  assert.equal(normalized.japanese_level, 'not_applicable');
});

test('assertNormalizedJapanJob identifies the exact missing required field', () => {
  assert.throws(
    () => assertNormalizedJapanJob(makeInput({ title: '   ' })),
    /title/,
  );

  const normalized = normalizeJapanJob(makeInput());
  assert.throws(
    () => assertNormalizedJapanJob({ ...normalized, source_job_id: '   ' }),
    /source_job_id/,
  );
});

test('canonicalizeJapanJobUrl removes tracking noise and normalizes host casing', () => {
  assert.equal(
    canonicalizeJapanJobUrl('https://Jobs.Example.com/roles/123/?b=2&utm_source=x&a=1#apply'),
    'https://jobs.example.com/roles/123?a=1&b=2',
  );
});

test('fingerprintJapanJob is stable for canonical URL variants and changes when the job identity changes', () => {
  const a = normalizeJapanJob(makeInput());
  const b = normalizeJapanJob(makeInput({
    source_url: 'https://jobs.example.com/roles/123/?utm_medium=email&utm_campaign=summer#details',
  }));
  const c = normalizeJapanJob(makeInput({
    source_job_id: 'job-999',
  }));

  assert.equal(fingerprintJapanJob(a), fingerprintJapanJob(b));
  assert.notEqual(fingerprintJapanJob(a), fingerprintJapanJob(c));
});
