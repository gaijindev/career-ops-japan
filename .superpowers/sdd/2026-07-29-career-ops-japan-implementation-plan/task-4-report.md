# Task 4 Report — GaijinPot Jobs adapter

Implemented a new `gaijinpot` provider with:

- `searchGaijinPot(filters, { fetchText } = defaultDeps)`
- `parseGaijinPotListing(documentText, sourceUrl)`
- `normalizeGaijinPotListing(rawJob)`

What it does:

- Claims public `jobs.gaijinpot.com` URLs.
- Fetches public pages with `redirect: 'error'`.
- Parses public job detail pages and/or listing pages.
- Extracts the public job metadata needed by the Japan schema helpers.
- Leaves missing salary and other absent fields unknown instead of inventing negative facts.
- Uses the shared Japan schema helpers and the adapter contract helper.

Fixtures added:

- `tests/fixtures/gaijinpot/job-marketing.html`
- `tests/fixtures/gaijinpot/job-overseas.html`

Test coverage added:

- provider id and detect behavior
- fetch hardening
- exact parsing for the marketing fixture
- overseas application + missing salary behavior
- normalization and contract compliance

Verification:

- `node --test tests/providers/gaijinpot.test.mjs`
- `node --test tests/providers/gaijinpot.test.mjs tests/providers/japan-adapter-contract.test.mjs`

Notes:

- The hidden-employer fixture is sanitized and omits salary data on purpose.
- No other project files were modified.
