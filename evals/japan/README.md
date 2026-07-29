# Japan listing benchmark

This benchmark is a sanitized, fixture-only regression set for the Japan
career workflow. It is not a hiring-accuracy claim. The human labels are
review judgments for comparing deterministic model/provider behavior.

## Coverage

There are exactly 36 listing cases: 12 cases per first-class source and one
case per category in each source.

| Source | Cases | Categories |
| --- | ---: | --- |
| TokyoDev | 12 | software engineering, data/analytics, product management, design, customer success, marketing, sales, finance, operations, education, healthcare, logistics |
| GaijinPot Jobs | 12 | software engineering, data/analytics, product management, design, customer success, marketing, sales, finance, operations, education, healthcare, logistics |
| Hello Work | 12 | software engineering, data/analytics, product management, design, customer success, marketing, sales, finance, operations, education, healthcare, logistics |

Each file in listings/ contains a sanitized source document and stable case
metadata. The matching file in labels/ records evidence excerpts and human
judgments for:

- role fit
- eligibility
- offer quality
- confidence
- recommendation

The labels intentionally keep unknowns and verification needs visible. Salary
absence is not treated as zero, employer anonymity is not treated as a known
company, and an explicit no-sponsorship signal is a blocker for the fixture
profile because it needs sponsorship.

## Required edge cases

The set includes malformed HTML (jp-04), missing salary (jp-02, jp-16,
jp-28), anonymous employer (jp-25), stale listing (jp-06), duplicate listing
(jp-03), unsupported source (jp-36), blocked source (jp-14), and explicit
no-sponsorship with a sponsorship-needed profile (jp-05).

## Running the benchmark

The E2E test loads only these committed fixtures and the synthetic profile/CV
under test/e2e/fixtures/. Each listing is parsed and normalized by its real
source adapter. Stale and blocked fixtures then pass through the shared
production status classifier, while the deterministic model receives the
normalized job, profile, and CV and derives the report fields from them. The
test rejects live network access and writes temporary reports/artifacts outside
the repository. PDF-capable cases are marked in the fixtures, but the E2E
runner records a pdf-skipped diagnostic because the existing generator also
writes the repository PDF manifest; this keeps the fixture workflow side-effect
free.

    node --test test/e2e/japan-career-ops.e2e.test.mjs
    node test-all.mjs

No platform credentials, user profile, personal CV, live URL, or application
action is part of this benchmark.
