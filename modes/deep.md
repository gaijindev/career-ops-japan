# deep — deep research about a company

Standalone mode (does NOT load `_shared.md`).

## Inputs

- A company name (or a JD URL the assistant can extract the company name from)

## What this mode does

Produces a structured company brief intended to inform application + interview prep. Uses WebSearch + WebFetch on public sources.

## Output sections

```markdown
## Company brief: <Company>

### One-paragraph summary
What they do, who their customers are, the business model in 3–5 sentences.

### Stage / scale
- Founded:
- Funding stage / public status:
- Employees (global / in target market):
- Revenue or other size signal:

### Tokyo / Japan presence
- Office location(s):
- Local team size estimate:
- Lines of business in-market:
- Reporting structure (does Japan report to APAC HQ, or directly to global?):

### Recent signals (last 6 months)
- Funding announcements
- Major hires / departures
- Product launches
- Layoffs or restructuring
- Press incidents (good or bad)

### Engineering / IT culture (if relevant)
- Public tech blog?
- Conference talks / GitHub presence?
- Specific tools / stack mentioned in JDs?
- Remote / hybrid / on-site stance?

### Recruitment signals
- ATS used (Greenhouse, Lever, Workday, custom)
- Number of open roles in target market right now
- Hiring velocity vs 6 months ago
- Glassdoor interview process descriptions, if reliable

### Compensation signals
- Levels.fyi / public salary data (if available, with sample size)
- Stock / RSU policies (if disclosed)
- Bonus structure (if known)
- Note: Japan-specific comp may differ significantly from global figures

### Risk flags
- Anything that should make the user think twice before applying

### Recommendation
- Apply / explore further / skip
- One sentence why
```

## Privacy / sourcing

- Cite sources inline: `[source name](URL)`. No uncited claims.
- Distinguish company-disclosed info from third-party reports (Glassdoor, news).
- For Glassdoor data, note the sample size and how recent.

## Side effects

None. Brief is rendered in chat. If the user wants it persisted, they can save it to `data/companies/<company>.md` (gitignored) manually.
