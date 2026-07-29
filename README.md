# career-ops-japan

`career-ops-japan` is a local CLI workflow for evaluating Japan-focused IT
job listings and preparing artifacts for human review. It is based on
[santifer/career-ops](https://github.com/santifer/career-ops).

The current Japan release includes adapters for:

- [TokyoDev](https://www.tokyodev.com/)
- [GaijinPot Jobs](https://jobs.gaijinpot.com/)
- [Hello Work](https://www.hellowork.mhlw.go.jp/)
- pasted job URLs or job descriptions when a source adapter is unavailable

The workflow is local and CLI-only. It does not publish an npm package, a
hosted API, or a web UI.

## Quick start

Requirements: Node.js 22.5+, Git, and a supported AI coding CLI if you want
agent-assisted evaluation.

```bash
git clone https://github.com/gaijindev/career-ops-japan.git
cd career-ops-japan
npm install

# Run the offline demo
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo --no-network

# Run the Japan checks
node --test test/demo-japan.test.mjs
node --test test/e2e/japan-career-ops.e2e.test.mjs
```

For personal use, copy the local templates and add your own files:

```bash
cp config/profile.example.yml config/profile.yml
cp templates/portals.example.yml portals.yml
touch cv.md
```

Start your selected CLI in the repository and ask it to evaluate a pasted job
description or run the Japan scan. See [docs/SETUP_JAPAN.md](docs/SETUP_JAPAN.md)
for the bilingual setup guide.

For Codex, start `codex` in this directory and use plain-language prompts;
slash commands are not guaranteed. See [CODEX.md](CODEX.md).

## What it produces

- structured A–F evaluation plus a separate G posting-legitimacy check
- evidence-backed Markdown reports and job-specific CV PDFs
- local tracker entries and HTML review artifacts
- explicit unknowns when a listing does not state salary, sponsorship, employer,
  Japanese level, or work mode

The repository scripts and documented default workflow stop before login,
CAPTCHA handling, final Apply clicks, email sending, CV upload, and application
submission. You review and submit applications yourself. A selected CLI or
model can behave differently if its instructions or tools are changed.

## Demo screenshots

All images are sanitized, synthetic fixture output for Japan IT roles:

![Japan IT scan](docs/demo/screenshots/japan-it-scan.png)

![Bilingual evaluation](docs/demo/screenshots/bilingual-evaluation.png)

![Generated artifacts](docs/demo/screenshots/generated-artifacts.png)

![Local tracker](docs/demo/screenshots/local-tracker.png)

The demo contract and fixture inventory are in [docs/demo/README.md](docs/demo/README.md).

## Documentation

- [Japan setup guide](docs/SETUP_JAPAN.md)
- [Adapter guide](docs/ADAPTERS_JAPAN.md)
- [Data contract and privacy boundary](DATA_CONTRACT.md)
- [Legal disclaimer and acceptable use](LEGAL_DISCLAIMER.md)
- [Contribution guide](CONTRIBUTING.md)
- [Release checklist](docs/release-checklist.md)

## Scope and limitations

This release verifies adapters and workflows with committed fixtures. Live
platform smoke tests were not run. Public pages, terms, rate limits, and markup
can change. Use only permitted public access and follow each source's terms.

The source tree retains broader upstream features, including standalone model
evaluators and an experimental web UI. They are outside this Japan release's
documented workflow and test scope.

## License

MIT. See [LICENSE](LICENSE) and [TRADEMARK.md](TRADEMARK.md).
