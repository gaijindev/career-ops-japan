# Running the Japan CLI workflow on a budget

The published Japan workflow uses a selected AI coding CLI. It does not expose
standalone evaluator commands or a project-hosted API.

## Reduce model usage

- Run the fixture demo first. It is offline and does not use model tokens.
- Run `node scan.mjs` to collect permitted public listings before asking a CLI
  to evaluate individual roles.
- Evaluate only shortlisted roles instead of sending an entire portal export to
  a model.
- Use the CLI's own model, routing, and local-model settings when available.
  Those settings and costs belong to the selected CLI and provider.

```bash
# Offline verification
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo --no-network

# Public-source scan; review the source terms and your portals.yml first
node scan.mjs
```

## Local models and provider privacy

A CLI may support Ollama, an OpenAI-compatible endpoint, or another local/model
provider. Configure that in the CLI rather than adding credentials to this
repository. A selected CLI may transmit prompts, CV content, profile fields, or
pasted job descriptions to its provider; check the provider's current
retention, training, security, and deletion policies before using personal data.

The repository does not collect project telemetry or operate a hosted
career-ops API. See [LEGAL_DISCLAIMER.md](../LEGAL_DISCLAIMER.md) and
[DATA_CONTRACT.md](../DATA_CONTRACT.md) for the data boundary.

The upstream repository retains broader model and evaluator documentation. It
is not the supported setup path for this Japan release.
