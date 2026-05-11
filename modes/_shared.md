# _shared.md — context loaded by most career-ops modes

Read this file before executing any mode that lists `_shared.md` in its requirements (per `SKILL.md`'s context-loading table).

## Source-of-truth files

| File | Purpose | If missing |
|---|---|---|
| `config/profile.yml` | User identity, target roles, comp, archetypes, Japanese level | Trigger onboarding (see [ONBOARDING.md](../ONBOARDING.md)) — do not proceed |
| `cv.md` | User's CV in markdown | Trigger onboarding — do not proceed |
| `portals.yml` | Sources, title filters, JD disqualifiers, tracked companies | Tell the user the repo is broken; do not proceed |
| `data/pipeline.md` | Scan output and application tracker | Create if missing; never overwrite |

## Loading order

1. Read `config/profile.yml`. If missing → onboarding.
2. Read `cv.md`. If missing → onboarding.
3. Read `portals.yml`.
4. Read `data/pipeline.md` if the mode needs prior scan/application context (most do).

## Identity & PII rules

- Never echo the user's full email, phone, or street address back into chat unless they explicitly ask.
- Refer to fields by name ("your stated comp target", "your N-level") not by value when possible.
- When generating outreach drafts or applications, use the values from `profile.yml` — don't ask the user to re-state them.

## Filter contract

Every mode that surfaces listings to the user must apply, in order:

1. `portals.yml > title_filter.positive` — must match at least one
2. `portals.yml > title_filter.negative` — must NOT match any
3. `portals.yml > location_filter` — must match at least one
4. `portals.yml > jd_disqualifiers` — must NOT match any
5. `profile.yml > blocked_companies` — company must NOT be in this list
6. `profile.yml > japanese_level` — listing's required JP level must be ≤ user's

Listings that fail any check are NEVER surfaced as candidates. They MAY be reported in a "filtered out" diagnostic section if the user asked.

## Mode-completion expectations

Every mode ends with:

1. A brief summary of what changed (file modifications, listings added/scored, etc.).
2. The natural next step (e.g., "Run `/career-ops oferta <url>` on the top candidate").

Never end a mode silently — the user should always know what just happened and what's next.

## Failure modes

- **Source returns error** → log to the relevant section of `data/pipeline.md` under `### ⚠️ Errors`; continue with other sources; do not crash.
- **User config is malformed** → tell the user exactly which file and which line is broken; do not guess at intent.
- **Network unavailable** → suggest running offline modes (oferta, pdf, contacto-draft) until network returns.

## Pipeline schema

`data/pipeline.md` is human-curated. Always append; never rewrite. Each scan run gets a new H2 section dated in ISO 8601. Each candidate gets an H4 block with `Status: NEW` initially. The user manually updates `Status: APPLIED / INTERVIEW / REJECTED / OFFER / SKIPPED`.

Do not parse `Status` field as anything other than the literal user-set string. Treat unknown statuses as `NEW` for ranking purposes.
