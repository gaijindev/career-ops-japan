# Forking for your market

`career-ops-japan` is one worked example. The workflow — CV → profile → portals → scan → evaluate — is market-agnostic. Forking is how you adapt it for a different geography or field.

## Three steps

### 1. Fork and rename

Fork this repo on GitHub, then rename the clone to match your market:

```
career-ops-japan       →  career-ops-nyc-fintech
career-ops-japan       →  career-ops-berlin-swe
career-ops-japan       →  career-ops-london-pm
career-ops-japan       →  career-ops-remote-dx
```

The naming convention `career-ops-<geography>-<role>` makes it discoverable for others looking for a starting point.

### 2. Swap the files that encode geography and role

These are the only files that change:

| File | What to change |
|---|---|
| `portals.yml > sources` | Replace Japan-specific boards with your market's equivalents (e.g., Indeed UK, StackOverflow Jobs, AngelList, Otta for Europe). |
| `portals.yml > title_filter` | Update `positive` / `negative` keyword lists for your target roles. |
| `portals.yml > jd_disqualifiers` | Swap the Japanese-language patterns for whatever's a deal-breaker in your market (work authorization, security clearance, on-site-only, etc.). Reusable packs live in `examples/jd-disqualifiers/`. |
| `portals.yml > tracked_companies` | Replace the 15 Greenhouse companies with your market's targets. |
| `ONBOARDING.md` | Update the welcome message to describe YOUR defaults — what sources you scan, what the filter targets, who the example user is. |
| `README.md` § "What you get out of the box" | Mirror the ONBOARDING changes. |

That's it.

### 3. Keep these files invariant

Do NOT change these unless you're improving the workflow itself (in which case, please PR back to upstream):

- `CLAUDE.md` — assistant operating instructions
- `modes/` — mode behavior (scan, oferta, ofertas, pdf, contacto, …)
- `scripts/` — scanner implementations
- `cv.md.example` and `config/profile.yml.example` — these are generic enough to work for any market

## Reusable disqualifier packs

`examples/jd-disqualifiers/` ships pre-built filter packs you can drop into `portals.yml`:

- `japanese.yml` — JLPT levels, business Japanese, native-level phrasings (used by this repo's default)
- `german.yml` — *(community contribution — please PR)*
- `french.yml` — *(community contribution — please PR)*
- `work-authorization.yml` — generic "must be authorized to work in X" patterns
- `security-clearance.yml` — TS/SCI, Secret, Public Trust, etc.

Mix and match — `portals.yml` can pull from multiple packs.

## Worked examples

`examples/forks/` contains short write-ups showing how someone could fork this repo for a different market. Read these first if you're not sure where to start:

- `examples/forks/nyc-fintech.md` — *(stub — community contribution welcome)*
- `examples/forks/berlin-swe.md` — *(stub — community contribution welcome)*
- `examples/forks/london-pm.md` — *(stub — community contribution welcome)*
- `examples/forks/remote-dx.md` — *(stub — community contribution welcome)*

If you successfully fork this for a new market, please PR a short write-up to `examples/forks/` so the next person has a clearer path.

## The "follow the same direction" promise

The workflow is the invariant. The data files are the customization surface. If you change `portals.yml`, `config/profile.yml`, and `cv.md`, you get a tailored job-search command center without rewriting any code or mode logic.

That's the direction — and it's why this is forkable instead of forked-and-diverged.
