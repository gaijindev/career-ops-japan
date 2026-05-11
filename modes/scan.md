# scan — discover new listings across all sources

Read `_shared.md` first.

## Inputs

- `portals.yml` (sources, filters, tracked companies)
- `config/profile.yml` (for blocked_companies, japanese_level)

## What this mode does

Runs every source in `portals.yml > sources` whose `status: working`, applies the filter chain in `_shared.md`, appends survivors to `data/pipeline.md`.

## Phase 1 (current)

Only `greenhouse` is `status: working`. Run it via:

```bash
node scripts/scan-greenhouse.mjs
```

The scanner reads `portals.yml` and writes to `data/pipeline.md` directly. No assistant action needed beyond invoking the script.

## Phase 2 (coming)

- `hellowork` — `node scripts/scan-hellowork.mjs`
- `jobspy` — `python scripts/scan-jobspy.py` (Python 3.10+, JobSpy installed)

## Phase 3 (coming)

- `daijob`, `careercross`, `gaijinpot`, `tokyodev`, `japandev`, `enworld`, `jobsinjapan` — Playwright scrapers

## Phase 4 (coming)

- `websearch` — the assistant runs Google site-filtered queries directly, normalises results into the pipeline schema, and writes them in.

## Output

A new H2 block in `data/pipeline.md` for this scan run, with:

- Run timestamp
- Per-source breakdown (fetched, after-title, after-location, after-JD)
- Error log (sources that failed)
- Candidates section (one H4 per surviving listing)

## After scan, suggest

If candidates > 0:
```
/career-ops oferta <URL>      — evaluate one
/career-ops batch             — evaluate all in parallel
```

If candidates == 0:
- Surface the per-source breakdown table from `data/pipeline.md`
- Suggest loosening `title_filter.positive`, or adding `location_filter` variants for the format companies use (e.g., `"Tokyo, Japan"` vs `"Tokyo"`).
