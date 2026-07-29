import { createHash } from 'node:crypto';

const REQUIRED_FIELDS = [
  'source_platform',
  'source_url',
  'title',
  'company_name',
  'location_text',
  'scraped_at',
  'raw_source_text',
];

const TRACKING_QUERY_KEYS = new Set([
  'fbclid',
  'gclid',
  'ref',
  'ref_src',
  'source',
]);

const STATUS_FIELDS = new Map([
  ['work_mode', new Set(['remote', 'hybrid', 'onsite', 'unknown', 'not_applicable'])],
  ['visa_sponsorship', new Set(['yes', 'no', 'unknown', 'not_applicable'])],
  ['japanese_level', new Set(['none', 'basic', 'business', 'fluent', 'native', 'unknown', 'not_applicable'])],
]);

const OPTIONAL_FIELDS = [
  'source_job_id',
  'posted_at',
  'updated_at',
  'salary_min',
  'salary_max',
  'salary_currency',
  'salary_period',
  'work_mode',
  'visa_sponsorship',
  'japanese_level',
  'source_fields_present',
];

function sha1(text) {
  return createHash('sha1').update(String(text)).digest('hex');
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeRequiredString(value, field) {
  const trimmed = trimString(value);
  if (typeof trimmed !== 'string' || trimmed.length === 0) {
    throw new Error(`Missing required field: ${field}`);
  }
  return trimmed;
}

function normalizeOptionalString(value, field) {
  if (value == null) return undefined;
  const trimmed = trimString(value);
  if (typeof trimmed !== 'string' || trimmed.length === 0) {
    throw new Error(`Blank optional field: ${field}`);
  }
  return trimmed;
}

function normalizeTimestamp(value, field, required = false) {
  if (value == null) {
    if (required) throw new Error(`Missing required field: ${field}`);
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp for field: ${field}`);
  }
  return date.toISOString();
}

function normalizeNumeric(value, field) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`Invalid numeric field: ${field}`);
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    if (!cleaned) throw new Error(`Invalid numeric field: ${field}`);
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric field: ${field}`);
    return parsed;
  }
  throw new Error(`Invalid numeric field: ${field}`);
}

function normalizeStatus(value, field) {
  if (value == null) return undefined;
  const trimmed = normalizeOptionalString(value, field);
  const allowed = STATUS_FIELDS.get(field);
  if (!allowed.has(trimmed)) throw new Error(`Invalid ${field}: ${trimmed}`);
  return trimmed;
}

function normalizeSourceFieldsPresent(value) {
  if (value == null) return undefined;
  if (!Array.isArray(value)) throw new Error('Invalid source_fields_present');
  const unique = new Set();
  for (const item of value) {
    const trimmed = trimString(item);
    if (typeof trimmed !== 'string' || trimmed.length === 0) {
      throw new Error('Invalid source_fields_present');
    }
    unique.add(trimmed);
  }
  return [...unique].sort();
}

function requiresSourceJobId(sourceFieldsPresent) {
  return Array.isArray(sourceFieldsPresent) && sourceFieldsPresent.includes('source_job_id');
}

export function canonicalizeJapanJobUrl(url) {
  const raw = normalizeRequiredString(url, 'source_url');
  const parsed = new URL(raw);
  parsed.hash = '';
  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) {
    parsed.port = '';
  }
  if (parsed.pathname !== '/') parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';

  const kept = [];
  for (const [key, value] of parsed.searchParams.entries()) {
    const lower = key.toLowerCase();
    if (lower.startsWith('utm_') || TRACKING_QUERY_KEYS.has(lower)) continue;
    kept.push([key, value]);
  }
  kept.sort(([a], [b]) => a.localeCompare(b));
  parsed.search = '';
  for (const [key, value] of kept) parsed.searchParams.append(key, value);
  return parsed.toString();
}

