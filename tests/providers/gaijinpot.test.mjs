import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../helpers.mjs';

const moduleUrl = pathToFileURL(join(ROOT, 'providers/gaijinpot.mjs')).href;
const contractUrl = pathToFileURL(join(ROOT, 'providers/_japan-adapter-contract.mjs')).href;

const gaijinpotModule = await import(moduleUrl);
const { createJapanAdapterContract } = await import(contractUrl);

const gaijinpot = gaijinpotModule.default;
const {
  searchGaijinPot,
  parseGaijinPotListing,
  normalizeGaijinPotListing,
} = gaijinpotModule;

const marketingHtml = readFileSync(join(ROOT, 'tests/fixtures/gaijinpot/job-marketing.html'), 'utf8');
const overseasHtml = readFileSync(join(ROOT, 'tests/fixtures/gaijinpot/job-overseas.html'), 'utf8');

const marketingUrl = 'https://jobs.gaijinpot.com/en/job/159289?order_by=latest';
const overseasUrl = 'https://jobs.gaijinpot.com/en/job/158921?order_by=latest';

test('gaijinpot exports a provider with a stable id and public URL detection', () => {
  assert.equal(gaijinpot.id, 'gaijinpot');
  assert.deepEqual(gaijinpot.detect({ careers_url: marketingUrl }), { url: marketingUrl });
  assert.equal(gaijinpot.detect({ careers_url: 'https://example.com/jobs' }), null);
});

test('searchGaijinPot fetches a public job page with redirect hardening', async () => {
  let captured;
  const jobs = await searchGaijinPot(
    { url: marketingUrl },
    {
      fetchText: async (url, opts) => {
        captured = { url, opts };
        return marketingHtml;
      },
    },
  );

  assert.equal(captured.url, marketingUrl);
  assert.equal(captured.opts.redirect, 'error');
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].title, '【Remote】Global Marketing / Localization / Culturalization (English)');
});

test('parseGaijinPotListing extracts the marketing job facts', () => {
  const raw = parseGaijinPotListing(marketingHtml, marketingUrl);

  assert.equal(raw.source_platform, 'gaijinpot');
  assert.equal(raw.source_url, 'https://jobs.gaijinpot.com/en/job/159289/details/information-technology/remote-global-marketing-localization-culturalization-english');
  assert.equal(raw.source_job_id, '159289');
  assert.equal(raw.title, '【Remote】Global Marketing / Localization / Culturalization (English)');
  assert.equal(raw.company_name, '株式会社セルシス');
  assert.equal(raw.location_text, '新宿区, Tokyo, Japan');
  assert.equal(raw.industry, 'Information Technology');
  assert.equal(raw.employment_term, 'Full Time / Experienced (Non-Manager)');
  assert.equal(raw.english_level, 'native');
  assert.equal(raw.japanese_level, 'business');
  assert.equal(raw.residency_requirement, 'must currently reside in Japan');
  assert.equal(raw.work_mode, 'remote');
  assert.equal(raw.salary_min, 344000);
  assert.equal(raw.salary_max, 485000);
  assert.equal(raw.salary_currency, 'JPY');
  assert.equal(raw.salary_period, 'month');
  assert.ok(raw.application_url.startsWith('https://jobs.gaijinpot.com/en/login?redirect='));
  assert.ok(raw.source_fields_present.includes('salary_min'));
  assert.ok(raw.source_fields_present.includes('application_url'));
});

test('parseGaijinPotListing captures overseas application and omits missing salary', () => {
  const raw = parseGaijinPotListing(overseasHtml, overseasUrl);

  assert.equal(raw.source_platform, 'gaijinpot');
  assert.equal(raw.source_job_id, '158921');
  assert.equal(raw.company_name, 'Confidential *Details will be provided during the interview. 非公開※面談時に詳細をお伝えします');
  assert.equal(raw.location_text, 'Nationwide, Japan');
  assert.equal(raw.industry, 'Education / Teaching');
  assert.equal(raw.employment_term, 'Full Time / Entry Level');
  assert.equal(raw.english_level, 'native');
  assert.equal(raw.japanese_level, 'basic');
  assert.equal(raw.overseas_application, true);
  assert.equal(raw.visa_sponsorship, 'yes');
  assert.equal(raw.salary_min, undefined);
  assert.equal(raw.salary_max, undefined);
  assert.equal(raw.salary_currency, undefined);
  assert.equal(raw.salary_period, undefined);
  assert.ok(raw.application_url.includes('/en/login?redirect=/en/job/158921?order_by%3Dlatest'));
  assert.ok(!raw.source_fields_present.includes('salary_min'));
});

test('normalizeGaijinPotListing preserves explicit facts and leaves unknowns unknown', () => {
  const adapter = createJapanAdapterContract({
    search: searchGaijinPot,
    parse: parseGaijinPotListing,
    normalize: normalizeGaijinPotListing,
  });

  const normalizedMarketing = adapter.normalize(adapter.parse(marketingHtml, marketingUrl));
  assert.equal(normalizedMarketing.company_name, '株式会社セルシス');
  assert.equal(normalizedMarketing.work_mode, 'remote');
  assert.equal(normalizedMarketing.visa_sponsorship, 'yes');
  assert.equal(normalizedMarketing.japanese_level, 'business');
  assert.equal(normalizedMarketing.salary_currency, 'JPY');
  assert.equal(normalizedMarketing.salary_period, 'month');

  const normalizedOverseas = adapter.normalize(adapter.parse(overseasHtml, overseasUrl));
  assert.equal(normalizedOverseas.company_name.startsWith('Confidential'), true);
  assert.equal(normalizedOverseas.visa_sponsorship, 'yes');
  assert.equal(normalizedOverseas.japanese_level, 'basic');
  assert.equal(Object.hasOwn(normalizedOverseas, 'salary_min'), false);
  assert.equal(Object.hasOwn(normalizedOverseas, 'salary_max'), false);
  assert.equal(Object.hasOwn(normalizedOverseas, 'salary_currency'), false);
  assert.equal(Object.hasOwn(normalizedOverseas, 'salary_period'), false);
  assert.equal(Object.hasOwn(normalizedOverseas, 'work_mode'), false);
});
