# oferta — evaluate a single JD

Read `_shared.md` first.

## Inputs

The user provides one of:
- A URL to a job posting
- A pasted JD text block
- The H4 heading of a candidate already in `data/pipeline.md`

## What this mode does

Produces an A–F letter grade for the role against the user's profile + CV, with breakdown across:

| Criterion | Weight |
|---|---|
| Role fit (archetype × seniority match) | 25% |
| Compensation (vs `profile.yml > comp_range`) | 15% |
| Location (vs `profile.yml > location` and `work_mode`) | 10% |
| Visa signal (vs `profile.yml > visa_status`) | 10% |
| Japanese requirement (vs `profile.yml > japanese_level`) | 10% |
| North-star alignment (qualitative) | 15% |
| Company quality signal (size, stage, reputation) | 15% |

## Grading scale

- **A** (≥90): apply immediately, this is on-target
- **B** (75–89): apply, expect competition or stretch in one criterion
- **C** (60–74): apply only if pipeline is thin; flag the weakest criterion to the user
- **D** (40–59): skip unless the user has a strategic reason
- **F** (<40): skip; suggest the role-type the user should actually search for

## Output format

```markdown
## Evaluation: <Job Title> — <Company>

**Grade: B+ (82/100)**

| Criterion | Score | Notes |
|---|---:|---|
| Role fit | 22/25 | Archetype "IT Support" at mid-seniority. Direct match. |
| Compensation | 11/15 | Listed range tops at ¥7M; your target floor is ¥5M — overlap, slight stretch on upside. |
| Location | 10/10 | Tokyo (Hybrid). Matches your stated preference. |
| Visa signal | 7/10 | Listing says "visa sponsorship considered case-by-case" — not a hard yes. |
| Japanese requirement | 10/10 | "English-friendly environment, no JP required." |
| North-star alignment | 12/15 | Workplace-tech focus is on-target; lacks the "automation ownership" angle from your north-star. |
| Company quality | 10/15 | Series C SaaS, ~600 employees, Tokyo office of 40. Mid-tier brand recognition. |

**Top 3 actions:**
1. Apply this week; their Tokyo office is hiring 3 roles, indicating real headcount.
2. In your cover letter, lead with onboarding-automation experience — that's the gap you fill in their JD.
3. Ask about visa-sponsorship explicitly in the first recruiter call.

**Next:** `/career-ops pdf <URL>` to generate a tailored CV.
```

## Side effects

- Updates the H4 block in `data/pipeline.md` for this listing (or creates it if the JD was pasted fresh): add the grade to a `Grade:` field, append the evaluation block as a fenced details section.
- Do NOT change `Status:` — that's user-curated.

## Does NOT

- Generate a PDF (use `/career-ops pdf`)
- Send any outreach (use `/career-ops contacto`)
- Apply to the role
