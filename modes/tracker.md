# tracker — application status overview

Standalone mode (does NOT load `_shared.md`).

## Inputs

- `data/pipeline.md` (sole source of truth)

## What this mode does

Parses every H4 candidate block in `data/pipeline.md`, counts by `Status:` field, renders a dashboard.

## Output

```markdown
## Application tracker — <YYYY-MM-DD>

### Status counts

| Status | Count | % of total |
|---|---:|---:|
| NEW | 14 | 33% |
| APPLIED | 18 | 43% |
| INTERVIEW | 5 | 12% |
| REJECTED | 4 | 10% |
| OFFER | 1 | 2% |
| SKIPPED | 0 | 0% |

### Funnel

```
NEW → APPLIED: 18/42 (43%) — healthy
APPLIED → INTERVIEW: 5/18 (28%) — at or above market for senior tech
INTERVIEW → OFFER: 1/5 (20%) — small sample; not actionable yet
```

### This week

- 3 new applications (companies: A, B, C)
- 1 first-round interview (Company D)
- 1 offer received (Company E) — needs decision by <date>

### Stalled (>14 days in same status, no movement)

- <Company F> APPLIED 18 days ago — consider follow-up
- <Company G> INTERVIEW 21 days ago — consider follow-up

### Next steps

- Decide on <Company E> offer
- Follow up with <Company F>, <Company G>
- 14 NEW candidates pending evaluation → /career-ops batch
```

## Status canonical values

- `NEW` — discovered, not yet evaluated
- `APPLIED` — application submitted
- `INTERVIEW` — at least one interview scheduled or completed
- `OFFER` — written offer received
- `REJECTED` — explicit rejection from the company
- `SKIPPED` — user decided not to pursue
- `WITHDRAWN` — user pulled the application

Unknown statuses are treated as `NEW`.

## Side effects

None. This is a read-only dashboard.
