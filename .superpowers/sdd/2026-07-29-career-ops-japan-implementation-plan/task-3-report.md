# Task 3 Report — TokyoDev adapter

## Status

Completed on July 29, 2026.

## Scope completed

- Fixed TokyoDev search-result parsing so each job now gets its own trusted per-card `source_url`.
- Derived stable per-job `source_job_id` values from trusted TokyoDev job hrefs when cards expose them.
- Kept fail-closed behavior for malformed, off-host, mixed-host, or non-HTTPS card hrefs.
- Added TokyoDev detect positive/negative coverage.
- Added coverage that `searchTokyoDev()` forwards `redirect: 'error'` on the public search fetch.
- Routed TokyoDev through `createJapanAdapterContract` in tests.
- Added a multi-job TokyoDev fixture proving distinct URLs and IDs on one search page.

## Files changed

- `providers/tokyodev.mjs`
- `tests/providers/tokyodev.test.mjs`
- `tests/fixtures/tokyodev/search-results-two-jobs.html`

## TDD evidence

### Red

Command:

```text
node --test tests/providers/tokyodev.test.mjs
```

Output:

```text
✔ tokyodev provider exposes the expected id
✔ tokyodev detect claims trusted TokyoDev URLs and rejects non-HTTPS or spoofed hosts
✔ parseTokyoDevListing extracts the no-Japanese fixture fields
✔ normalizeTokyoDevListing keeps missing fields absent and preserves the source URL
✔ searchTokyoDev parses multiple injectable fixtures and rejects unknown page shapes
✖ searchTokyoDev derives distinct per-card source URLs and job IDs from trusted TokyoDev hrefs
✖ searchTokyoDev forwards redirect error on public search fetch and fails closed on untrusted card hrefs
✖ TokyoDev adapter satisfies the shared Japan adapter contract on distinct listings from one search page

AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected
  source_url: 'https://www.tokyodev.com/jobs'
- source_url: 'https://www.tokyodev.com/jobs/money-forward/senior-full-stack-engineer-ruby'
```

### Green

Command:

```text
node --test tests/providers/tokyodev.test.mjs
```

Output:

```text
✔ tokyodev provider exposes the expected id
✔ tokyodev detect claims trusted TokyoDev URLs and rejects non-HTTPS or spoofed hosts
✔ parseTokyoDevListing extracts the no-Japanese fixture fields
✔ normalizeTokyoDevListing keeps missing fields absent and preserves the source URL
✔ searchTokyoDev parses multiple injectable fixtures and rejects unknown page shapes
✔ searchTokyoDev derives distinct per-card source URLs and job IDs from trusted TokyoDev hrefs
✔ searchTokyoDev forwards redirect error on public search fetch and fails closed on untrusted card hrefs
✔ TokyoDev adapter satisfies the shared Japan adapter contract on distinct listings from one search page

ℹ tests 8
ℹ pass 8
ℹ fail 0
```

## Verification

Command:

```text
node --test tests/providers/tokyodev.test.mjs tests/providers/japan-adapter-contract.test.mjs
```

Output:

```text
✔ createJapanAdapterContract requires search, parse, and normalize functions
✔ adapter contract wraps search, parse, and normalize
✔ adapter contract rejects invalid normalized records
✔ adapter contract rejects duplicate fingerprints
✔ adapter contract rejects guessed values for fields absent from the parsed source
✔ adapter contract rejects omitting source_job_id when the parsed source exposed it
✔ tokyodev provider exposes the expected id
✔ tokyodev detect claims trusted TokyoDev URLs and rejects non-HTTPS or spoofed hosts
✔ parseTokyoDevListing extracts the no-Japanese fixture fields
✔ normalizeTokyoDevListing keeps missing fields absent and preserves the source URL
✔ searchTokyoDev parses multiple injectable fixtures and rejects unknown page shapes
✔ searchTokyoDev derives distinct per-card source URLs and job IDs from trusted TokyoDev hrefs
✔ searchTokyoDev forwards redirect error on public search fetch and fails closed on untrusted card hrefs
✔ TokyoDev adapter satisfies the shared Japan adapter contract on distinct listings from one search page

ℹ tests 14
ℹ pass 14
ℹ fail 0
```

Command:

```text
git diff -- providers/tokyodev.mjs tests/providers/tokyodev.test.mjs tests/fixtures/tokyodev
```

Output:

```text
diff --git a/providers/tokyodev.mjs b/providers/tokyodev.mjs
+function deriveJobIdFromUrl(jobUrl) { ... }
+function getTrustedJobUrl(block, sourceUrl) { ... }
+source_url: jobUrl
+if (jobRef.fromHref) raw.raw_source_html = block;

diff --git a/tests/providers/tokyodev.test.mjs b/tests/providers/tokyodev.test.mjs
+detect positive/negative coverage
+distinct per-card URL/ID regression coverage
+redirect:'error' forwarding + fail-closed href coverage
+createJapanAdapterContract coverage for distinct listings

diff --git a/tests/fixtures/tokyodev/search-results-two-jobs.html b/tests/fixtures/tokyodev/search-results-two-jobs.html
+new two-job TokyoDev search fixture
```

## Commit

- Code fix commit: `39a20cb` — `fix: correct TokyoDev job URLs`

## Concerns

- `raw.raw_source_html` is added only when a TokyoDev search card exposes a trusted href so the shared contract test can re-parse the exact card markup without changing existing detail-page behavior.
- Same-host validation is intentionally strict: a search page on `www.tokyodev.com` only accepts card hrefs that resolve back to `www.tokyodev.com`.
