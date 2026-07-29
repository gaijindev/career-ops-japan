# Task 6 report — integrate Japan sources with scan pipeline, pasted fallback, dedup, and liveness

Date: 2026-07-29
Base HEAD: `854ff95811555d552b9663d1eb63bae1d3012d47`
Task scope: Task 6 only

## Summary

Implemented Task 6 in the scan layer without changing the three adapter implementation files themselves.

The scanner now:

- loads structured-provider hooks (`search`, `parse`, `normalize`) through the provider registry, including named-export wiring for adapters such as GaijinPot;
- accepts explicit `source:` selection alongside legacy `provider:` and fails closed with clear unsupported-source diagnostics;
- routes TokyoDev, GaijinPot, and Hello Work through a shared structured-source scan path that preserves normalized metadata on the in-memory offer;
- supports pasted-listing fallback for structured providers via `document_text` / equivalent manual-input fields, bypassing source discovery while reusing the same parse/normalize path;
- keeps unknown-source manual URLs usable by serializing them as bare `- [ ] {url}` pipeline rows instead of writing empty company/title columns;
- classifies structured-source failures into explicit `blocked`, `stale`, `incomplete`, and `changed` statuses and avoids emitting partial records as if they were complete.

## Files changed

- `scan.mjs`
- `providers/_registry.mjs`
- `modes/scan.md`
- `modes/pipeline.md`
- `test/japan-scan-pipeline.test.mjs`
- `test/fixtures/japan-scan-results.json`

## Implementation notes

### Registry / provider wiring

- Added structured-export discovery in `providers/_registry.mjs` so default providers can inherit named exports like `searchGaijinPot`, `parseGaijinPotListing`, and `normalizeGaijinPotListing`.
- Added registry-level `capabilities` and default `label`.
- Added explicit `source:` support in `resolveProvider()`.
- Unsupported explicit values now return:
  - `unsupported source: <id>`
  - `unsupported provider: <id>`

### Scan pipeline

- Exported `PROVIDERS_DIR` for testable provider loading.
- Added structured-source helpers in `scan.mjs`:
  - `providerSupportsStructuredSource()`
  - `classifyStructuredSourceError()`
  - `scanStructuredSource()`
- Structured-provider path now:
  - runs `search()` + `normalize()` for rich provider results;
  - reparses only when safe and provider-appropriate;
  - falls back to direct detail-page parse on changed-markup list/search mismatch;
  - supports pasted/manual document input via `document_text`-style fields.
- Main scan loop now uses `scanStructuredSource()` instead of calling `fetch()` directly for all providers.
- Structured-source failures are surfaced with `[source-status:<status>]` in the scanner’s error list.

### Pipeline fallback

- `formatPipelineOffer()` now emits a bare URL row when company/title are absent:
  - before: `- [ ] https://example.com |  | `
  - now: `- [ ] https://example.com`

## TDD evidence

### Red

Created a new failing fixture-only regression:

- `test/japan-scan-pipeline.test.mjs`

Initial failure reasons were:

- structured-source helpers/exported provider dir missing;
- manual unknown-source pipeline fallback wrote empty columns;
- GaijinPot rich structured hooks were not being attached through the registry;
- TokyoDev structured reparse logic was incorrectly treating plain text like HTML.

### Green

After the wiring changes above, the new regression passed and the real scan loop was moved onto the same structured path.

## Verification run

### Focused tests

Passed:

- `node --test test/japan-scan-pipeline.test.mjs`
- `node --test tests/providers/tokyodev.test.mjs tests/providers/gaijinpot.test.mjs tests/providers/hellowork.test.mjs`
- `node tests/scan-url-dedup.test.mjs`
- `node tests/scan-company-role-dedup.test.mjs`
- `node tests/liveness-core.test.mjs`

### Full regression

Ran:

- `node test-all.mjs`

Result:

- `2344 passed, 5 failed, 1 warnings`

The failures observed in `test-all.mjs` were existing repo-wide issues outside Task 6 scope, not introduced by these changes:

1. `SYSTEM_PATHS coverage gap` for:
   - `.superpowers/sdd/.../task-3-report.md`
   - `.superpowers/sdd/.../task-4-report.md`
   - `.superpowers/sdd/.../task-5-report.md`
   - `test/fork-identity.test.mjs`
2. `Absolute path check` failures inside the existing Task 4 report file:
   - `.superpowers/sdd/2026-07-29-career-ops-japan-implementation-plan/task-4-report.md`

These were already outside the Task 6 implementation surface and were not modified as part of this task.

## Diff inspection summary

Manual diff inspection confirmed:

- no changes to the TokyoDev, GaijinPot, or Hello Work adapter implementation files;
- only registry/config wiring was used to expose GaijinPot’s structured hooks upstream;
- scan loop changes are localized to source resolution, structured-source ingestion, and bare-URL fallback;
- documentation updates are limited to `modes/scan.md` and `modes/pipeline.md`.

## Concerns / follow-ups

