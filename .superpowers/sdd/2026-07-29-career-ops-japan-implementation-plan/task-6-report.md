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
