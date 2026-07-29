import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../helpers.mjs';

const moduleUrl = pathToFileURL(join(ROOT, 'providers/tokyodev.mjs')).href;
const tokyodevModule = await import(moduleUrl);
const tokyodev = tokyodevModule.default;
const {
  searchTokyoDev,
  parseTokyoDevListing,
  normalizeTokyoDevListing,
} = tokyodevModule;

const fixturesDir = join(ROOT, 'tests/fixtures/tokyodev');
const readFixture = (name) => readFileSync(join(fixturesDir, name), 'utf8');

test('tokyodev provider exposes the expected id', () => {
  assert.equal(tokyodev.id, 'tokyodev');
});

test('parseTokyoDevListing extracts the no-Japanese fixture fields', () => {
  const raw = parseTokyoDevListing(
    readFixture('job-no-japanese.html'),
    'https://www.tokyodev.com/jobs/senior',
  );

  const { scraped_at, ...rawWithoutTimestamp } = raw;
  assert.match(scraped_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.deepEqual(rawWithoutTimestamp, {
    source_platform: 'tokyodev',
    source_url: 'https://www.tokyodev.com/jobs/senior',
    source_job_id: 'senior-full-stack-engineer-ruby-money-forward-cloud-tokyo-fukuoka',
    title: 'Senior Full-Stack Engineer (Ruby), Money Forward Cloud, Tokyo/Fukuoka',
    company_name: 'Money Forward',
    location_text: 'Tokyo/Fukuoka',
    salary_min: 7000000,
    salary_max: 11000000,
    salary_currency: 'JPY',
    salary_period: 'year',
    work_mode: 'hybrid',
    visa_sponsorship: 'yes',
    japanese_level: 'none',
    source_fields_present: [
      'company_name',
      'japanese_level',
      'location_text',
      'salary_currency',
      'salary_max',
      'salary_min',
      'salary_period',
      'source_job_id',
      'source_url',
      'title',
      'visa_sponsorship',
      'work_mode',
    ],
    raw_source_text: 'Senior Full-Stack Engineer (Ruby), Money Forward Cloud, Tokyo/Fukuoka Money Forward ¥7.0M ~ ¥11.0M No Japanese required Apply from abroad Partially remote Full Stack React Ruby TypeScript',
  });
});

test('normalizeTokyoDevListing keeps missing fields absent and preserves the source URL', () => {
  const normalized = normalizeTokyoDevListing(parseTokyoDevListing(
    readFixture('job-engineering-manager.html'),
    'https://www.tokyodev.com/jobs/python',
  ));

  assert.equal(normalized.source_url, 'https://www.tokyodev.com/jobs/python');
  assert.equal(normalized.source_job_id, 'engineering-manager-ax-promotion-division-ai-solution-department-tokyo');
  assert.equal(normalized.company_name, 'Money Forward');
  assert.equal(normalized.location_text, 'Tokyo');
  assert.equal(normalized.salary_min, 10000000);
  assert.equal(normalized.salary_max, 20000000);
  assert.equal(normalized.salary_currency, 'JPY');
  assert.equal(normalized.salary_period, 'year');
  assert.equal(normalized.work_mode, 'hybrid');
  assert.equal(normalized.visa_sponsorship, 'no');
  assert.equal(normalized.japanese_level, 'business');
  assert.equal(Object.hasOwn(normalized, 'posted_at'), false);
  assert.equal(Object.hasOwn(normalized, 'updated_at'), false);

  const sparse = normalizeTokyoDevListing(parseTokyoDevListing(
    '<article data-job-card data-title="Infrastructure Engineer" data-company-name="Example KK" data-location-text="Tokyo"><h2>Infrastructure Engineer</h2><div>Example KK</div><div>Tokyo</div></article>',
    'https://www.tokyodev.com/jobs/example',
  ));

  assert.equal(Object.hasOwn(sparse, 'salary_min'), false);
  assert.equal(Object.hasOwn(sparse, 'salary_max'), false);
  assert.equal(Object.hasOwn(sparse, 'salary_currency'), false);
  assert.equal(Object.hasOwn(sparse, 'salary_period'), false);
  assert.equal(Object.hasOwn(sparse, 'visa_sponsorship'), false);
  assert.equal(Object.hasOwn(sparse, 'japanese_level'), false);
  assert.equal(Object.hasOwn(sparse, 'work_mode'), false);
});

test('searchTokyoDev parses multiple injectable fixtures and rejects unknown page shapes', async () => {
  const calls = [];
  const jobs = await searchTokyoDev(
    {
      pages: [
        'https://www.tokyodev.com/jobs/python',
        'https://www.tokyodev.com/jobs/senior',
      ],
    },
    {
      fetchText: async (url) => {
        calls.push(url);
        const fileName = url.endsWith('/jobs/python')
          ? 'job-engineering-manager.html'
          : 'job-no-japanese.html';
        return readFixture(fileName);
      },
    },
  );

  assert.equal(calls.length, 2);
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].source_job_id, 'engineering-manager-ax-promotion-division-ai-solution-department-tokyo');
  assert.equal(jobs[1].source_job_id, 'senior-full-stack-engineer-ruby-money-forward-cloud-tokyo-fukuoka');

  await assert.rejects(
    () => searchTokyoDev(
      { url: 'https://www.tokyodev.com/jobs/broken' },
      { fetchText: async () => '<html><body><main><p>No job cards here.</p></main></html>' },
    ),
    /unrecognized/i,
  );
});
