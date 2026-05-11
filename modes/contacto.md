# contacto — LinkedIn outreach: find contacts + draft message

Read `_shared.md` first.

## Inputs

- A job posting (URL or company name + role)
- `cv.md` (for talking points)
- `config/profile.yml` (for the user's voice and stated north-star)

## What this mode does

1. Identify the target company.
2. Suggest 2–3 search queries the user can run on LinkedIn to find:
   - The hiring manager for the role
   - A recruiter at the company who handles this role family
   - An IC currently in or adjacent to the target team (best for informational chat)
3. Draft 3 different outreach messages, one per target type, in the user's voice.

## Output format

```markdown
## Outreach drafts for <Role> at <Company>

### Find these people on LinkedIn

1. **Hiring manager** — search:
   `"Engineering Manager" OR "Director" "<team or role keyword>" "<Company>"`
2. **Recruiter** — search:
   `"Talent Acquisition" OR "Recruiter" "<Company>" "Japan" OR "Tokyo"`
3. **IC on the team** — search:
   `"<Role>" "<Company>" Tokyo`

### Drafts

#### To: Hiring manager (cold outreach)
[150-word message; mentions one specific accomplishment from cv.md that maps to a stated JD requirement; ends with a specific ask — a 15-min call this week or a portfolio link.]

#### To: Recruiter (cold outreach)
[100-word message; acknowledges you've applied / are about to apply via the formal channel; flags one differentiator; offers to send a 1-page summary.]

#### To: IC on the team (informational interview)
[100-word message; complimentary on one piece of public work (talk, blog, project); asks for 15 min to learn what the role is *actually* like, NOT to ask for a referral. Referral comes later if they offer.]
```

## Voice & honesty rules

- Match the user's voice as inferred from `cv.md` and any prior `data/` content. Don't invent achievements.
- Never claim a referral or a personal connection that doesn't exist.
- Lead with one concrete accomplishment, not "I'm passionate about..."
- Closing ask must be specific (a call, a portfolio link, a 1-pager) — never "I look forward to hearing from you".

## Side effects

- Appends a `Contacto drafted: <date>` line to the candidate's H4 in `data/pipeline.md`.
- Does NOT send anything. The user reviews and sends manually.

## Privacy

- Do not invent specific employee names. The user finds the person on LinkedIn; the assistant drafts to a role-type (`<Hiring Manager>`), not a named individual.
- If the user provides a specific name, then use it.
