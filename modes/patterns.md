# patterns — analyze rejection patterns to improve targeting

Standalone mode (does NOT load `_shared.md`).

## Inputs

- `data/pipeline.md` (sole source of truth)
- `config/profile.yml` (for context on what user wants)

## What this mode does

Reads every H4 candidate block with `Status: REJECTED`, groups them by inferred rejection reason, and tells the user what to change.

## Output

```markdown
## Rejection-pattern analysis

Analyzed <N> rejections over the last <90> days.

### By stage
| Stage | Count | Rate |
|---|---:|---:|
| Application (no response in 21+ days) | 12 | 60% |
| Recruiter screen | 4 | 20% |
| Technical interview | 3 | 15% |
| Final round | 1 | 5% |

### By inferred reason
| Reason | Count | Pattern |
|---|---:|---|
| Title mismatch | 5 | Roles you applied to were "Senior X" but JDs preferred 5+ yrs; you have 3. |
| Compensation mismatch | 3 | Companies opened at ¥4–5M, your stated floor is ¥6M. |
| Tech-stack mismatch | 4 | 4 roles required Kubernetes hands-on; not in your CV. |
| Location | 2 | Roles required full on-site in non-Tokyo offices. |
| No clear pattern | 6 | Likely competition or fit signals not visible in JDs. |

### Recommended adjustments

1. **portals.yml > title_filter.negative**: add "Senior" or "Staff" until you have the seniority to match. Optionally add a `title_filter.required_seniority: mid` field once you support it.
2. **profile.yml > comp_range.min**: drop floor to ¥5M or stop applying to companies with sub-¥5M openings.
3. **CV**: if Kubernetes is genuinely on your trajectory, that's a portfolio-project gap. If not, drop the K8s-required roles from your search.
4. **Location**: tighten `portals.yml > location_filter` to Tokyo + Remote-only to stop seeing Osaka/Yokohama listings that aren't relevant.

### Companies to potentially re-engage
Rejections sometimes flip when a new role opens. From the list:
- <Company X> rejected you for <role>, but their org is hiring 3 more roles. Worth re-applying with a different angle.
```

## Side effects

None. Pure analysis. If the user wants to act on the recommendations, they edit `portals.yml` and `profile.yml` manually — the assistant does not silently rewrite these.
