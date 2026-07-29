# Japan release checklist

Use this checklist before releasing the Japan vertical or publishing any
release notes. The committed demo evidence is local, sanitized fixture output;
it is not proof of live-site freshness, hiring accuracy, immigration/legal
compliance, or successful application submission.

## Baseline and doctor

- [ ] Record the starting commit and worktree status; preserve unrelated local
      changes.
- [ ] Run `node update-system.mjs check` and confirm the updater state is known.
- [ ] Run `node doctor.mjs --json`; review onboarding, warnings, and missing
      user-layer files without copying real profile data into fixtures.
- [ ] Run `node test-all.mjs`; investigate every failure and document any
      pre-existing, explicitly preserved failure before release.

## Japan implementation gates

- [ ] Schema / adapter / loader:
      `node --test tests/providers/japan-job-schema.test.mjs tests/providers/japan-adapter-contract.test.mjs tests/providers/japan-loader-safety.test.mjs tests/providers/tokyodev.test.mjs tests/providers/gaijinpot.test.mjs tests/providers/hellowork.test.mjs`
- [ ] Scan / pipeline:
      `node --test test/japan-scan-pipeline.test.mjs`
- [ ] Evaluation contract / language:
      `node --test test/japan-evaluation-contract.test.mjs`
- [ ] Privacy / updater / path coverage:
      `node --test test/japan-privacy-boundary.test.mjs`,
      `node updater-migration-tests.mjs`, and
      `node validate-system-paths-coverage.mjs`
- [ ] 36-case E2E:
      `node --test test/e2e/japan-career-ops.e2e.test.mjs`; confirm all 36
      sanitized benchmark cases and their labels are exercised offline.
- [ ] Demo:
      `node --test test/demo-japan.test.mjs` and
      `node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo --no-network`;
      confirm the output stays below the demo-owned directory.

## Documentation and evidence

- [ ] README command checks: every Japan command in `README.md`, `README.ja.md`,
      and `docs/demo/README.md` matches an executable command in the current
      checkout; run `git diff --check`.
- [ ] Screenshot review: open
      `docs/demo/screenshots/japan-it-scan.png`,
      `bilingual-evaluation.png`, `generated-artifacts.png`, and
      `local-tracker.png`; confirm they retain the Japan IT job-search framing,
      have readable captions/alt text in the docs, and are GitHub-relative links.
- [ ] Secret / PII hygiene: search committed diffs, fixture data, reports,
      screenshots, and docs for real names, emails, phone numbers, tokens,
      credentials, cookies, private URLs, and personal CV content. Keep only
      reserved synthetic fixture values.
- [ ] License / attribution: retain the repository MIT license, existing
      career-ops attribution, and source/terms limitations; do not imply live
      source endorsement.

## Installation and live boundaries

- [ ] Clean-install: from a fresh checkout with no existing dependency tree,
      run `npm install`, then rerun the offline demo test and demo command;
      verify no user-layer files are created or read.
- [ ] Opt-in live smoke tests only: run only after explicit human opt-in, using
      public pages and no credentials, cookies, login sessions, private URLs,
      API keys, or submissions. Keep the smoke test read-only: do not bypass
      CAPTCHA or bot controls, upload a CV, click a final Apply button, send
      email, or submit an application. Stop and record a diagnostic on a block,
      challenge, or changed page shape; the offline fixture suite remains the
      release gate.

## Release hygiene

- [ ] Confirm no production adapter, scan, evaluation, or privacy code was
      changed by a documentation/evidence-only release task.
- [ ] Confirm generated demo output, credentials, and personal user-layer files
      are not staged.
- [ ] Review the final diff and commit only the intended docs, checklist, and
      sanitized PNG evidence. Do not publish or push as part of this checklist.
