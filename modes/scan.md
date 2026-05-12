# scan — discover new listings across all sources

Read `_shared.md` first.

## Inputs

- `portals.yml` (sources, filters, tracked companies)
- `config/profile.yml` (for blocked_companies, japanese_level)

## What this mode does

Runs every source in `portals.yml > sources` whose `status: working`, applies the filter chain in `_shared.md`, appends survivors to `data/pipeline.md`.

## What's working now

| Source | Command | Notes |
|---|---|---|
| `greenhouse` | `node scripts/scan-greenhouse.mjs` | Public API, no key. |
| `japandev` | `node scripts/scan-japandev.mjs` | HTML scrape, ~60 latest listings. |
| `jobspy` | `.venv/bin/python scripts/scan-jobspy.py` | Indeed Japan by default; LinkedIn/Glassdoor opt-in in `portals.yml`. |

When the user runs `/career-ops scan`, invoke all three. The pipeline.md schema is identical across them, so downstream modes (oferta, batch, tracker) treat them uniformly. Combined: `npm run scan`.

## Coming

- `hellowork` — Playwright; JS-driven ASP.NET, needs viewstate handling.
- `daijob`, `careercross`, `gaijinpot`, `tokyodev`, `enworld`, `jobsinjapan` — Playwright scrapers
- Japan Dev full coverage (beyond the first ~60 listings) — Playwright

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
