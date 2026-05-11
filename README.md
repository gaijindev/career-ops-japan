# career-ops-japan

A career-ops fork preconfigured for the Japanese job market. Scans Japanese and English-language job boards, filters out roles with hard Japanese-language requirements, and pipelines candidates for AI-assisted evaluation.

Built for English-speaking candidates targeting tech roles in Japan — but the workflow is market-agnostic. See [FORKING.md](FORKING.md) if you want to adapt it for another geography or field.

---

## Status

| Component | Status |
|---|---|
| Greenhouse Boards API (15 SaaS companies with Tokyo offices) | ✅ Working |
| JobSpy (LinkedIn / Indeed / Glassdoor / Google Jobs) | 🚧 Stub (Phase 2) |
| HelloWork scraper (government board) | 🚧 Stub (Phase 2) |
| Playwright scrapers (Daijob, CareerCross, GaijinPot, TokyoDev, Japan Dev, en world, JobsInJapan) | 🚧 Stub (Phase 3) |
| WebSearch query templates | 🚧 Stub (Phase 4) |
| `portals.yml` with full Japan defaults + JD disqualifiers | ✅ Shipped |
| All mode files (`scan`, `oferta`, `pdf`, `contacto`, etc.) | 🚧 Stubs (Phase 4) |

Phase 1 ships everything you need to fork, customize, and run a real scan against Greenhouse companies. The remaining sources land in follow-up phases.

---

## What you get out of the box

**Tracked companies (Greenhouse API, free, no key):**

Figma · Stripe · Cloudflare · GitHub · HubSpot · PagerDuty · Snowflake · Splunk · Dropbox · MongoDB · Datadog · Elastic · Twilio · Asana · Zendesk

All filtered for Tokyo / Japan / Remote-Japan-friendly listings.

**Language-requirement filter (`portals.yml > jd_disqualifiers`):**

- English phrasings: `"JLPT N1"`, `"JLPT N2"`, `"business-level Japanese"`, `"fluent in Japanese"`, `"native-level Japanese"`, `"Japanese: Native"`, …
- Japanese phrasings: `日本語必須`, `日本語ビジネスレベル`, `ビジネス日本語`, `母語レベル`, `ネイティブレベル`, `ネイティブ日本語`, `JLPT N1相当`, `日本語能力試験1級`, `日本語能力試験2級`, …

Any JD containing one of these phrases is auto-skipped.

**Workflow:**

```
[your CV + profile] ──► /career-ops scan ──► data/pipeline.md ──► /career-ops oferta <jd>
                                                                 /career-ops pdf
                                                                 /career-ops contacto
                                                                 /career-ops apply
```

---

## Requirements

- Node.js 18+
- Python 3.10+ (for JobSpy and Playwright scrapers in later phases)
- [Claude Code](https://claude.com/claude-code) (the `/career-ops` skill is invoked through it)
- A GitHub account, optional (only needed if you want to commit your customizations to a private fork)

---

## Install

```bash
git clone https://github.com/achanthavong510/career-ops-japan.git
cd career-ops-japan
npm install
```

Then open the directory in Claude Code and run `/career-ops` to see the welcome message.

---

## First scan in 5 minutes

```bash
# 1. Copy templates
cp cv.md.example cv.md
cp config/profile.yml.example config/profile.yml

# 2. Open and edit (TextEdit / VS Code / whatever you use)
#    - cv.md: paste your CV in markdown
#    - config/profile.yml: name, email, target roles, comp range
#    - portals.yml > title_filter.positive: keywords for YOUR role

# 3. Run a Greenhouse scan
node scripts/scan-greenhouse.mjs

# Output is written to data/pipeline.md
```

See [ONBOARDING.md](ONBOARDING.md) for the assistant-guided version of the same flow.

---

## Forking for your market

This is a Japan-tech-IT worked example. The workflow (CV → profile → portals → scan → evaluate) is market-agnostic — swap `portals.yml` and `jd_disqualifiers` to retarget it.

See [FORKING.md](FORKING.md) for a step-by-step.

---

## Contributing

Phase 1 ships Greenhouse only. Phases 2–4 add the rest. Pull requests welcome — especially for:

- New scrapers (one source per PR)
- Additional `jd_disqualifiers` patterns for languages we haven't covered
- Worked-example forks under `examples/forks/` (NYC fintech, Berlin SWE, London PM, etc.)

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT. See [LICENSE](LICENSE).