1. `test-all.mjs` is currently not fully green at repo level because of pre-existing updater/path-report failures unrelated to Task 6.
2. The provider registry now derives structured hooks by export-name matching; if future adapters use nonstandard export names, they should either attach hooks to the default export or follow the current `searchX` / `parseX` / `normalizeX` naming pattern.
3. The new pasted structured-source fallback is implemented at scan-ingestion level, but any future higher-level UX around pasted JDs should keep using this shared path rather than duplicating parsing logic elsewhere.

---

## Fix round 1 — review findings addressed (2026-07-29)

Review scope:

- `source:` must be authoritative when present, even if stale legacy `provider:` is also present.
- Add focused tests for conflicting explicit fields and unsupported-source diagnostics.
- Stop classifying non-page/config/integration failures as `changed`.

### Fix summary

Implemented the review changes without touching adapter files or expanding documentation scope:

- changed `resolveProvider()` so explicit `source:` wins over `provider:` when both are present;
- preserved legacy `provider:` behavior when `source:` is absent;
- preserved distinct diagnostics:
  - `unsupported source: <id>`
  - `unsupported provider: <id>`
- narrowed `classifyStructuredSourceError()` so only explicit markup/shape failures map to `changed`;
- introduced a safe catch-all `error` status for non-page integration/config failures.

### TDD evidence

Red test added first in `test/japan-scan-pipeline.test.mjs`:

- `Explicit source selection is authoritative when source and provider conflict`
- `Unsupported explicit source and legacy provider diagnostics stay distinct`
- `Structured-source failures ...` extended with a generic integration failure expecting `error`

Red verification command:

```bash
node --test test/japan-scan-pipeline.test.mjs
```

Observed failing output excerpt before the fix:

```text
✖ Structured-source failures map to explicit blocked/stale/incomplete/changed statuses
  'changed' !== 'error'

✖ Explicit source selection is authoritative when source and provider conflict
  + actual - expected
  + 'hellowork'
  - 'tokyodev'

✖ Unsupported explicit source and legacy provider diagnostics stay distinct
  + actual - expected
  + { provider: { id: 'hellowork', ... } }
  - { error: 'unsupported source: not-a-provider' }
```

Green verification command:

```bash
node --test test/japan-scan-pipeline.test.mjs
```

Observed passing output:

```text
✔ Japan structured providers feed the scan pipeline with normalized metadata and URL dedup, without network access
✔ Structured-source failures map to explicit blocked/stale/incomplete/changed statuses
✔ Explicit source selection is authoritative when source and provider conflict
✔ Unsupported explicit source and legacy provider diagnostics stay distinct
✔ A pasted URL with an unrecognized source remains a usable bare pipeline entry
ℹ pass 5
ℹ fail 0
```

### Focused verification commands and outputs

Command:

```bash
node --test test/japan-scan-pipeline.test.mjs
```

Output summary:

```text
ℹ pass 5
ℹ fail 0
```

Command:

```bash
node --test tests/providers/tokyodev.test.mjs tests/providers/gaijinpot.test.mjs tests/providers/hellowork.test.mjs
```

Output summary:

```text
ℹ tests 24
ℹ pass 24
ℹ fail 0
```

Command:

```bash
node tests/scan-url-dedup.test.mjs && node tests/scan-company-role-dedup.test.mjs && node tests/liveness-core.test.mjs
```

Output summary:

```text
scan.mjs — normalizeUrlForDedup() ignores tracking params, preserves identity
  ✅ ...

scan.mjs — company+role dedupe survives between runs
  ✅ ...

liveness-core — "filled" reqs (incl. Phenom/ICF phrasing) classify as expired
  ✅ ...
```

### Scoped diff inspection

Inspected command:

```bash
git diff -- providers/_registry.mjs scan.mjs test/japan-scan-pipeline.test.mjs test/fixtures/japan-scan-results.json .superpowers/sdd/2026-07-29-career-ops-japan-implementation-plan/task-6-report.md
```

Confirmed:

- `providers/_registry.mjs`: only explicit-resolution precedence/diagnostic fix
- `scan.mjs`: only error-status refinement
- `test/japan-scan-pipeline.test.mjs`: only review-requested focused coverage
- `test/fixtures/japan-scan-results.json`: only added the new `error` fixture case
- report append only

### Notes

- Unknown pasted URL behavior remains unchanged: still serialized as a bare `- [ ] {url}` row.
- Public source safety remains unchanged: no adapter widening, no host-policy relaxation, no network requirement added to the new regression.

## Fix round 2 — review findings addressed (2026-07-29)

### Review scope

This round addressed the remaining Task 6 review findings without changing adapter implementations or documentation:

- removed the bare `parse failed` classifier branch so generic configuration/integration parse errors stay `error`;
- retained `blocked`, `stale`, `incomplete`, and explicit page markup/shape drift as their existing statuses;
- made the resolved entry canonical by overlaying an explicit `source:` onto the legacy `provider:` field before detector/fetch consumers see it;
- updated the registry JSDoc to state that `source:` wins and `provider:` remains the legacy fallback;
- passed the canonical entry into scan targets and liveness provider probes.

### TDD evidence

Red tests were added first in `test/japan-scan-pipeline.test.mjs` and `test/fixtures/japan-scan-results.json`.

