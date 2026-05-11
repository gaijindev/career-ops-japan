# project — evaluate a portfolio project idea

Standalone mode (does NOT load `_shared.md`).

## Inputs

- A project idea, written or pasted
- `config/profile.yml` (for north-star, target roles)
- `cv.md` (for existing portfolio context)

## What this mode does

Decides whether a project idea will move the user toward their target roles, or be a sunk-cost distraction.

## Output

```markdown
## Project evaluation: <project name>

**Verdict: Strong / Mixed / Skip**

### What it demonstrates
[List skills, technologies, or domain knowledge the finished project would show.]

### Map to target roles
| Skill demonstrated | Target role it serves | JD requirement match |
|---|---|---|
| <skill> | <role> | "explicit requirement in 6/10 JDs" |

### What it doesn't demonstrate
[Honest list of what this project would NOT prove — e.g., production-scale, collaboration, ownership.]

### Time estimate
- MVP: <X hours>
- Polished portfolio piece: <Y hours>
- Total opportunity cost: equivalent to <N> applications or <M> hours of paid work

### Differentiation
Is this a "yet another todo app / portfolio template" or does it show something only this user could ship?

### Verdict reasoning
[1 paragraph. Honest.]

### If you proceed
1. Scope: cut it to the minimum that shows the key skill.
2. Documentation: a README with screenshots and a 30-second pitch is more valuable than the code itself for most hiring managers.
3. Deploy publicly. A local-only project is a half-finished project for portfolio purposes.

### If you skip
The most useful thing you could do with the same hours instead:
- Apply to <N> roles
- Customize <X> CVs
- Reach out to <Y> hiring managers via /career-ops contacto
```

## Side effects

None.
