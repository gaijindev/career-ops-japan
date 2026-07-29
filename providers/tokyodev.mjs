// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

import { decodeEntities } from './_html-entities.mjs';
import { normalizeJapanJob } from './_japan-job-schema.mjs';

const TRUSTED_HOSTS = new Set(['tokyodev.com', 'www.tokyodev.com']);
const DEFAULT_SEARCH_URL = 'https://www.tokyodev.com/jobs';

const defaultDeps = {
  async fetchText() {
    throw new Error('tokyodev: fetchText dependency was not provided');
  },
};

function isTrustedTokyoDevUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && TRUSTED_HOSTS.has(url.hostname.toLowerCase());
}

function cleanText(html) {
  return decodeEntities(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function getAttr(block, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = String(block || '').match(re);
  const raw = match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
  return decodeEntities(String(raw).trim());
}

function getDataAttr(block, name) {
  return getAttr(block, `data-${name}`);
}

function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseSalaryText(text) {
  const match = String(text || '').match(/¥\s*([\d.]+)M?\s*~\s*¥\s*([\d.]+)M?/i);
  if (!match) return {};
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return {};
  const scale = /M/i.test(match[0]) ? 1_000_000 : 1;
  return {
    salary_min: Math.round(min * scale),
    salary_max: Math.round(max * scale),
    salary_currency: 'JPY',
    salary_period: 'year',
  };
}

function parseWorkMode(text) {
  const normalized = String(text || '').toLowerCase();
  if (normalized.includes('fully remote') || normalized.includes('full remote')) return 'remote';
  if (normalized.includes('partially remote') || normalized.includes('hybrid')) return 'hybrid';
  if (normalized.includes('no remote') || normalized.includes('onsite')) return 'onsite';
  return undefined;
}

function parseVisaSponsorship(text) {
  const normalized = String(text || '').toLowerCase();
  if (normalized.includes('apply from abroad')) return 'yes';
  if (normalized.includes('residents only')) return 'no';
  return undefined;
}

function parseJapaneseLevel(text) {
  const normalized = String(text || '').toLowerCase();
  if (normalized.includes('no japanese required')) return 'none';
  if (normalized.includes('basic japanese')) return 'basic';
  if (normalized.includes('conversational japanese')) return 'basic';
  if (normalized.includes('business japanese')) return 'business';
  if (normalized.includes('fluent japanese')) return 'fluent';
  if (normalized.includes('native japanese')) return 'native';
  return undefined;
}

function extractJobCardBlocks(documentText) {
  const html = String(documentText || '');
  const blocks = [];
  const re = /<article\b[^>]*\bdata-job-card\b[^>]*>([\s\S]*?)<\/article>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    blocks.push(match[0]);
  }
  if (blocks.length > 0) return blocks;

  const fallback = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
  while ((match = fallback.exec(html)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

function parseJobCard(block, sourceUrl) {
  const text = cleanText(block);
  const title = getDataAttr(block, 'title') || cleanText(block.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || block.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || block.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || '');
  const companyName = getDataAttr(block, 'company-name') || cleanText(block.match(/<p\b[^>]*data-company-name\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || block.match(/<p\b[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  const locationText = getDataAttr(block, 'location-text') || cleanText(block.match(/<p\b[^>]*data-location-text\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  const sourceJobId = getDataAttr(block, 'source-job-id') || slugify([title, companyName, locationText].filter(Boolean).join(' '));

  const salary = {
    ...parseSalaryText(text),
  };
  const salaryMin = getDataAttr(block, 'salary-min');
  const salaryMax = getDataAttr(block, 'salary-max');
  const salaryCurrency = getDataAttr(block, 'salary-currency');
  const salaryPeriod = getDataAttr(block, 'salary-period');
  if (salaryMin) salary.salary_min = Number(salaryMin);
  if (salaryMax) salary.salary_max = Number(salaryMax);
  if (salaryCurrency) salary.salary_currency = salaryCurrency.toUpperCase();
  if (salaryPeriod) salary.salary_period = salaryPeriod;

  const workMode = getDataAttr(block, 'work-mode') || parseWorkMode(text);
  const visaSponsorship = getDataAttr(block, 'visa-sponsorship') || parseVisaSponsorship(text);
  const japaneseLevel = getDataAttr(block, 'japanese-level') || parseJapaneseLevel(text);

  const sourceFieldsPresent = new Set(['title', 'company_name', 'location_text', 'source_url']);
  if (sourceJobId) sourceFieldsPresent.add('source_job_id');
  if (salary.salary_min !== undefined) sourceFieldsPresent.add('salary_min');
  if (salary.salary_max !== undefined) sourceFieldsPresent.add('salary_max');
  if (salary.salary_currency !== undefined) sourceFieldsPresent.add('salary_currency');
  if (salary.salary_period !== undefined) sourceFieldsPresent.add('salary_period');
  if (workMode !== undefined) sourceFieldsPresent.add('work_mode');
  if (visaSponsorship !== undefined) sourceFieldsPresent.add('visa_sponsorship');
  if (japaneseLevel !== undefined) sourceFieldsPresent.add('japanese_level');

  const raw = {
    source_platform: 'tokyodev',
    source_url: sourceUrl,
    source_job_id: sourceJobId,
    title: title || '',
    company_name: companyName || '',
    location_text: locationText || '',
    scraped_at: new Date().toISOString(),
    raw_source_text: text,
    source_fields_present: [...sourceFieldsPresent].sort(),
  };
  if (salary.salary_min !== undefined) raw.salary_min = salary.salary_min;
  if (salary.salary_max !== undefined) raw.salary_max = salary.salary_max;
  if (salary.salary_currency !== undefined) raw.salary_currency = salary.salary_currency;
  if (salary.salary_period !== undefined) raw.salary_period = salary.salary_period;
  if (workMode !== undefined) raw.work_mode = workMode;
  if (visaSponsorship !== undefined) raw.visa_sponsorship = visaSponsorship;
  if (japaneseLevel !== undefined) raw.japanese_level = japaneseLevel;
  return raw;
}

function getSearchUrls(filters) {
  if (Array.isArray(filters?.pages) && filters.pages.length > 0) {
    return filters.pages.filter(isTrustedTokyoDevUrl);
  }
  const candidate = filters?.url || filters?.careers_url || DEFAULT_SEARCH_URL;
  return isTrustedTokyoDevUrl(candidate) ? [candidate] : [];
}

export function parseTokyoDevListing(documentText, sourceUrl) {
  const blocks = extractJobCardBlocks(documentText);
  if (blocks.length === 0) {
    throw new Error('tokyodev: unrecognized page shape — no job cards found');
  }
  return parseJobCard(blocks[0], sourceUrl);
}

function parseTokyoDevPage(documentText, sourceUrl) {
  const blocks = extractJobCardBlocks(documentText);
  if (blocks.length === 0) {
    throw new Error('tokyodev: unrecognized page shape — no job cards found');
  }
  return blocks.map((block) => parseJobCard(block, sourceUrl));
}

export function normalizeTokyoDevListing(rawJob) {
  return normalizeJapanJob(rawJob);
}

export async function searchTokyoDev(filters, { fetchText } = defaultDeps) {
  const urls = getSearchUrls(filters);
  if (urls.length === 0) {
    throw new Error('tokyodev: cannot resolve a trusted TokyoDev search URL');
  }

  const jobs = [];
  for (const url of urls) {
    const html = await fetchText(url, { redirect: 'error' });
    const rawJobs = parseTokyoDevPage(html, url);
    jobs.push(...rawJobs);
  }
  return jobs;
}

/** @type {Provider} */
const provider = {
  id: 'tokyodev',

  detect(entry) {
    const candidate = entry?.api || entry?.careers_url || '';
    return isTrustedTokyoDevUrl(candidate) ? { url: candidate } : null;
  },

  async fetch(entry, ctx) {
    const rawJobs = await searchTokyoDev({ url: entry?.api || entry?.careers_url || DEFAULT_SEARCH_URL }, { fetchText: ctx.fetchText });
    return rawJobs.map((raw) => {
      const normalized = normalizeTokyoDevListing(raw);
      return {
        ...normalized,
        url: normalized.source_url,
        company: normalized.company_name,
        location: normalized.location_text,
      };
    });
  },

  search: searchTokyoDev,
  parse: parseTokyoDevListing,
  normalize: normalizeTokyoDevListing,
};

export default provider;
