// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

import { normalizeJapanJob } from './_japan-job-schema.mjs';

const HELLOWORK_HOST_RE = /(^|\.)hellowork\.mhlw\.go\.jp$/i;

function decodeHtml(text) {
  return String(text || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(documentText) {
  return decodeHtml(String(documentText || ''))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|h1|h2|h3|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function keyedFieldsFromText(text) {
  const map = new Map();
  for (const rawLine of text.split('\n')) {
    const line = cleanText(rawLine);
    if (!line) continue;
    const match = line.match(/^(.+?)\s*[|｜]\s*(.+)$/);
    if (!match) continue;
    const key = cleanText(match[1]);
    const value = cleanText(match[2]);
    if (!key || !value) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }
  return map;
}

function firstField(fields, label) {
  const values = fields.get(label);
  return values && values.length ? values[0] : '';
}

function lastField(fields, label) {
  const values = fields.get(label);
  return values && values.length ? values[values.length - 1] : '';
}

function parseSalaryRange(text) {
  const amounts = [...String(text || '').matchAll(/([\d,]+)\s*円/g)]
    .map((match) => Number(match[1].replace(/,/g, '')))
    .filter(Number.isFinite);
  return {
    salary_min: amounts[0],
    salary_max: amounts[1] ?? amounts[0],
  };
}

function mapSalaryPeriod(text) {
  if (/月給/.test(text)) return 'month';
  if (/時給/.test(text)) return 'hour';
  if (/日給/.test(text)) return 'day';
  if (/年俸/.test(text)) return 'year';
  return undefined;
}

function mapJapaneseLevel(text) {
  const value = cleanText(text);
  if (!value) return 'unknown';
  if (/ネイティブ|母語|日本語ネイティブ/.test(value)) return 'native';
  if (/流暢|堪能|N1|上級/.test(value)) return 'fluent';
  if (/ビジネス|N2|ＢＪＴ|BJT/.test(value)) return 'business';
  if (/N3|N4|N5|日常会話|中級|初級/.test(value)) return 'basic';
  if (/不要|不問/.test(value)) return 'none';
  return 'unknown';
}

function mapEmployerVisibility(text, fields) {
  const scope = firstField(fields, '公開範囲');
  if (/^２/.test(scope) || /求職者に限定/.test(scope) || /求職登録した方のみ/.test(text)) return 'registered-users-only';
  if (/^１/.test(scope) || /すべての利用者|すべての方|含む求人情報を公開/.test(scope)) return 'public';
  if (/^３/.test(scope) || /公開しない|含まない/.test(scope)) return 'hidden';
  return 'unknown';
}

function canonicalCompanyName(fields, rawSourceText, visibility) {
  if (visibility === 'registered-users-only' && /求職登録した方のみ/.test(rawSourceText)) {
    return '求職者限定';
  }
  const company = lastField(fields, '事業所名');
  if (company) return company;
  return visibility === 'registered-users-only' ? '求職者限定' : '事業所名等非公開';
}

function canonicalLocation(fields) {
  return cleanText(firstField(fields, '就業場所').replace(/受動喫煙対策.*$/, ''));
}

function sourceFieldsPresent(record) {
  const present = [];
  if (record.source_job_id) present.push('source_job_id');
  if (record.salary_min != null) present.push('salary_min');
  if (record.salary_max != null) present.push('salary_max');
  if (record.salary_currency) present.push('salary_currency');
  if (record.salary_period) present.push('salary_period');
  if (record.japanese_level && record.japanese_level !== 'unknown') present.push('japanese_level');
  return present;
}

function listUrls(filters) {
  if (Array.isArray(filters)) return filters.filter((value) => typeof value === 'string' && value.trim());
  const urls = [];
  if (typeof filters?.sourceUrl === 'string' && filters.sourceUrl.trim()) urls.push(filters.sourceUrl.trim());
  for (const value of [filters?.urls, filters?.sourceUrls, filters?.hellowork?.urls]) {
    if (!Array.isArray(value)) continue;
    for (const url of value) {
      if (typeof url === 'string' && url.trim()) urls.push(url.trim());
    }
  }
  return [...new Set(urls)];
}

export async function searchHelloWork(filters, { fetchText } = {}) {
  if (typeof fetchText !== 'function') {
    throw new Error('searchHelloWork requires fetchText(url)');
  }
  const urls = listUrls(filters);
  const jobs = [];
  for (const url of urls) {
    const documentText = await fetchText(url);
    jobs.push(parseHelloWorkListing(documentText, url));
  }
  return jobs;
}

export function parseHelloWorkListing(documentText, sourceUrl) {
  const raw_source_text = stripHtml(documentText);
  const fields = keyedFieldsFromText(raw_source_text);
  const salaryText = firstField(fields, 'ａ ＋ ｂ（固定残業代がある場合はａ ＋ ｂ ＋ ｃ）') || firstField(fields, 'ａ ＋ ｂ');
  const salaryShape = parseSalaryRange(salaryText);
  const visibility = mapEmployerVisibility(raw_source_text, fields);
  const notesText = [
    firstField(fields, '求人に関する特記事項'),
    firstField(fields, '応募書類等'),
    firstField(fields, 'オンライン自主応募の受付'),
    firstField(fields, '仕事内容'),
  ].filter(Boolean).join(' ');
  const japaneseEvidence = [
    firstField(fields, '必要な日本語レベル'),
    firstField(fields, '求人に関する特記事項'),
    firstField(fields, '必要な経験等'),
  ].filter(Boolean).join(' ');

  const record = {
    source_platform: 'hellowork',
    source_url: String(sourceUrl || '').trim(),
    source_job_id: firstField(fields, '求人番号'),
    title: firstField(fields, '職種'),
    company_name: canonicalCompanyName(fields, raw_source_text, visibility),
    location_text: canonicalLocation(fields),
    scraped_at: new Date().toISOString(),
    raw_source_text,
    salary_min: salaryShape.salary_min,
    salary_max: salaryShape.salary_max,
    salary_currency: salaryShape.salary_min != null ? 'JPY' : undefined,
    salary_period: mapSalaryPeriod(firstField(fields, '賃金形態等')),
    work_mode: 'unknown',
    visa_sponsorship: 'unknown',
    japanese_level: mapJapaneseLevel(japaneseEvidence),
    online_application_acceptance: firstField(fields, 'オンライン自主応募の受付'),
    employer_visibility: visibility,
    employment_type_text: firstField(fields, '雇用形態'),
    working_hours_text: firstField(fields, '就業時間'),
    overtime_text: firstField(fields, '時間外労働時間'),
    holidays_text: firstField(fields, '休日等'),
    workplace_text: firstField(fields, '就業場所'),
    required_experience_text: firstField(fields, '必要な経験等'),
    wage_payment_text: firstField(fields, '賃金支払日'),
    wage_closing_text: firstField(fields, '賃金締切日'),
    application_documents_text: firstField(fields, '応募書類等'),
    application_instructions_text: cleanText(notesText),
  };
  record.source_fields_present = sourceFieldsPresent(record);
  return record;
}

export function classifyHelloWorkApplication(record) {
  const online = cleanText(record?.online_application_acceptance);
  const docs = cleanText(record?.application_documents_text);
  const notes = cleanText(record?.application_instructions_text);
  const combined = `${docs} ${notes}`;

  if (/可/.test(online) && !/不可/.test(online)) return 'online-self-application';
  if (/オンライン自主応募/.test(combined) && /紹介状は不要/.test(combined)) return 'online-self-application';
  if (/ハローワーク紹介状|紹介状/.test(docs)) return 'hello-work-introduction';
  if (/ハローワークより連絡|ハローワークを通じて/.test(notes)) return 'hello-work-introduction';
  if (/電話連絡|事業所へ連絡|直接応募|郵送|Ｅメール|Eメール|持参/.test(notes)) return 'manual-contact';
  return 'unknown';
}

export function normalizeHelloWorkListing(rawJob) {
  return normalizeJapanJob({
    source_platform: 'hellowork',
    source_url: rawJob.source_url,
    source_job_id: rawJob.source_job_id,
    title: rawJob.title,
    company_name: rawJob.company_name,
    location_text: rawJob.location_text,
    scraped_at: rawJob.scraped_at,
    raw_source_text: rawJob.raw_source_text,
    salary_min: rawJob.salary_min,
    salary_max: rawJob.salary_max,
    salary_currency: rawJob.salary_currency,
    salary_period: rawJob.salary_period,
    work_mode: rawJob.work_mode || 'unknown',
    visa_sponsorship: rawJob.visa_sponsorship || 'unknown',
    japanese_level: rawJob.japanese_level || 'unknown',
    source_fields_present: rawJob.source_fields_present,
  });
}

/** @type {Provider & {search: typeof searchHelloWork, parse: typeof parseHelloWorkListing, normalize: typeof normalizeHelloWorkListing}} */
const provider = {
  id: 'hellowork',

  detect(entry) {
    if (entry?.provider === 'hellowork') return { url: listUrls(entry).at(0) || '' };
    const raw = entry?.careers_url;
    if (!raw) return null;
    try {
      const url = new URL(raw);
      return HELLOWORK_HOST_RE.test(url.hostname) ? { url: url.toString() } : null;
    } catch {
      return null;
    }
  },

  async fetch(entry, ctx) {
    const records = await searchHelloWork(entry?.hellowork || entry || {}, ctx);
    return records.map((record) => ({
      title: record.title,
      url: record.source_url,
      company: record.company_name,
      location: record.location_text,
    }));
  },
};

provider.search = searchHelloWork;
provider.parse = parseHelloWorkListing;
provider.normalize = normalizeHelloWorkListing;

export default provider;
