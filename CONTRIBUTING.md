# Contributing

Pull requests welcome. Below is the bar.

## Where contributions are most useful

1. **New scrapers** — one source per PR. The contract is in `scripts/scan-greenhouse.mjs`: input is the config from `portals.yml`, output is appended-to `data/pipeline.md` in the schema documented at the top of that file.
2. **JD disqualifier packs** — additional language/region filters under `examples/jd-disqualifiers/`. Include test strings (JDs that should match) and counter-examples (JDs that should NOT match).
3. **Worked-example forks** — under `examples/forks/`. Document how you adapted this repo for a different market. Short is fine — half a page is plenty.
4. **Mode improvements** — refinements to `modes/*.md`. Keep mode files focused; one mode does one thing.

## House rules

### One source per PR

If you add a Daijob scraper and a CareerCross scraper in the same PR, I'll ask you to split. Reviewing scrapers one at a time keeps the ToS judgment scoped.

### ToS judgment lives with each scraper

Some Japanese boards explicitly prohibit scraping. We do not ship scrapers for sources that have a working public API alternative — use the API. When in doubt, link to the source's `robots.txt` and ToS in your PR description and let the reviewer decide.

### Never commit personal data

Pre-commit hook is on the roadmap. Until then, manually verify your diff does NOT contain:

- Real CVs (yours or anyone else's)
- Real email addresses, phone numbers, or street addresses
- Real job applications or scan output (`data/` contents)
- Real recruiter names or company-internal info

If you accidentally commit personal data, force-push the cleaned history immediately and rotate any exposed credentials.

### Code style

- **Scripts:** ES modules (Node 18+). One scanner per file in `scripts/scan-<source>.mjs`. No transpile step.
- **Config:** YAML. Anchors and aliases are fine; keep nesting shallow.
- **Modes:** Markdown, with frontmatter if helpful. Each mode file stands alone — assume the assistant reads it cold.

### Tests

Add a smoke test for new scrapers under `test/` — at minimum, a fixture-based test that verifies the scanner can parse a saved HTML/JSON snapshot. We don't hit the network in CI.

## Getting started locally

```bash
git clone https://github.com/achanthavong510/career-ops-japan.git
cd career-ops-japan
npm install
cp config/profile.yml.example config/profile.yml
cp cv.md.example cv.md
npm run scan:greenhouse   # smoke test
```

If that runs and writes to `data/pipeline.md`, you're set up.

## Reporting issues

- **Bug:** include the exact command, the source, and the relevant portion of `portals.yml`. Redact personal data.
- **Feature request:** describe the user problem first, then your proposed solution. We default to "no" on features that don't have a clear job-search use case.
- **Scraper broken / source structure changed:** include the last working commit if you can find it via `git blame scripts/scan-<source>.mjs`.

## Code of conduct

Be kind. Assume good faith. Job-hunting is stressful enough.
