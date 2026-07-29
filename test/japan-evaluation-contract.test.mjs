import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const fixture = JSON.parse(readFileSync(join(ROOT, 'test/fixtures/japan-evaluation-case.json'), 'utf8'));

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function requireText(text, pattern, message) {
  assert.match(text, pattern, message);
}

test('Japan evaluation fixture keeps role fit independent from unknown eligibility and offer quality', () => {
  const sections = fixture.expected_contract;
  assert.deepEqual(Object.keys(sections), ['role_fit', 'eligibility', 'offer_quality', 'data_confidence']);
  assert.equal(sections.role_fit.status, 'strong');
  assert.equal(sections.eligibility.status, 'unknown');
  assert.equal(sections.offer_quality.status, 'unknown');
  assert.equal(sections.offer_quality.advertised_salary, null);
  assert.equal(sections.offer_quality.salary_score, null);
  assert.equal(fixture.job.visa_sponsorship, 'unknown');
  assert.equal(fixture.job.salary_min, null);
  assert.equal(fixture.job.salary_max, null);
  assert.ok(fixture.profile.target_roles.primary.includes('Senior Platform Engineer'));
  assert.ok(sections.role_fit.evidence.some((item) => item.source === 'profile.target_roles.primary'));
  assert.ok(sections.role_fit.evidence.some((item) => item.source === 'cv.md#experience'));

  for (const section of Object.values(sections)) {
    assert.ok(Array.isArray(section.evidence) && section.evidence.length > 0);
    assert.ok(Array.isArray(section.uncertainty) && section.uncertainty.length > 0);
    assert.equal(typeof section.next_action, 'string');
    assert.ok(section.next_action.length > 0);
  }

  for (const claim of fixture.high_impact_claims) {
    assert.equal(claim.impact, 'high');
    assert.ok(claim.evidence.length > 0);
    assert.equal(claim.inference, false);
    assert.ok(claim.verification_action.length > 0);
  }
});

test('missing authorization fields remain unknown and neutral instead of becoming not needed', () => {
  const missing = fixture.missing_authorization_case;
  assert.equal(Object.hasOwn(missing.profile.location, 'authorized_in'), false);
  assert.equal(Object.hasOwn(missing.profile.location, 'needs_sponsorship'), false);
  assert.equal(Object.hasOwn(missing.profile.location, 'visa_status'), false);
  assert.equal(missing.expected.eligibility.status, 'unknown');
  assert.equal(missing.expected.eligibility.work_auth, 'unstated');

  const oferta = read('modes/oferta.md');
  const profile = read('config/profile.example.yml');
  requireText(oferta, /only[^\n]*explicit[^\n]*needs_sponsorship:\s*false[^\n]*Not needed/i);
  requireText(oferta, /(?:missing|absent)[^\n]*unknown|(?:authorized_in|needs_sponsorship|visa_status)[^\n]*(?:absent|blank)[^\n]*unknown|(?:authorized_in|needs_sponsorship|visa_status)[^\n]*Unstated/i);
  requireText(profile, /Omit[^\n]*(unknown|Unstated)/i);
  requireText(profile, /explicitly declared[\s\S]{0,80}false|explicit[\s\S]{0,80}false[\s\S]{0,80}Not needed/i);
});

test('shared evaluation contract defines four sections, evidence discipline, and safe unknown handling', () => {
  const shared = read('modes/_shared.md');
  requireText(shared, /role_fit[\s\S]*eligibility[\s\S]*offer_quality[\s\S]*data_confidence/);
  requireText(shared, /evidence/);
  requireText(shared, /uncertainty/);
  requireText(shared, /next_action/);
  requireText(shared, /absent[^\n]*(unknown|不明)|unknown[^\n]*absent/i);
  requireText(shared, /high-impact|high impact/i);
  requireText(shared, /distinguish[\s\S]{0,80}inference|inference[\s\S]{0,80}separate/i);
  requireText(shared, /verification action|verify[^\n]*(sponsorship|salary)/i);
  requireText(shared, /never invent[^\n]*sponsor|never[^\n]*invent[^\n]*sponsor/i);
  requireText(shared, /never[^\n]*(zero|0)[^\n]*salary|salary[^\n]*(zero|0)/i);
  requireText(shared, /model[- ]agnostic|provider[- ]agnostic/i);
});

test('English output control is explicit and Japanese mode does not override it', () => {
  const profile = read('config/profile.example.yml');
  const shared = read('modes/_shared.md');
  const jaShared = read('modes/ja/_shared.md');
  const oferta = read('modes/oferta.md');
  const kyujin = read('modes/ja/kyujin.md');

  requireText(profile, /language:\n[\s\S]*output:\s*en/);
  requireText(profile, /modes_dir:\s*modes\/ja/);
  requireText(shared, /language\.output[^\n]*(always wins|controls)/i);
  requireText(jaShared, /language\.output[^\n]*(wins|controls)/i);
  requireText(oferta, /language\.output[^\n]*(wins|controls)/i);
  requireText(kyujin, /language\.output[^\n]*(wins|controls)/i);
});

test('English and Japanese job modes preserve A-G blocks and require the four-section report contract', () => {
  const oferta = read('modes/oferta.md');
  const kyujin = read('modes/ja/kyujin.md');

  for (const mode of [oferta, kyujin]) {
    for (const heading of ['Block A', 'Block B', 'Block C', 'Block D', 'Block E', 'Block F', 'Block G']) {
      assert.match(mode, new RegExp(heading), `${heading} must remain present`);
    }
    requireText(mode, /role_fit[\s\S]*eligibility[\s\S]*offer_quality[\s\S]*data_confidence/);
    requireText(mode, /evidence/);
    requireText(mode, /uncertainty/);
    requireText(mode, /next_action/);
    requireText(mode, /salary[^\n]*(null|unknown|not stated)|not stated[^\n]*salary/i);
    requireText(mode, /sponsor[^\n]*(never|do not|don't)[^\n]*invent|never[^\n]*invent[^\n]*sponsor|スポンサー[^\n]*(捏造|推測)/i);
    requireText(mode, /inference|inferred/);
    requireText(mode, /verify|確認/);
  }
});

test('profile example exposes structured Japan authorization and language controls without inventing defaults', () => {
  const profile = read('config/profile.example.yml');
  requireText(profile, /authorized_in:/);
  requireText(profile, /needs_sponsorship:/);
  requireText(profile, /language:/);
  requireText(profile, /output:/);
  requireText(profile, /absent|unknown|不明/i);
});
