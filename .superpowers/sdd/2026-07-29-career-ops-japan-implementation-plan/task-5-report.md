# Task 5 Report: Hello Work adapter

## Result

Task 5 completed on branch `feat/career-ops-japan` and was committed locally on July 29, 2026. No publish or push was performed.

## Changed files

- `providers/hellowork.mjs`
  - completed the Hello Work adapter implementation around the checked-in Task 5 fixtures and tests
  - parses sanitized Hello Work `label | value` detail-page content from either HTML or reparsed plain text
  - normalizes salary range, salary period, employer visibility, workplace text, required experience, and Japanese-language evidence
  - distinguishes `online-self-application`, `hello-work-introduction`, `manual-contact`, and `unknown`
  - exposes `searchHelloWork`, `parseHelloWorkListing`, `normalizeHelloWorkListing`, and `classifyHelloWorkApplication`
  - exports a valid upstream provider with id `hellowork`
- `.superpowers/sdd/2026-07-29-career-ops-japan-implementation-plan/task-5-report.md`
  - added this implementation report

## Notes on fixture/test ownership

The Task 5 fixture set and focused test file were already present in the branch checkout when implementation began:

- `tests/providers/hellowork.test.mjs`
- `tests/fixtures/hellowork/README.md`
- `tests/fixtures/hellowork/job-fulltime.html`
- `tests/fixtures/hellowork/job-anonymous-employer.html`
- `tests/fixtures/hellowork/job-online-self-application.html`

Implementation work therefore stayed disjoint by changing only the Hello Work provider file plus this report.

## Commit hashes

- Baseline at implementation start in the current checkout: `0730088`
- Task 5 implementation commit: `235807c` (`feat: add Hello Work Japan job adapter`)

## Tests and checks

- `node --test tests/providers/hellowork.test.mjs` before implementation — exit `1`
  - Exact summary:
    - `ERR_MODULE_NOT_FOUND` for `providers/hellowork.mjs`
    - `tests 1`
    - `pass 0`
    - `fail 1`
- `node --test tests/providers/hellowork.test.mjs` after implementation — exit `0`
  - Exact summary:
    - `tests 7`
    - `pass 7`
    - `fail 0`
    - `duration_ms 113.119542`
- `node --test tests/providers/hellowork.test.mjs tests/providers/japan-adapter-contract.test.mjs` final verification — exit `0`
  - Exact summary:
    - `tests 13`
    - `pass 13`
    - `fail 0`
    - `duration_ms 104.662333`
- `git diff --check -- providers/hellowork.mjs tests/providers/hellowork.test.mjs tests/fixtures/hellowork`
  - Exact summary: clean

## Concerns

- There was an unrelated untracked file in the worktree during Task 5: `tests/providers/tokyodev.test.mjs`. It was preserved untouched.
- The user brief referenced commit `c303a69`, but the actual branch checkout at implementation time was already at `0730088`. This report records the observed local baseline rather than inferring branch history.

---

## Task 5 review-fix addendum (July 29, 2026)

### Review baseline

- Review-fix start commit in the current checkout: `1c5b59b`
- Branch: `feat/career-ops-japan`

### Findings addressed

- Added a strict HTTPS Hello Work host allowlist (`hellowork.mhlw.go.jp`, `www.hellowork.mhlw.go.jp`) that now gates every URL intake path used by the adapter:
  - `searchHelloWork()` array filters
  - `sourceUrl`
  - `sourceUrls`
  - nested explicit-provider `hellowork.urls`
  - `detect()` for both `careers_url` auto-detection and explicit `provider: hellowork` entries
- Added positive and negative `detect()` coverage consistent with provider expectations.
- Preserved existing Japanese parsing, application classification, and shared schema normalization behavior.

### Files changed for the review fix

- `providers/hellowork.mjs`
  - centralized Hello Work URL validation
  - enforced HTTPS + exact allowed hosts before any fetch
  - passed `redirect: 'error'` through Hello Work HTML fetches
- `tests/providers/hellowork.test.mjs`
  - moved positive fetch-path tests onto real allowlisted Hello Work hosts
  - added rejection tests for off-host and non-HTTPS URLs
  - added positive and negative `detect()` tests
  - added explicit-provider safe-behavior coverage to prove off-host URLs are rejected before fetch

### TDD evidence

- `node --test tests/providers/hellowork.test.mjs` after adding the new tests and before the fix — exit `1`
  - Exact summary:
    - `tests 10`
    - `pass 7`
    - `fail 3`
    - failing tests:
      - `searchHelloWork rejects off-host and non-HTTPS URLs before fetching`
      - `default export detect claims valid Hello Work URLs and rejects arbitrary inputs`
      - `default export fetch rejects explicit provider entries with off-host URLs before fetching`
- `node --test tests/providers/hellowork.test.mjs` after the fix — exit `0`
  - Exact summary:
    - `tests 10`
    - `pass 10`
    - `fail 0`
    - `duration_ms 585.381833`

### Final verification

- `node --test tests/providers/hellowork.test.mjs tests/providers/japan-adapter-contract.test.mjs` — exit `0`
  - Exact summary:
    - `tests 16`
    - `pass 16`
    - `fail 0`
    - `duration_ms 832.751125`
- `git diff --check -- providers/hellowork.mjs tests/providers/hellowork.test.mjs`
  - Exact summary: clean

### Review-fix concerns

- Unrelated untracked TokyoDev files remained untouched:
  - `tests/providers/tokyodev.test.mjs`
  - `tests/fixtures/tokyodev/`
