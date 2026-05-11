# pdf — generate an ATS-optimized, JD-tailored CV PDF

Read `_shared.md` first.

## Inputs

- `cv.md` (the user's base CV)
- A JD (URL, pasted text, or `data/pipeline.md` heading)

## What this mode does

1. Read the JD; extract its **must-have keywords** (skills, tools, frameworks, certifications, role-specific terms).
2. Read `cv.md`; identify sections where those keywords could legitimately surface (don't invent — only highlight what's already true).
3. Rewrite `cv.md` into a JD-tailored version, prioritising the JD's keywords in summary and skills sections. Preserve all factual content from `cv.md`.
4. Render to PDF using a markdown→PDF tool (suggested: pandoc with a clean ATS-friendly template, or one of the gstack `make-pdf` skills if available).

## Output

- `data/cv-<company>-<role-slug>-<YYYY-MM-DD>.pdf` — the tailored PDF (gitignored)
- `data/cv-<company>-<role-slug>-<YYYY-MM-DD>.md` — the tailored markdown source (gitignored)
- In chat: a diff summary showing what was emphasised vs the base CV. No new factual claims.

## ATS rules

- Single column. No tables. No graphics. No multi-column layouts.
- Standard section headers: `Summary`, `Experience`, `Skills`, `Education`, `Languages`.
- Keywords appear in prose, not in keyword-soup blocks.
- File size < 1 MB. Embedded fonts only if needed.

## Honesty rules

NEVER add a skill or experience to the tailored CV that isn't in `cv.md`. If the JD requires a skill the user doesn't have, surface that fact at the bottom of the chat output as a "gap to address," but do not paper over it.

## Side effects

- Appends a `PDF generated: <filename>` line to the candidate's H4 block in `data/pipeline.md`.

## After PDF, suggest

```
/career-ops contacto  — find a hiring manager / recruiter to send this to
/career-ops apply     — if there's an application form, draft answers
```