Command:

```bash
node --test test/japan-scan-pipeline.test.mjs
```

Observed red output before implementation:

```text
✖ Structured-source failures map to explicit blocked/stale/incomplete/changed statuses
  'changed' !== 'error'

✖ Explicit source overlays provider for legacy detector and fetch compatibility
  + actual - expected
  + undefined
  - 'teamtailor'
ℹ pass 4
ℹ fail 2
```

### Focused green verification

Command:

```bash
node --test test/japan-scan-pipeline.test.mjs
```

Output:

```text
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

Command:

```bash
node --test tests/providers/tokyodev.test.mjs tests/providers/gaijinpot.test.mjs tests/providers/hellowork.test.mjs tests/providers/teamtailor.test.mjs
```

Output:

```text
ℹ tests 25
ℹ pass 25
ℹ fail 0
```

Command:

```bash
node tests/scan-url-dedup.test.mjs && node tests/scan-company-role-dedup.test.mjs && node tests/liveness-core.test.mjs
```

Output:

```text
scan.mjs — normalizeUrlForDedup() ignores tracking params, preserves identity
  ✅ all 8 checks passed

scan.mjs — company+role dedupe survives between runs
  ✅ all 11 checks passed

liveness-core — "filled" reqs (incl. Phenom/ICF phrasing) classify as expired
  ✅ all 5 checks passed
```

### Diff inspection

Commands:

```bash
git diff --check
git diff -- providers/_registry.mjs scan.mjs verify-portals.mjs test/japan-scan-pipeline.test.mjs test/fixtures/japan-scan-results.json
```

Output/result:

```text
git diff --check: no output; exit 0
Scoped diff: only registry canonicalization/JSDoc, scan status/target wiring,
liveness probe entry wiring, focused regression tests, and the fixture status case.
```

The unrelated pre-existing modification to `.superpowers/sdd/2026-07-29-career-ops-japan-implementation-plan/task-4-report.md` remained outside this fix.

### Fix-round concerns

- No adapters were modified.
- No docs were modified.
- Tests use injected fixtures and do not access the network.
- Unknown pasted URL formatting and public host/source safety remain unchanged.

## Fix round 3 — review findings addressed (2026-07-29)

### Review scope

This round addressed the remaining scoped findings without changing adapters or publishing:

- `verifyCompanies()` now routes an explicit `source:` through `resolveProvider()` before Greenhouse/Ashby/Lever URL heuristics;
- unsupported explicit sources remain visible as `unsupported source: ...` diagnostics and do not fall through to ATS probing;
- provider-only legacy entries retain the existing ATS-first behavior;
- GaijinPot's explicit `parse failed — no job links found` page-shape failure maps to `changed`, while generic config parse failures remain `error`;
- scan-level source precedence and `resolveProvider()`'s canonical routed entry are documented in JSDoc.

### TDD evidence

Red tests were added first in `test/japan-scan-pipeline.test.mjs` and `test/fixtures/japan-scan-results.json`.

Command:

```bash
node --test test/japan-scan-pipeline.test.mjs
```

Observed red output before implementation:

```text
✖ Structured-source failures map to explicit blocked/stale/incomplete/changed statuses
  'error' !== 'changed'

✖ Explicit source bypasses ATS liveness shortcuts while provider-only entries retain legacy routing
  + actual - expected
  + undefined
  - 'teamtailor'
ℹ pass 5
ℹ fail 2
```

### Focused green verification

Command:

```bash
node --test test/japan-scan-pipeline.test.mjs
```

Output:

```text
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Command:

```bash
node --test tests/providers/tokyodev.test.mjs tests/providers/gaijinpot.test.mjs tests/providers/hellowork.test.mjs tests/providers/teamtailor.test.mjs
```

Output:

```text
ℹ tests 25
ℹ pass 25
ℹ fail 0
```

Command:

```bash
node tests/scan-url-dedup.test.mjs && node tests/scan-company-role-dedup.test.mjs && node tests/liveness-core.test.mjs
```

Output:

```text
scan.mjs — normalizeUrlForDedup() ignores tracking params, preserves identity
  ✅ all 8 checks passed

scan.mjs — company+role dedupe survives between runs
  ✅ all 11 checks passed

liveness-core — "filled" reqs (incl. Phenom/ICF phrasing) classify as expired
  ✅ all 5 checks passed
```

### Diff inspection

Commands:

```bash
git diff --check
git diff -- providers/_registry.mjs scan.mjs verify-portals.mjs test/japan-scan-pipeline.test.mjs test/fixtures/japan-scan-results.json
```

Output/result:

```text
git diff --check: no output; exit 0
Scoped diff: only explicit-source liveness routing, classifier/JSDoc updates,
focused tests, and fixture data.
```

The unrelated pre-existing modification to `.superpowers/sdd/2026-07-29-career-ops-japan-implementation-plan/task-4-report.md` remained outside this fix.

### Fix-round concerns

- No provider adapter implementation files were modified.
- No docs outside the requested scan/registry JSDoc were modified.
- All new routing tests use stubs and injected contexts; no network access is required.
