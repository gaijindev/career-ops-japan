import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../helpers.mjs';

const FIXTURE_DIR = join(ROOT, 'tests/fixtures/hellowork');

function fixture(name) {
  return readFileSync(join(FIXTURE_DIR, name), 'utf8');
}

const adapterModule = await import(pathToFileURL(join(ROOT, 'providers/hellowork.mjs')).href);
const {
  classifyHelloWorkApplication,
  normalizeHelloWorkListing,
  parseHelloWorkListing,
  searchHelloWork,
} = adapterModule;
const provider = adapterModule.default;

const { createJapanAdapterContract } = await import(pathToFileURL(join(ROOT, 'providers/_japan-adapter-contract.mjs')).href);

test('parseHelloWorkListing extracts Japanese employment fields from a full-time listing', () => {
  const raw = parseHelloWorkListing(
    fixture('job-fulltime.html'),
    'https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?kJNo=1310012345661',
  );

  assert.equal(raw.source_job_id, '13100-12345661');
  assert.equal(raw.title, 'AIプロダクトサポート担当');
  assert.equal(raw.company_name, 'サンプルテクノロジー株式会社');
  assert.equal(raw.location_text, '東京都千代田区');
  assert.equal(raw.salary_min, 300000);
  assert.equal(raw.salary_max, 450000);
  assert.equal(raw.salary_currency, 'JPY');
  assert.equal(raw.salary_period, 'month');
  assert.equal(raw.employment_type_text, '正社員');
  assert.equal(raw.working_hours_text, '（1）09時00分〜18時00分');
  assert.equal(raw.overtime_text, 'あり 月平均時間外労働時間 15時間');
  assert.equal(raw.holidays_text, '土 日 祝日 その他 週休二日制 毎週 年間休日数 125日');
  assert.equal(raw.required_experience_text, 'SaaS運用またはカスタマーサポート経験 必須');
  assert.equal(raw.japanese_level, 'business');
  assert.equal(classifyHelloWorkApplication(raw), 'hello-work-introduction');
});

test('parseHelloWorkListing detects restricted employer visibility', () => {
  const raw = parseHelloWorkListing(
    fixture('job-anonymous-employer.html'),
    'https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?kJNo=1301047972561',
  );

  assert.equal(raw.employer_visibility, 'registered-users-only');
  assert.equal(raw.source_job_id, '13010-47972561');
  assert.equal(raw.company_name, '求職者限定');
});

test('classifyHelloWorkApplication distinguishes online self-application from Hello Work introduction and manual contact', () => {
  const online = parseHelloWorkListing(
    fixture('job-online-self-application.html'),
    'https://www.hellowork.mhlw.go.jp/kensaku/GECA110020.do?kJNo=2805014675161',
  );

  assert.equal(classifyHelloWorkApplication(online), 'online-self-application');
  assert.equal(classifyHelloWorkApplication({
    application_instructions_text: '応募希望の方は事業所へ電話連絡してください。',
  }), 'manual-contact');
  assert.equal(classifyHelloWorkApplication({
    online_application_acceptance: '不可',
    application_documents_text: 'ハローワーク紹介状',
  }), 'hello-work-introduction');
});

test('normalizeHelloWorkListing maps a parsed listing into the shared Japan schema without guessing visa support', () => {
  const normalized = normalizeHelloWorkListing(parseHelloWorkListing(
    fixture('job-fulltime.html'),
    'https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?kJNo=1310012345661',
  ));

  assert.equal(normalized.source_platform, 'hellowork');
  assert.equal(normalized.source_job_id, '13100-12345661');
  assert.equal(normalized.title, 'AIプロダクトサポート担当');
  assert.equal(normalized.company_name, 'サンプルテクノロジー株式会社');
  assert.equal(normalized.location_text, '東京都千代田区');
  assert.equal(normalized.salary_min, 300000);
  assert.equal(normalized.salary_max, 450000);
  assert.equal(normalized.salary_currency, 'JPY');
  assert.equal(normalized.salary_period, 'month');
  assert.equal(normalized.japanese_level, 'business');
  assert.equal(normalized.visa_sponsorship, 'unknown');
  assert.equal(normalized.work_mode, 'unknown');
  assert.ok(normalized.raw_source_text.includes('求人番号 | 13100-12345661'));
  assert.deepEqual(normalized.source_fields_present, [
    'japanese_level',
    'salary_currency',
    'salary_max',
    'salary_min',
    'salary_period',
    'source_job_id',
  ]);
});

test('searchHelloWork fetches each supplied detail URL and returns parsed raw jobs', async () => {
  const calls = [];
  const rawJobs = await searchHelloWork(
    {
      urls: [
        'https://example.test/fulltime',
        'https://example.test/online',
      ],
    },
    {
      fetchText: async (url) => {
        calls.push(url);
        return url.endsWith('/fulltime')
          ? fixture('job-fulltime.html')
          : fixture('job-online-self-application.html');
      },
    },
  );

  assert.deepEqual(calls, [
    'https://example.test/fulltime',
    'https://example.test/online',
  ]);
  assert.equal(rawJobs.length, 2);
  assert.equal(rawJobs[0].source_job_id, '13100-12345661');
  assert.equal(rawJobs[1].source_job_id, '28050-14675161');
});

test('default export is a valid upstream provider with id hellowork', async () => {
  assert.equal(provider.id, 'hellowork');

  const jobs = await provider.fetch(
    {
      provider: 'hellowork',
      hellowork: {
        urls: ['https://example.test/fulltime'],
      },
    },
    {
      fetchText: async () => fixture('job-fulltime.html'),
    },
  );

  assert.deepEqual(jobs, [{
    title: 'AIプロダクトサポート担当',
    url: 'https://example.test/fulltime',
    company: 'サンプルテクノロジー株式会社',
    location: '東京都千代田区',
  }]);
});

test('Hello Work adapter satisfies the shared Japan adapter contract on distinct listings', async () => {
  const adapter = createJapanAdapterContract({
    search: searchHelloWork,
    parse: parseHelloWorkListing,
    normalize: normalizeHelloWorkListing,
  });

  const rawJobs = await adapter.search(
    {
      urls: [
        'https://example.test/fulltime',
        'https://example.test/online',
      ],
    },
    {
      fetchText: async (url) => url.endsWith('/fulltime')
        ? fixture('job-fulltime.html')
        : fixture('job-online-self-application.html'),
    },
  );

  const normalized = rawJobs.map((raw) => adapter.normalize(adapter.parse(raw.raw_source_text, raw.source_url)));

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].source_platform, 'hellowork');
  assert.equal(normalized[1].source_platform, 'hellowork');
});
