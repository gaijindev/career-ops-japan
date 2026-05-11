# pipeline — process pending URLs from data/pipeline.md

Read `_shared.md` first.

## Use case

The user drops a list of URLs they want evaluated into `data/pipeline.md` under a section heading like `## Inbox`, then runs `/career-ops pipeline` to batch-process them.

Example inbox format the user is expected to maintain:

```markdown
## Inbox

- https://boards.greenhouse.io/example/jobs/12345
- https://www.linkedin.com/jobs/view/3923847238
- https://tokyodev.com/jobs/some-role-at-example
```

## What this mode does

1. Parse the `## Inbox` section of `data/pipeline.md` for URLs.
2. For each URL: fetch the JD, run the equivalent of `oferta` evaluation, append an H4 block under `## Scan run: <inbox-<timestamp>>` heading.
3. Remove the processed URLs from the inbox section (or mark them with `~~strikethrough~~` if the user prefers a paper trail).
4. Summarize: how many evaluated, top 3 by grade, suggest next steps.

## Delegation

If the inbox has 3 or more URLs, launch this as an Agent subagent per `SKILL.md`'s context-loading rules. The main thread shows a status line; the subagent does the heavy fetching and evaluation in parallel.

## Output

In chat:

```
Processed 7 URLs from inbox:
  - 1× A (≥90)
  - 3× B (75–89)
  - 2× C (60–74)
  - 1× failed to fetch (logged in pipeline.md)

Top recommendation: <Title> at <Company> (grade A−)

Next: /career-ops pdf <URL>
```

## Failure handling

- If a URL fails to fetch, log it under `### ⚠️ Errors` in the new scan-run block, leave the original inbox entry alone, do not crash.
- If the inbox section is empty, tell the user how to populate it; do not run.
