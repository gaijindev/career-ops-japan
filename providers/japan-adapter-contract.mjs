import {
  assertNormalizedJapanJob,
  fingerprintJapanJob,
} from './japan-job-schema.mjs';

const SENSITIVE_OPTIONAL_FIELDS = new Set([
  'posted_at',
  'updated_at',
  'salary_min',
  'salary_max',
  'salary_currency',
  'salary_period',
  'work_mode',
  'visa_sponsorship',
  'japanese_level',
]);

function assertFunction(adapter, field) {
  if (!adapter || typeof adapter[field] !== 'function') {
    throw new Error(`Japan adapter contract requires ${field}()`);
  }
}

function canBeAbsentValue(value) {
  return value === undefined || value === null || value === 'unknown' || value === 'not_applicable';
}

function assertNoGuessedValues(parsed, normalized) {
  const present = new Set(Array.isArray(parsed?.source_fields_present) ? parsed.source_fields_present : []);
  for (const field of SENSITIVE_OPTIONAL_FIELDS) {
    if (present.has(field)) continue;
    if (!canBeAbsentValue(normalized[field])) {
      throw new Error(`Normalized field ${field} was guessed even though it was absent from the source`);
    }
  }
}

export function createJapanAdapterContract(adapter) {
  assertFunction(adapter, 'search');
  assertFunction(adapter, 'parse');
  assertFunction(adapter, 'normalize');

  const seenFingerprints = new Set();

  return {
    async search(...args) {
      return await adapter.search(...args);
    },

    parse(...args) {
      return adapter.parse(...args);
    },

    normalize(...args) {
      const parsed = args[0];
      const normalized = adapter.normalize(...args);
      assertNormalizedJapanJob(normalized);
      assertNoGuessedValues(parsed, normalized);

      const fingerprint = fingerprintJapanJob(normalized);
      if (seenFingerprints.has(fingerprint)) {
        throw new Error(`Duplicate fingerprint detected: ${fingerprint}`);
      }
      seenFingerprints.add(fingerprint);
      return normalized;
    },
  };
}
