# ofertas — compare and rank multiple offers

Read `_shared.md` first.

## Inputs

The user provides one of:
- Multiple URLs to job postings (newline- or space-separated)
- Multiple pasted JD blocks
- A keyword that matches H4 headings in `data/pipeline.md` (e.g., "all NEW candidates from this week")

## What this mode does

Runs `oferta` evaluation on each input, then produces a side-by-side comparison table sorted by score.

## Output format

```markdown
## Comparison: <N> offers

Sorted by overall grade. Highest-scoring at top.

| Rank | Grade | Title | Company | Comp | Location | Visa | JP req | Top concern |
|---|---|---|---|---|---|---|---|---|
| 1 | A- (88) | Workplace Tech Lead | ExampleCo | ¥8–11M | Tokyo (Hybrid) | yes | none | Comp tops above your range |
| 2 | B+ (82) | IT Support Engineer | Company A | ¥5–7M | Tokyo | unclear | N3 | Visa signal weak |
| 3 | C+ (68) | Senior Helpdesk | Globex | ¥6–8M | Tokyo | yes | N4 | Junior title relative to your level |

**Recommendation:** apply to #1 and #2 this week. Re-evaluate #3 if pipeline stays thin.

**Differentiators worth knowing:**
- #1 is the only role with explicit visa sponsorship language.
- #2 has the cleanest English-language-only environment.
- #3 is the only one with a Slack-accessible engineering manager (shown in their hiring page) — easier `contacto` target.
```

## Side effects

- Each input listing gets its individual `oferta` evaluation block appended to `data/pipeline.md`.
- The comparison table itself is rendered in chat, not written to disk.

## Does NOT

- Apply to anything.
- Generate PDFs (use `/career-ops pdf` per role you choose).
