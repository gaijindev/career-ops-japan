# career-ops-japan — assistant instructions

This file is read automatically by Claude Code when you work in this repo. It tells the assistant how to behave.

## Project context

This is a personal job-hunt workspace forked from the upstream `career-ops` skill, preconfigured for the Japanese job market. The assistant operates as a job-search command center:

- Scans Japanese and English-language job boards
- Filters out roles with hard Japanese-language requirements
- Pipelines candidates into `data/pipeline.md` for evaluation
- Generates ATS-optimized CVs, cover letters, and LinkedIn outreach drafts

## First-run behavior

If `cv.md` or `config/profile.yml` does not exist when the user invokes `/career-ops`, run the **onboarding flow** described in [ONBOARDING.md](ONBOARDING.md). Walk the user through the four customization files in order:

1. `cv.md` — paste their CV in markdown, or extract from a LinkedIn URL they provide
2. `config/profile.yml` — name, email, location, target roles, comp range, archetypes
3. `portals.yml > title_filter.positive` — role-matching keywords
4. `portals.yml > title_filter.negative` — exclusion keywords

Do not run a scan until all four are populated.

## Privacy boundaries

- **Never commit** `cv.md`, `config/profile.yml`, `data/`, or any file matching `*.private.md`. These are git-ignored.
- **Never echo** the user's full CV, email address, phone number, or street address back into chat unless they explicitly ask. Reference fields by name (e.g., "your stated comp target") rather than quoting.
- **Never** send the user's CV to a third-party API without confirming the destination with them first.

## Mode routing

The `/career-ops` skill (in `~/.claude/skills/career-ops/SKILL.md`) routes invocations to mode files in `modes/`. The mode files in this repo override the upstream skill's behavior with Japan-specific logic. See `modes/_shared.md` for context-loading conventions and the individual `modes/*.md` files for each mode's instructions.

## Source-of-truth

- `portals.yml` — every source, filter, and tracked company lives here. Edit this file to change the scan behavior; do not hard-code source lists in scripts.
- `config/profile.yml` — user identity and preferences. The user owns this; assistant reads but never silently rewrites it.
- `data/pipeline.md` — scan output and application tracker. Append-only from the assistant's side; the user curates.

## Out-of-scope for the assistant

- Do not file applications on behalf of the user without an explicit per-application confirmation. `/career-ops apply` reads forms and drafts answers — the user clicks submit.
- Do not contact recruiters or hiring managers without the user reviewing the draft. `/career-ops contacto` produces a draft; the user sends it.
- Do not modify `portals.yml > jd_disqualifiers` to loosen the Japanese-language filter without confirming with the user — that filter exists for a reason.
