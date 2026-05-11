# auto-pipeline — evaluate + report + PDF + tracker, all from a single JD

Read `_shared.md` first.

## Trigger

The user types `/career-ops` (no sub-command) followed by either:
- A pasted JD block (detected by keywords like "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", or a company name + role)
- A URL to a job posting

This is the **default mode** for unstructured input. The router in `SKILL.md` falls through to here when the argument isn't a known sub-command.

## What this mode does

Runs four modes in sequence on the single JD, presenting a unified output:

1. **oferta** — Letter-grade evaluation with criterion breakdown.
2. **pdf** — JD-tailored CV PDF written to `data/`.
3. **contacto** — Drafts for hiring manager / recruiter / IC outreach.
4. **tracker** — Updates the candidate's H4 block in `data/pipeline.md` with Grade, PDF reference, Contacto-drafted timestamp, and Status: NEW.

## Output

A single chat response with four collapsible sections, in this order:

```markdown
## <Title> at <Company>

### 📊 Evaluation
[oferta output condensed to grade + top 3 actions]

### 📄 Tailored CV
PDF: data/cv-<company>-<role>-<date>.pdf
[1-paragraph diff summary]

### ✉️ Outreach drafts
[3 short drafts: hiring manager, recruiter, IC — collapsible]

### 📌 Pipeline
Added to data/pipeline.md as `Status: NEW`. Grade: <letter>.

---
**What's next:** review the drafts, send the one that fits, then mark Status: APPLIED.
```

## Confirmation gates

- Before generating the PDF, ask "Generate tailored CV PDF? (y/n)" if the user has a `profile.yml > pdf_auto: false` setting; default is auto-generate.
- Before drafting outreach, no confirmation needed — drafts are inert until sent.

## Side effects

- New H4 block in `data/pipeline.md` for this listing
- New PDF + markdown source in `data/` (gitignored)
- Outreach drafts persisted in chat, not on disk

## When NOT to auto-run all four

- If the grade is `D` or `F`, skip the PDF step (don't waste cycles tailoring a CV for a role you shouldn't apply to). Tell the user, ask if they want to override.
- If the user's `profile.yml` is incomplete or `cv.md` is missing, halt and trigger onboarding.
