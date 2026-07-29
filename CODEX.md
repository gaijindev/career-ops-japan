@AGENTS.md
<!-- Codex config — imports AGENTS.md -->

## Japan workflow

For Japan setup, source support, pasted-URL fallback, privacy, and the
fixture-only demo, read [docs/SETUP_JAPAN.md](docs/SETUP_JAPAN.md).

Run the reproducible demo from the repository root:

```bash
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
```

The demo is deterministic and network-disabled by default. It uses committed
synthetic TokyoDev, GaijinPot Jobs, and Hello Work fixtures, writes reports,
HTML artifacts, and a demo tracker beneath the requested output directory, and
never submits an application. If a slash command is unavailable, ask Codex in
plain language to run the Japan `kyujin`/`oubo` workflow and stop before login,
CAPTCHA, Apply, email, or upload.

日本向けの手順は [docs/SETUP_JAPAN.md](docs/SETUP_JAPAN.md) にあります。デモ、テスト、
アダプター契約は [docs/demo/README.md](docs/demo/README.md) と
[docs/ADAPTERS_JAPAN.md](docs/ADAPTERS_JAPAN.md) を参照してください。
