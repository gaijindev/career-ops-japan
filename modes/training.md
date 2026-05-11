# training — evaluate a course or certification against north-star

Standalone mode (does NOT load `_shared.md`).

## Inputs

- Course / cert name and URL
- `config/profile.yml` (for north-star and target roles)
- `data/pipeline.md` (for recent rejection patterns, if any)

## What this mode does

Decides whether spending the time/money on a given course or cert is worth it for the user's stated career direction.

## Output

```markdown
## Evaluation: <Course / Cert>

**Verdict: Recommended / Optional / Skip**

### What it teaches
[1–2 sentences from the course description, no marketing fluff]

### Relevance to north-star
[Direct hit / adjacent / tangential / unrelated]

### Relevance to current target roles
| Target role (from profile.yml) | Coverage |
|---|---|
| <Role 1> | Direct — appears in 8/10 JDs you've seen |
| <Role 2> | Adjacent — appears in 3/10 |

### Cost / time tradeoff
- Listed price:
- Est. completion time:
- Opportunity cost: what the user could do with that time instead

### Signal vs skill
- Is this primarily a **credential** that HR filters look for, or a **skill** that hiring managers test?
- If credential: how often does it appear as a requirement in JDs the user is targeting?
- If skill: is the user already proficient enough that the course is redundant?

### Better alternatives (if Skip)
- A shorter / cheaper / more rigorous option
- A portfolio project that demonstrates the same competency

### Verdict reasoning
[1 paragraph synthesizing the above]
```

## Side effects

None.
