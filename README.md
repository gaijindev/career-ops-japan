<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/wordmark-dark.svg"><img src="docs/wordmark-light.svg" alt="career-ops" width="250" height="56"></picture></p>

<div align="center">

[English](README.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md) | [Українська](README.ua.md) | [Русский](README.ru.md) | [Polski](README.pl.md) | [Dansk](README.da.md) | [தமிழ்](README.ta.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [Türkçe](README.tr.md)

</div>

# career-ops-japan

> Based on [santifer/career-ops](https://github.com/santifer/career-ops).

This repository is the Japan vertical slice. Its published workflow is local
and CLI-only: Node.js scripts plus a selected AI coding CLI. It does not
publish an npm package, a standalone model API, or a web UI.

<p align="center">
  <a href="https://x.com/santifer"><img src="docs/hero-banner.jpg" alt="career-ops Multi-Agent Job Search System" width="800"></a>
</p>

<p align="center">
  <em>I spent months applying to jobs the hard way. So I engineered the system I wish I had.</em><br>
  Companies use AI to filter candidates. <strong>I just gave candidates AI to <em>choose</em> companies.</strong><br>
  <em>Now it's open source.</em>
</p>

---

<p align="center">
  <img src="docs/demo.gif" alt="career-ops Demo" width="800">
</p>

<p align="center"><strong>Japan-focused local CLI workflow · fixture-backed demo · manual application review</strong></p>

<p align="center">
  <a href="https://discord.gg/8pRpHETxa4"><img src="https://img.shields.io/badge/Join_the_community-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
</p>

<p align="center">
  <sub>Also runs on any agent-skill-standard CLI. See <a href="docs/SUPPORTED_CLIS.md">Supported CLIs</a>.</sub><br>
  <img src="https://img.shields.io/badge/OpenCode-111827?style=flat&logo=terminal&logoColor=white" alt="OpenCode">
  <img src="https://img.shields.io/badge/Antigravity_CLI-4285F4?style=flat&logo=google&logoColor=white" alt="Antigravity CLI">
  <img src="https://img.shields.io/badge/Codex-412991?style=flat&logo=openai&logoColor=white" alt="Codex">
  <img src="https://img.shields.io/badge/Qwen-615CED?style=flat" alt="Qwen">
  <img src="https://img.shields.io/badge/Kimi-FF4B4B?style=flat" alt="Kimi">
  <img src="https://img.shields.io/badge/GitHub_Copilot-000?style=flat&logo=githubcopilot&logoColor=white" alt="GitHub Copilot">
  <img src="https://img.shields.io/badge/Grok_Build_CLI-000?style=flat&logo=x&logoColor=white" alt="Grok Build CLI">
  <br>
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white" alt="Playwright">
  <img src="https://img.shields.io/badge/Bubble_Tea-FF75B5?style=flat&logo=go&logoColor=white" alt="Bubble Tea">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT">
  <a href="TRADEMARK.md"><img src="https://img.shields.io/badge/Trademark-Policy-blue.svg" alt="Trademark Policy"></a>
</p>

## What Is This

career-ops-japan is a local, CLI-first workflow for evaluating Japan-focused
job listings and preparing reviewable artifacts. It can:

- **Evaluate listings** with a structured A–F assessment plus a separate G
  posting-legitimacy check
- **Generate job-specific CV PDFs** from the local templates and user-provided
  facts
- **Read permitted public listing pages** through the Japan adapters and
  preserve unstated facts as unknown
- **Write local reports and tracker entries** with integrity checks

The selected AI coding CLI drafts and explains results; the user decides what
to edit, upload, and submit. Quality depends on the profile, source evidence,
and model selected, so every generated artifact needs human review.

## Features

| Feature                  | Description                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-Pipeline**        | Paste a URL, get a structured evaluation + PDF + tracker entry                                                                         |
| **A–F Evaluation + G**   | Role summary, CV match, level strategy, comp research, personalization, interview prep (STAR+R), plus a separate G posting-legitimacy check and Work-Auth signal |
| **Interview Story Bank** | Accumulates STAR+Reflection stories across evaluations -- 5-10 master stories that answer any behavioral question                        |
| **Negotiation Scripts**  | Salary negotiation frameworks, geographic discount pushback, competing offer leverage                                                    |
| **CV PDF Generation**    | Job-specific CV PDFs from the HTML/LaTeX templates, with human review before use                                                    |
| **Cover Letter Generator** | Draft cover letters from the job description and profile, with a draft-in-chat approval gate and A4 PDF output via the HTML + Playwright pipeline |
| **Application Email Drafts** | Formal recruiter/referral/cold application emails from a report or pasted JD, with subject line, attachment checklist, source-backed fit points, and a profile-driven contact block. Draft-only -- career-ops never sends, submits, or clicks anything. |
| **Portal Scanner**       | Maintained companies and queries in [`templates/portals.example.yml`](templates/portals.example.yml), with adapters for supported public sources |
| **Batch Processing**     | Parallel evaluation with headless workers for the selected CLI, where supported                                                        |
| **Dashboard TUI**        | Terminal UI to browse, filter, and sort your pipeline                                                                                    |
| **Human-in-the-Loop**    | AI drafts and recommends; you perform login, uploads, final review, and submission                                                   |
| **Pipeline Integrity**   | Automated merge, dedup, status normalization, health checks                                                                              |
| **Interview Suite**      | Time-blocked prep plans, practice sessions with feedback, post-interview debriefs ([`interview/`](modes/interview/README.md)), and a company red-flag detector ([`interview-redflag`](modes/interview-redflag.md)) |
| **Offer Stage**          | Contract reading companion -- clause walk plus a lawyer question list ([`offer-prep`](modes/offer-prep.md)) -- and a desired/advertised/actual salary-gap analyzer (`salary-gap.mjs`) |
| **Follow-ups & Replies** | Follow-up cadence calculator and seeded reminders (`followup-cadence.mjs`, `followup-seed.mjs`); employer reply classification into tracker updates ([`reply-watch`](modes/reply-watch.md)) |
| **Pattern Analysis**     | Rejection patterns and per-ATS-channel advance rates (`analyze-patterns.mjs`), lifetime funnel stats (`stats.mjs`), repost/ghost-job detection (`detect-reposts.mjs`) |
| **Plugin System**        | Opt-in integrations (Gmail, Notion, Apify + a community registry), disabled by default -- see [docs/PLUGINS.md](docs/PLUGINS.md)        |
| **Beyond the CV**        | Company research, contact research, and draft outreach or application emails for human review. These modes do not send, submit, or click anything. |

## Quick Start

Clone this Japan checkout, install its dependencies, run the deterministic
demo, and then use a supported AI coding CLI:

```bash
git clone https://github.com/santifer/career-ops-japan.git
cd career-ops-japan
npm install
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
node --test test/demo-japan.test.mjs
node --test test/e2e/japan-career-ops.e2e.test.mjs
```

The demo is fixture-only and network-disabled by default. For agent-assisted
work, start the selected CLI from this directory. For example:

```bash
codex
# Ask it: Run the career-ops Japan kyujin mode for this pasted job description;
# show evidence and unknowns, and stop before login or application submission.
```

On first launch, the selected CLI can guide conversational setup for your CV,
profile, and target roles. Manual configuration is also supported; edit the
copied profile and portal templates when you need precise control.

<details>
<summary><b>Manual configuration</b></summary>

```bash
npm run doctor
cp config/profile.example.yml config/profile.yml
cp templates/portals.example.yml portals.yml
# Create cv.md in the project root with your CV in markdown.
```

</details>

> The workflow can be customized conversationally through your selected AI
> coding CLI, or by editing the documented local configuration files yourself.

See [docs/SETUP_JAPAN.md](docs/SETUP_JAPAN.md) for the Japan setup guide and
CLI examples. Design principles live in [ARCHITECTURE.md](ARCHITECTURE.md);
runtime flows live in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Japan setup and reproducible demo

The Japan vertical has supported adapters for TokyoDev, GaijinPot Jobs, and
Hello Work. It keeps salary, sponsorship, employer identity, Japanese level,
and work mode unknown when a public listing does not state them. Start with the
[bilingual Japan setup guide](docs/SETUP_JAPAN.md):

```bash
npm install
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
```

The command is fixture-only, deterministic, idempotent, and `--no-network` by
default. It creates Markdown reports, HTML review artifacts, a demo tracker,
and manifests under `output/demo`; it does not read credentials or touch the
real user tracker. Run the focused checks with:

```bash
node --test test/demo-japan.test.mjs
node --test test/e2e/japan-career-ops.e2e.test.mjs
```

### Sanitized Japan IT demo evidence

These committed screenshots show the fixture-only Japan IT job-search workflow.
Every caption states that the image is sanitized fixture output; no real user
data, personal CV, credentials, or application submission is shown.

![Japan IT scan — sanitized fixture output](docs/demo/screenshots/japan-it-scan.png)

*Sanitized fixture output — deterministic Japan IT job-search scan with network disabled.*

![Bilingual evaluation — sanitized fixture output](docs/demo/screenshots/bilingual-evaluation.png)

*Sanitized fixture output — bilingual evaluation for a synthetic Japan data analytics role.*

![Generated artifacts — sanitized fixture output](docs/demo/screenshots/generated-artifacts.png)

*Sanitized fixture output — local Markdown/HTML artifacts and manifest.*

![Local tracker — sanitized fixture output](docs/demo/screenshots/local-tracker.png)

*Sanitized fixture output — local tracker for synthetic Japan IT fixture listings.*

If a live source is blocked or its page shape changes, paste the visible URL or
job description for evaluation instead. Pasting is not an instruction to log
in or apply. career-ops does not bypass CAPTCHA, defeat login controls, send
email, click a final Apply button, or auto-submit applications; a person must
review and submit manually. See [the adapter guide](docs/ADAPTERS_JAPAN.md),
[the demo contract](docs/demo/README.md), and
[LEGAL_DISCLAIMER.md](LEGAL_DISCLAIMER.md) for limitations, privacy, tests,
and MIT attribution.

## Antigravity CLI Integration

career-ops supports Antigravity CLI natively, the same way it supports Claude Code and OpenCode. All slash commands are available through the shared skill entrypoint, using the same `modes/*.md` evaluation logic.

Google has transitioned consumer Gemini CLI access to Antigravity CLI. `GEMINI.md` is now a no-op compatibility guard so Antigravity does not duplicate the full project instructions when it reads both `AGENTS.md` and `GEMINI.md`.

### Native Antigravity CLI

```bash
# 1. Run in the career-ops directory
cd career-ops
agy

# 2. Use the unified /career-ops command with subcommands:
/career-ops "Senior AI Engineer at Anthropic..."
/career-ops pipeline
/career-ops scan
/career-ops pdf
/career-ops tracker
```

The skill is defined using the open standard in `.agents/skills/career-ops/SKILL.md` and symlinked/referenced for each supported CLI (e.g. `.claude/`, `.cursor/`, `.qwen/`, `.antigravitycli/`, `.grok/`).

## Codex Integration

career-ops supports Codex through the same shared router, but the invocation model is different from CLIs that auto-register slash commands. For the full guide, see [docs/CODEX.md](docs/CODEX.md).

### Interactive Codex

```bash
cd career-ops
codex
```

Slash commands are not guaranteed in Codex. If `/career-ops` is unavailable, ask Codex to run the mode directly in plain language:

```text
Evaluate this JD with career-ops auto-pipeline: https://company.com/jobs/123
Run the career-ops scan mode and summarize new matches.
Run the career-ops pipeline mode for data/pipeline.md.
Run the career-ops pdf mode for the latest evaluated role.
Run the career-ops tracker mode and summarize the current statuses.
```

### One-shot Codex (`codex exec`)

```bash
codex exec "Evaluate this JD with career-ops auto-pipeline: https://company.com/jobs/123"
codex exec "Run career-ops scan mode in this repo and summarize new matches."
codex exec "Run career-ops pipeline mode for data/pipeline.md."
codex exec "Run career-ops pdf mode for the latest evaluated role."
codex exec "Run career-ops tracker mode and summarize the current statuses."
```

## Grok Build CLI Integration

career-ops supports Grok Build CLI natively, the same way it supports Claude Code and OpenCode. `AGENTS.md` is auto-loaded as project rules, and all slash commands are available through the shared skill entrypoint.

### Native Grok Build CLI

```bash
# 1. Run in the career-ops directory
cd career-ops
grok

# 2. Use the unified /career-ops command with subcommands:
/career-ops "Senior AI Engineer at Anthropic..."
/career-ops pipeline
/career-ops scan
/career-ops pdf
/career-ops tracker
```

For headless batch workers, use `grok -p "prompt"` (add `--yolo` to auto-approve tool executions).

### Upstream/inherited: standalone Gemini API (out of scope)

The standalone Gemini API script is retained in the upstream source tree, but
it is not part of the published `career-ops-japan` workflow. This Japan slice
documents the local CLI path only; provider access, keys, retention, and
training policies are governed by the selected CLI/model provider.

## Usage

career-ops uses a shared command router. In CLIs that register slash commands, it looks like this:

```
/career-ops                → Show all available commands
/career-ops {paste a JD}   → Evaluation pipeline (evaluate + PDF + tracker)
/career-ops scan           → Scan portals for new offers
/career-ops pdf            → Generate a job-specific CV PDF for review
/career-ops cover          → Cover letter generator (paste JD or /career-ops cover {slug})
/career-ops email          → Formal application email draft (draft-only; never sends, submits, or clicks)
/career-ops batch          → Batch evaluate multiple offers
/career-ops tracker        → View application status
/career-ops apply          → Draft application answers for human review; you perform login, upload, final review, and submission
/career-ops pipeline       → Process pending URLs
/career-ops contacto       → Find hiring manager / recruiter / peer + draft a ≤300-char LinkedIn message per contact type
/career-ops deep           → Generate a structured 6-axis research prompt (AI strategy, recent moves, culture, challenges, competitors, candidate angle)
/career-ops training       → Evaluate a course/cert
/career-ops project        → Evaluate a portfolio project
```

Or paste a job URL or description directly -- career-ops can detect it and run the evaluation pipeline.

In Codex, slash commands are not guaranteed. Use the same mode names in a prompt instead, or call them from `codex exec`.

## How It Works

```
You paste a job URL or description
        │
        ▼
┌──────────────────┐
│  Archetype       │  Classifies: LLMOps / Agentic / PM / SA / FDE / Transformation
│  Detection       │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  A-F Evaluation  │  Match, gaps, comp research, STAR stories
│  G (separate)    │  Posting legitimacy and work-authorization signals
│  (reads cv.md)   │
└────────┬─────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Report  PDF  Tracker
  .md   .pdf  entry
```

## Pre-configured Portals

The maintained company list and search queries are in the current
[`templates/portals.example.yml`](templates/portals.example.yml). Copy it to
`portals.yml` and add your own:

The template contains the maintained company and query list. Supported
provider modules cover ATS APIs, board-wide feeds, XML/RSS feeds, markdown
feeds, and local parsers; see [Supported job boards](docs/SUPPORTED_JOB_BOARDS.md)
for the current table.

By default `node scan.mjs` (a.k.a. `npm run scan`) trusts what each permitted
public feed returns. Some sources leave stale postings in their public API even
after the role is closed, so those expired entries can leak into `pipeline.md`.
Pass `--verify` to use Playwright for a bounded public-page liveness check:

```bash
node scan.mjs --verify          # public-source discovery + permitted public-page check
```

The verification is sequential and only runs against new offers (after dedup).
It does not log in, access private pages, bypass CAPTCHA, upload files, or
submit applications.

## Dashboard TUI

The built-in terminal dashboard lets you browse your pipeline visually:

```bash
npm run serve:dashboard   # launch the TUI
npm run build:dashboard   # optional: build the standalone binary
```

Features: 6 filter tabs, 4 sort modes, grouped/flat view, lazy-loaded previews, inline status changes.

### Upstream/inherited: experimental web UI (out of scope)

The experimental web UI is an upstream/parallel surface and is not part of the
published `career-ops-japan` vertical slice. Japan documentation and release
verification cover the local CLI workflow only.

## Project Structure

```
career-ops-japan/
├── AGENTS.md                    # Canonical agent instructions (all CLIs)
├── CLAUDE.md                    # CLI wrapper (imports AGENTS.md)
├── CODEX.md                     # Codex wrapper (imports AGENTS.md)
├── OPENCODE.md                  # OpenCode wrapper (imports AGENTS.md)
├── GEMINI.md                    # Legacy no-op guard to avoid Antigravity duplicate context
├── cv.md                        # Your CV (create this)
├── article-digest.md            # Your proof points (optional)
├── config/
│   └── profile.example.yml      # Template for your profile
├── modes/                       # Skill modes
│   ├── _shared.md               # Shared context (customize this)
│   ├── oferta.md                # Single evaluation
│   ├── pdf.md                   # PDF generation
│   ├── cover.md                 # Cover letter generation
│   ├── email.md                 # Formal application email drafts
│   ├── scan.md                  # Portal scanner
│   ├── batch.md                 # Batch processing
│   └── ...
├── templates/
│   ├── cv-template.html         # CV HTML template
│   ├── portals.example.yml      # Scanner config template
│   └── states.yml               # Canonical statuses
├── batch/
│   ├── batch-prompt.md          # Self-contained worker prompt
│   └── batch-runner.sh          # Orchestrator script
├── dashboard/                   # Go TUI pipeline viewer
├── data/                        # Your tracking data (gitignored)
├── reports/                     # Evaluation reports (gitignored)
├── output/                      # Generated PDFs (gitignored)
├── fonts/                       # Space Grotesk + DM Sans
├── docs/                        # Setup, customization, budget guide, architecture
└── examples/                    # Sample CV, report, proof points
```

## Tech Stack

![Claude Code](https://img.shields.io/badge/Claude_Code-000?style=flat&logo=anthropic&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)
![Bubble Tea](https://img.shields.io/badge/Bubble_Tea-FF75B5?style=flat&logo=go&logoColor=white)

- **Agent**: selected AI coding CLI with shared skills and modes (`AGENTS.md` + CLI wrapper)
- **PDF**: Playwright + HTML template
- **Cover letters**: HTML template + Playwright (A4 PDF)
- **Scanner**: permitted public-source adapters and optional Playwright checks
- **Dashboard**: Go + Bubble Tea + Lipgloss (Catppuccin Mocha theme)
- **Data**: Markdown tables + YAML config + TSV batch files

## Also Open Source

- **[cv-santiago](https://github.com/santifer/cv-santiago)** -- The portfolio website (santifer.io) with AI chatbot, LLMOps dashboard, and case studies. If you need a portfolio to showcase alongside your job search, fork it and make it yours.

## FAQ

**What is career-ops-japan?**
career-ops-japan is an open-source, local CLI workflow for Japan-focused job
listing evaluation. It produces reviewable reports, job-specific CV artifacts,
and local tracker entries from the facts and source evidence you provide.

**Can I run career-ops for free, or on a cheaper / local model?**
Yes. career-ops is CLI-agnostic and runs on free and local models — via OpenRouter free models, Ollama, or any OpenAI-compatible endpoint — so you are not tied to a paid subscription. See [docs/RUNNING_ON_A_BUDGET.md](docs/RUNNING_ON_A_BUDGET.md) for the full setup.

**Which AI CLI does career-ops-japan use?**
Use a supported AI coding CLI selected for your environment. Exact command
syntax varies by CLI; the Japan setup guide shows Codex, Claude Code, and
OpenCode examples.

**How do I install career-ops on Windows?**
career-ops runs on Windows. If skills fail to load with a symlink error during install, the fix is in [docs/FAQ.md](docs/FAQ.md). Full steps are in [docs/SETUP.md](docs/SETUP.md).

**Does career-ops auto-apply to jobs for me?**
No. career-ops is a filter, not a spray-and-pray auto-applier. The AI evaluates, ranks and drafts; you review and decide. It never submits, sends, or clicks anything — you always have the final call. That human-in-the-loop design is the whole point.

**Is career-ops free and open source?**
Yes. career-ops is free and open source, and for the candidate it always will be — it is the first reference implementation of the [CareerOps Manifesto](https://career-ops.org/manifesto). Read it, and if it says what you believe, sign it.

## About the Author

This Japan slice is based on the upstream [career-ops repository](https://github.com/santifer/career-ops). See the upstream project for its broader history and integrations.

## Disclaimer

**career-ops is a local, open-source tool, NOT a hosted service.** By using this software, you acknowledge:

1. **You control local project files.** Your CV, contact info, and other files remain under your local project control by default. The selected CLI/model may transmit prompts or selected files to its provider; review that provider's retention, training, security, and deletion policies before use. This project does not operate a hosted career-ops API or collect project telemetry.
2. **You control the AI.** The default prompts instruct the AI not to auto-submit applications, but AI models can behave unpredictably. If you modify the prompts or use different models, you do so at your own risk. **Always review AI-generated content for accuracy before submitting.**
3. **You comply with third-party ToS.** You must use this tool in accordance with the Terms of Service of the career portals you interact with (Greenhouse, Lever, Workday, LinkedIn, etc.). Do not use this tool to spam employers or overwhelm ATS systems.
4. **No guarantees.** Evaluations are recommendations, not truth. AI models may hallucinate skills or experience. The authors are not liable for employment outcomes, rejected applications, account restrictions, or any other consequences.

See [LEGAL_DISCLAIMER.md](LEGAL_DISCLAIMER.md) for full details. This software is provided under the [MIT License](LICENSE) "as is", without warranty of any kind.

## Contributors

<a href="https://github.com/santifer/career-ops/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=santifer/career-ops" />
</a>

Every person who has shipped code, docs, translations or tests is listed in
[CONTRIBUTORS.md](CONTRIBUTORS.md) — including non-code contributions, which
the graph above cannot show.

Got hired using career-ops? [Share your story!](https://github.com/santifer/career-ops/issues/new?template=i-got-hired.yml)

## License & Trademark

The code is licensed under [MIT](LICENSE). The "career-ops" name and
brand are governed by the [Trademark Policy](TRADEMARK.md), permissive
for community use, reserved for commercial product naming and
endorsement.

## Let's Connect

[![Website](https://img.shields.io/badge/santifer.io-000?style=for-the-badge&logo=safari&logoColor=white)](https://santifer.io)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/santifer)
[![X](https://img.shields.io/badge/X-000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/santifer)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/8pRpHETxa4)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hi@santifer.io)
