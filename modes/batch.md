# batch — parallel processing with subagents

Read `_shared.md` first.

## Use case

The user has many candidates to evaluate at once — typically right after a `/career-ops scan` that produced 20+ listings.

## What this mode does

1. Read `data/pipeline.md`, identify all H4 blocks with `Status: NEW`.
2. Group them into batches of 4 (or whatever fits the current concurrency limit).
3. For each batch, launch parallel subagents (per `SKILL.md`'s delegation rules) each running an `oferta` evaluation on one listing.
4. Collect results, write each evaluation back to the corresponding H4 block in `data/pipeline.md`.
5. Render a summary table sorted by grade, same shape as `/career-ops ofertas` output.

## Concurrency notes

- Default batch size: 4. Configurable later via `config/profile.yml > batch_size`.
- Avoid hitting the same domain (linkedin.com, greenhouse.io, …) more than 2x in parallel — rate-limit risk.
- A failed evaluation does not poison the batch; log under `### ⚠️ Errors` and continue.

## Output

```
Batch processed: 23 candidates

By grade:
  A:  2
  B:  8
  C:  9
  D:  3
  F:  1

Top 3:
  1. <title> at <company> (A−, 88)
  2. <title> at <company> (A−, 86)
  3. <title> at <company> (B+, 84)

Next: /career-ops pdf <URL>  ← top candidate
      /career-ops contacto    ← for top 3
```

## Side effects

Each candidate's H4 block in `data/pipeline.md` gains a `Grade:` field and an `<details>`-fenced evaluation breakdown.

## Phase note

Subagent delegation in Phase 1 uses Claude Code's built-in Agent tool. Phase 2+ may add a job-queue layer for very large batches.
