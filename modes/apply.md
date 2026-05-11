# apply — live application assistant

Read `_shared.md` first.

## Inputs

- A URL to an open application form
- `cv.md`, `config/profile.yml` (source of all factual answers)
- Optional: a tailored PDF from `/career-ops pdf`

## What this mode does

1. Open the application form (Playwright session in Phase 3+; for Phase 1, the user pastes the form's questions into chat).
2. For each question, generate an answer:
   - **Factual fields** (name, email, phone, location, links): pulled directly from `profile.yml`.
   - **Yes/no fields** (visa, authorization, willing to relocate): pulled from `profile.yml > visa_status`, `work_mode`, etc.
   - **Free-text fields** (Why this company? Tell us about a project. What's your salary expectation?): drafted using `cv.md` + `profile.yml > north_star`, in the user's voice.
3. Present each Q+A to the user, one at a time. The user reviews and approves before the answer is "committed" (typed into the form for Playwright, or copied to clipboard for the user to paste).

## Hard rule

**The user clicks Submit.** Never auto-submit, ever — not on the last field, not after "user said go," not on a timer. The assistant types and the user submits.

## Compensation questions

When asked for a salary expectation:

- If `profile.yml > comp_range` is set, give a range, not a single number.
- Prefer the upper end of the user's range when the JD signals senior level.
- Never volunteer compensation history unless the form explicitly requires it AND the user has explicitly opted in.

## Cover-letter questions

If the form has a "cover letter" or "why this company" field, draft a 200–250 word answer with the same shape as `/career-ops contacto`'s hiring-manager message: one concrete accomplishment + one company-specific reason + specific ask.

## Side effects

- Appends an `Applied: <date>` line to the candidate's H4 in `data/pipeline.md`.
- Updates `Status: APPLIED` in the H4 (this is one of the few times the assistant modifies user-curated status; the user can override).

## Privacy

- Never echo the full cover letter or free-text answers to chat unless asked. Show abbreviated summaries with the user's approval to expand.
