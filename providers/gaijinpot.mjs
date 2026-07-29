// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

import { decodeEntities } from './_html-entities.mjs';
import {
  canonicalizeJapanJobUrl,
  normalizeJapanJob,
} from './_japan-job-schema.mjs';

const DEFAULT_ORIGIN = 'https://jobs.gaijinpot.com';
const DEFAULT_SEARCH_URL = `${DEFAULT_ORIGIN}/en/job?order_by=latest`;
const ALLOWED_HOSTS = new Set(['jobs.gaijinpot.com']);

const DEFAULT_DEPS = {
  fetchText: async (url, opts) => {
    const res = await fetch(url, { redirect: opts?.redirect === 'error' ? 'error' : 'follow' });
    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`HTTP ${res.status} fetching ${url}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return await res.text();
  },
};

function normalizeWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function stripTags(html) {
  return decodeEntities(String(html || '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|li|div|h1|h2|h3|h4|dt|dd|ul|ol|section|article|header|footer)>/gi, '\n')
    .replace(/<[^>]*>/g, ' '));
}

function textFromHtml(html) {
  return normalizeWhitespace(stripTags(html));
}

function firstMatch(text, pattern) {
  const match = String(text || '').match(pattern);
  return match ? match[1] : '';
}

function parseJsonScript(raw) {
  const cleaned = String(raw || '')
    .replace(/^\s*\/\/<!--\s*/i, '')
    .replace(/\s*\/\/-->\s*$/i, '')
    .trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function findJobPosting(html) {
  const scripts = [...String(html || '').matchAll(/<script\b[^>]*type=["'][^"']*ld[^"']*json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    const json = parseJsonScript(match[1]);
    if (!json) continue;
    const items = Array.isArray(json) ? json : Array.isArray(json?.['@graph']) ? json['@graph'] : [json];
    for (const item of items) {
      if (item && (item['@type'] === 'JobPosting' || (Array.isArray(item['@type']) && item['@type'].includes('JobPosting')))) {
        return item;
      }
    }
  }
  return null;
}

function parseDetailFields(html) {
  const block = firstMatch(html, /<dl\b[^>]*class=["'][^"']*\bmb-0\b[^"']*["'][^>]*>([\s\S]*?)<\/dl>/i) || firstMatch(html, /<dl\b[^>]*>([\s\S]*?)<\/dl>/i);
  const fields = {};
  for (const match of block.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) {
    fields[textFromHtml(match[1]).toLowerCase()] = match[2];
  }
  return fields;
}

function parseRequirements(html) {
  const section = firstMatch(html, /<h3\b[^>]*>\s*Requirements\s*<\/h3>[\s\S]*?<ul\b[^>]*>([\s\S]*?)<\/ul>/i);
  const items = [];
  for (const match of section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = textFromHtml(match[1]);
    if (text) items.push(text);
  }
  return items;
}

function parseDescription(html) {
  const section = firstMatch(html, /<h3\b[^>]*>\s*Description\s*<\/h3>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/i);
  return textFromHtml(section);
}

function parseLanguageLevel(text) {
  const value = normalizeWhitespace(text).toLowerCase();
  if (!value) return undefined;
  if (/(native|mother tongue)/.test(value)) return 'native';
  if (/(business|fluent|n1|advanced)/.test(value)) return 'business';
  if (/(conversational|basic|n2|intermediate)/.test(value)) return 'basic';
  return undefined;
}

function resolveGaijinPotUrl(filters = {}) {
  const raw = filters.url || filters.careers_url || filters.api || filters.search_url || filters.source_url || DEFAULT_SEARCH_URL;
  let parsed;
  try {
    parsed = new URL(raw, DEFAULT_ORIGIN);
  } catch {
    throw new Error(`gaijinpot: invalid URL: ${raw}`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`gaijinpot: URL must use HTTPS: ${raw}`);
  if (!ALLOWED_HOSTS.has(parsed.hostname)) throw new Error(`gaijinpot: untrusted hostname "${parsed.hostname}"`);
  return parsed.href;
}

function extractListingLinks(html, baseUrl) {
  const seen = new Set();
  const links = [];
  for (const match of String(html || '').matchAll(/(?:data-href|href)=["']([^"']*\/en\/job\/\d+(?:\?[^"']*)?)["']/gi)) {
    const href = decodeEntities(match[1]);
    let abs;
    try {
      abs = new URL(href, baseUrl).href;
    } catch {
      continue;
    }
    if (seen.has(abs)) continue;
    seen.add(abs);
    links.push(abs);
  }
  return links;
}

function deriveSearchUrl(filters = {}) {
  if (filters.url || filters.careers_url || filters.api || filters.search_url || filters.source_url) {
    return resolveGaijinPotUrl(filters);
  }
  const url = new URL(DEFAULT_SEARCH_URL);
  const queryKeys = [
    'order_by', 'page', 'region', 'category', 'function', 'employment_terms',
    'language', 'english_ability', 'other_language', 'remote_work_ok', 'overseas_application',
    'has_video_presentation', 'company_id',
  ];
  for (const key of queryKeys) {
    const value = filters[key];
    if (value == null || value === '') continue;
    if (typeof value === 'boolean') {
      if (value) url.searchParams.set(key, '1');
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url.href;
}

function sourceFieldsFromRaw(raw) {
  const present = [];
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined) present.push(key);
  }
  return [...new Set(present)].sort();
}

function buildRawJob(html, sourceUrl) {
  const jobPosting = findJobPosting(html);
  const detail = parseDetailFields(html);
  const requirements = parseRequirements(html);
  const description = parseDescription(html);
  const canonical = (() => {
    const href = firstMatch(html, /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (!href) return canonicalizeJapanJobUrl(sourceUrl);
    try {
      return canonicalizeJapanJobUrl(new URL(decodeEntities(href), sourceUrl).href);
    } catch {
      return canonicalizeJapanJobUrl(sourceUrl);
    }
  })();

  const title = normalizeWhitespace(
    textFromHtml(firstMatch(html, /<h1\b[^>]*class=["'][^"']*card-heading[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i))
    || jobPosting?.title
  );
  const companyName = normalizeWhitespace(
    textFromHtml(detail.company || firstMatch(html, /<dd\b[^>]*class=["'][^"']*hidden-xs[^"']*["'][^>]*>([\s\S]*?)<\/dd>/i))
    || jobPosting?.hiringOrganization?.name
  );
  const locationText = normalizeWhitespace(
    detail.location
      ? textFromHtml(detail.location)
      : (jobPosting?.jobLocation?.address ? [
          jobPosting?.jobLocation?.address?.addressLocality,
          jobPosting?.jobLocation?.address?.addressRegion,
          jobPosting?.jobLocation?.address?.addressCountry,
        ].filter(Boolean).join(', ') : ''),
  );

  if (!title || !companyName || !locationText) {
    throw new Error('gaijinpot: parse failed — changed markup or bot check blocked the job detail page');
  }

  const parsed = {
    source_platform: 'gaijinpot',
    source_url: canonical,
    source_job_id: String(jobPosting?.identifier?.value || detail['job id'] || '').trim() || undefined,
    title,
    company_name: companyName,
    location_text: locationText,
    scraped_at: new Date().toISOString(),
    raw_source_text: normalizeWhitespace([
      title,
      companyName,
      locationText,
      textFromHtml(detail.industries || ''),
      textFromHtml(detail['work type'] || ''),
      textFromHtml(detail.salary || ''),
      requirements.join(' | '),
      description,
    ].filter(Boolean).join(' \n ')),
    application_url: (() => {
      const actionMatch = String(html || '').match(/<form\b[^>]*id=["']login-form["'][^>]*action=(["'])([\s\S]*?)\1/i);
      const action = actionMatch?.[2] || '';
      if (!action) return canonical;
      try { return new URL(decodeEntities(action), sourceUrl).href; } catch { return canonical; }
    })(),
    industry: normalizeWhitespace(textFromHtml(detail.industries || '')) || undefined,
    employment_term: normalizeWhitespace(textFromHtml(detail['work type'] || '')) || undefined,
    salary_text: normalizeWhitespace(textFromHtml(detail.salary || '')) || undefined,
    english_level: undefined,
    japanese_level: undefined,
    residency_requirement: undefined,
    overseas_application: undefined,
    work_mode: undefined,
  };

  if (jobPosting?.datePosted) parsed.posted_at = jobPosting.datePosted;
  if (jobPosting?.jobLocationType && String(jobPosting.jobLocationType).toUpperCase() === 'TELECOMMUTE') parsed.work_mode = 'remote';

  const salary = jobPosting?.baseSalary?.value || {};
  if (Number.isFinite(Number(salary.minValue))) parsed.salary_min = Number(salary.minValue);
  if (Number.isFinite(Number(salary.maxValue))) parsed.salary_max = Number(salary.maxValue);
  if (typeof jobPosting?.baseSalary?.currency === 'string' && jobPosting.baseSalary.currency.trim()) parsed.salary_currency = jobPosting.baseSalary.currency.trim();
  if (typeof salary.unitText === 'string' && salary.unitText.trim()) parsed.salary_period = salary.unitText.trim().toLowerCase();

  const requirementText = [description, requirements.join(' \n '), parsed.salary_text].filter(Boolean).join(' \n ').toLowerCase();
  if (/visa sponsorship available|visa sponsor/.test(requirementText)) parsed.visa_sponsorship = 'yes';
  if (/must currently reside in japan|applicants currently living in japan|reside in japan/.test(requirementText)) parsed.residency_requirement = 'must currently reside in Japan';
  if (/applying from overseas|overseas application ok|overseas applicants interested/.test(requirementText)) parsed.overseas_application = true;

  for (const item of requirements) {
    const lower = item.toLowerCase();
    if (lower.startsWith('english:')) parsed.english_level = parseLanguageLevel(item.split(':').slice(1).join(':'));
    if (lower.startsWith('japanese:')) parsed.japanese_level = parseLanguageLevel(item.split(':').slice(1).join(':'));
  }

  if (!parsed.english_level && /english\s*:\s*([^\n]+)/i.test(requirementText)) parsed.english_level = parseLanguageLevel(RegExp.$1);
  if (!parsed.japanese_level && /japanese\s*:\s*([^\n]+)/i.test(requirementText)) parsed.japanese_level = parseLanguageLevel(RegExp.$1);

  parsed.source_fields_present = sourceFieldsFromRaw(parsed);
  return parsed;
}

function looksLikeDetailPage(html) {
  return /card-heading text-xlarge/i.test(String(html || '')) && /Job ID/i.test(String(html || ''));
}

function looksLikeBotCheck(html) {
  return /captcha|just a moment|access denied|robot/i.test(String(html || ''));
}

export function parseGaijinPotListing(documentText, sourceUrl) {
  const html = String(documentText || '');
  if (!html.trim()) throw new Error('gaijinpot: empty document');
  if (looksLikeBotCheck(html)) throw new Error('gaijinpot: bot check blocked the public page');
  return buildRawJob(html, sourceUrl || DEFAULT_SEARCH_URL);
}

export function normalizeGaijinPotListing(rawJob) {
  const normalized = normalizeJapanJob({
    ...rawJob,
    source_platform: 'gaijinpot',
    source_url: rawJob?.source_url || rawJob?.application_url || DEFAULT_SEARCH_URL,
    title: rawJob?.title,
    company_name: rawJob?.company_name,
    location_text: rawJob?.location_text,
    raw_source_text: rawJob?.raw_source_text,
    scraped_at: rawJob?.scraped_at || new Date().toISOString(),
    source_job_id: rawJob?.source_job_id,
    posted_at: rawJob?.posted_at,
    salary_min: rawJob?.salary_min,
    salary_max: rawJob?.salary_max,
    salary_currency: rawJob?.salary_currency,
    salary_period: rawJob?.salary_period,
    work_mode: rawJob?.work_mode,
    visa_sponsorship: rawJob?.visa_sponsorship,
    japanese_level: rawJob?.japanese_level,
    source_fields_present: rawJob?.source_fields_present,
  });
  return normalized;
}

export async function searchGaijinPot(filters, { fetchText } = DEFAULT_DEPS) {
  const startUrl = deriveSearchUrl(filters);
  const pageText = await fetchText(startUrl, { redirect: 'error' });
  if (looksLikeBotCheck(pageText)) throw new Error('gaijinpot: bot check blocked the public search page');

  if (looksLikeDetailPage(pageText)) {
    return [parseGaijinPotListing(pageText, startUrl)];
  }

  const links = extractListingLinks(pageText, startUrl);
  if (!links.length) {
    throw new Error('gaijinpot: parse failed — no job links found on the public search page');
  }

  const jobs = [];
  for (const link of links) {
    const html = await fetchText(link, { redirect: 'error' });
    if (looksLikeBotCheck(html)) throw new Error('gaijinpot: bot check blocked a job detail page');
    jobs.push(parseGaijinPotListing(html, link));
  }
  return jobs;
}

/** @type {Provider} */
const provider = {
  id: 'gaijinpot',

  detect(entry) {
    const raw = entry?.api || entry?.careers_url || entry?.url;
    if (typeof raw !== 'string' || !raw) return null;
    let parsed;
    try {
      parsed = new URL(raw, DEFAULT_ORIGIN);
    } catch {
      return null;
    }
    if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) return null;
    return { url: parsed.href };
  },

  async fetch(entry, ctx) {
    const jobs = await searchGaijinPot(entry, { fetchText: ctx.fetchText });
    return jobs.map((job) => normalizeGaijinPotListing(job));
  },
};

export default provider;