export function assertNormalizedJapanJob(job) {
  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    throw new Error('Normalized Japan job must be an object');
  }

  for (const field of REQUIRED_FIELDS) {
    normalizeRequiredString(job[field], field);
  }

  normalizeRequiredString(job.canonical_url, 'canonical_url');
  normalizeRequiredString(job.raw_text_hash, 'raw_text_hash');
  if (job.canonical_url !== canonicalizeJapanJobUrl(job.source_url)) {
    throw new Error('canonical_url must match canonicalized source_url');
  }
  if (job.raw_text_hash !== sha1(job.raw_source_text)) {
    throw new Error('raw_text_hash must match raw_source_text');
  }

  normalizeTimestamp(job.scraped_at, 'scraped_at', true);
  if (job.posted_at !== undefined) normalizeTimestamp(job.posted_at, 'posted_at');
  if (job.updated_at !== undefined) normalizeTimestamp(job.updated_at, 'updated_at');
  const sourceFieldsPresent = job.source_fields_present !== undefined
    ? normalizeSourceFieldsPresent(job.source_fields_present)
    : undefined;
  if (job.source_job_id !== undefined) normalizeOptionalString(job.source_job_id, 'source_job_id');
  if (requiresSourceJobId(sourceFieldsPresent) && job.source_job_id === undefined) {
    throw new Error('Missing required field: source_job_id');
  }
  if (job.salary_min !== undefined) normalizeNumeric(job.salary_min, 'salary_min');
  if (job.salary_max !== undefined) normalizeNumeric(job.salary_max, 'salary_max');
  if (job.salary_currency !== undefined) normalizeOptionalString(job.salary_currency, 'salary_currency');
  if (job.salary_period !== undefined) normalizeOptionalString(job.salary_period, 'salary_period');
  if (job.work_mode !== undefined) normalizeStatus(job.work_mode, 'work_mode');
  if (job.visa_sponsorship !== undefined) normalizeStatus(job.visa_sponsorship, 'visa_sponsorship');
  if (job.japanese_level !== undefined) normalizeStatus(job.japanese_level, 'japanese_level');
  if (job.source_fields_present !== undefined) normalizeSourceFieldsPresent(job.source_fields_present);
}

export function normalizeJapanJob(input) {
  const sourceFieldsPresent = normalizeSourceFieldsPresent(input?.source_fields_present);
  const normalized = {
    source_platform: normalizeRequiredString(input?.source_platform, 'source_platform'),
    source_url: normalizeRequiredString(input?.source_url, 'source_url'),
    canonical_url: canonicalizeJapanJobUrl(input?.source_url),
    title: normalizeRequiredString(input?.title, 'title'),
    company_name: normalizeRequiredString(input?.company_name, 'company_name'),
    location_text: normalizeRequiredString(input?.location_text, 'location_text'),
    scraped_at: normalizeTimestamp(input?.scraped_at, 'scraped_at', true),
    raw_source_text: normalizeRequiredString(input?.raw_source_text, 'raw_source_text'),
  };

  const sourceJobId = normalizeOptionalString(input?.source_job_id, 'source_job_id');
  if (sourceJobId !== undefined) normalized.source_job_id = sourceJobId;
  if (requiresSourceJobId(sourceFieldsPresent) && sourceJobId === undefined) {
    throw new Error('Missing required field: source_job_id');
  }

  const postedAt = normalizeTimestamp(input?.posted_at, 'posted_at');
  if (postedAt !== undefined) normalized.posted_at = postedAt;

  const updatedAt = normalizeTimestamp(input?.updated_at, 'updated_at');
  if (updatedAt !== undefined) normalized.updated_at = updatedAt;

  normalized.raw_text_hash = sha1(normalized.raw_source_text);

  const salaryMin = normalizeNumeric(input?.salary_min, 'salary_min');
  if (salaryMin !== undefined) normalized.salary_min = salaryMin;

  const salaryMax = normalizeNumeric(input?.salary_max, 'salary_max');
  if (salaryMax !== undefined) normalized.salary_max = salaryMax;

  const salaryCurrency = normalizeOptionalString(input?.salary_currency, 'salary_currency');
  if (salaryCurrency !== undefined) normalized.salary_currency = salaryCurrency.toUpperCase();

  const salaryPeriod = normalizeOptionalString(input?.salary_period, 'salary_period');
  if (salaryPeriod !== undefined) normalized.salary_period = salaryPeriod;

  const workMode = normalizeStatus(input?.work_mode, 'work_mode');
  if (workMode !== undefined) normalized.work_mode = workMode;

  const visaSponsorship = normalizeStatus(input?.visa_sponsorship, 'visa_sponsorship');
  if (visaSponsorship !== undefined) normalized.visa_sponsorship = visaSponsorship;

  const japaneseLevel = normalizeStatus(input?.japanese_level, 'japanese_level');
  if (japaneseLevel !== undefined) normalized.japanese_level = japaneseLevel;

  if (sourceFieldsPresent !== undefined) normalized.source_fields_present = sourceFieldsPresent;

  assertNormalizedJapanJob(normalized);
  return normalized;
}

export function fingerprintJapanJob(job) {
  assertNormalizedJapanJob(job);
  return sha1(JSON.stringify({
    source_platform: job.source_platform,
    canonical_url: job.canonical_url,
    source_job_id: job.source_job_id || '',
    title: job.title,
    company_name: job.company_name,
    location_text: job.location_text,
  }));
}

export const JAPAN_JOB_SCHEMA_FIELDS = Object.freeze({
  required: [...REQUIRED_FIELDS, 'canonical_url', 'raw_text_hash'],
  optional: [...OPTIONAL_FIELDS],
});
