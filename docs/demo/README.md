# Reproducible Japan demo / 再現可能な日本向けデモ

## English

Run this from the repository root:

Install dependencies first:

```bash
npm install
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
```

The demo is fixture-only and defaults to `--no-network`. It validates that the
manifest and every fixture are tracked by Git, rejects credential-like content,
replaces global `fetch` with a failing guard, and reuses
`test/e2e/japan-career-ops-fixture.mjs` for the real adapter path. It does not
read `cv.md`, `config/profile.yml`, `portals.yml`, API keys, cookies, or login
sessions. The workflow is synthetic and safe to run in CI or a clean checkout.

The committed fixture set contains one small case for each first-class Japan
adapter:

| Fixture | Source | Purpose |
| --- | --- | --- |
| `demo-tokyodev` | TokyoDev | normalized salary, hybrid work, sponsorship yes |
| `demo-gaijinpot` | GaijinPot Jobs | structured detail page and salary |
| `demo-hellowork` | Hello Work | anonymous-employer diagnostic |

### Output contract

The requested directory is safe by policy: repository `output/` and an
explicitly recognized `career-ops-japan-demo-*` temporary directory are
allowed. An existing non-empty directory without the demo ownership marker is
rejected without modification. A marked directory is replaced on each run so
stale demo files cannot survive. The command writes:

```text
output/demo/
├── .career-ops-japan-demo.json
├── reports/
│   ├── demo-gaijinpot.html
│   ├── demo-gaijinpot.md
│   ├── demo-hellowork.html
│   ├── demo-hellowork.md
│   ├── demo-tokyodev.html
│   └── demo-tokyodev.md
├── tracker/applications.md
├── artifacts/manifest.json
└── summary.json
```

The Markdown reports are deterministic evaluations derived from normalized
fixture jobs. HTML is a local review artifact, not an application page. The
tracker is a demo-only Markdown table and is never merged into the user's
real `data/applications.md`.

### Sanitized Japan IT demo evidence

The following committed images show the same local, fixture-only workflow. Each
caption identifies the image as sanitized fixture output; the screenshots do
not contain real user data, credentials, or application submissions.

![Japan IT scan — sanitized fixture output](screenshots/japan-it-scan.png)

*Sanitized fixture output — Japan IT job-search scan with deterministic public-source discovery and network disabled.*

![Bilingual evaluation — sanitized fixture output](screenshots/bilingual-evaluation.png)

*Sanitized fixture output — English/Japanese evaluation for a synthetic data analytics fixture role.*

![Generated artifacts — sanitized fixture output](screenshots/generated-artifacts.png)

*Sanitized fixture output — local Markdown/HTML artifacts and manifest from the fixture demo.*

![Local tracker — sanitized fixture output](screenshots/local-tracker.png)

*Sanitized fixture output — local Markdown tracker for synthetic Japan IT fixture listings.*

### Verification

```bash
npm install
node --test test/demo-japan.test.mjs
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
```

The test runs the executable with credential-shaped environment variables,
checks the output contract, and fails if the command exits non-zero. It also
asserts that the summary reports network as disabled. The committed screenshots
above are review evidence captured from this synthetic output.

This demo does not prove live-site freshness, hiring accuracy, immigration or
legal compliance, or successful application submission. Live use remains
subject to each source's terms and human review. See
[SETUP_JAPAN.md](../SETUP_JAPAN.md) and
[LEGAL_DISCLAIMER.md](../../LEGAL_DISCLAIMER.md).

## 日本語

リポジトリのルートで次を実行します。

```bash
npm install
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
```

実行前に `npm install` を実行してください。依存関係エラーが出た場合は、ルートで
`npm install` 後に再実行します。このデモは fixture のみを使い、既定で `--no-network` です。manifest と各 fixture
が Git に追跡されていること、credential らしい内容がないことを確認し、global
`fetch` を失敗する guard に置き換えます。`cv.md`、`config/profile.yml`、
`portals.yml`、API キー、cookie、ログインセッションは読みません。

TokyoDev、GaijinPot Jobs、Hello Work を各 1 件ずつ使い、Markdown レポート、HTML
レビュー用 artifact、demo 専用 tracker、manifest、summary を `output/demo` 以下に
生成します。既存の非空ディレクトリに ownership marker がなければ変更せず失敗し、
marker がある demo ディレクトリだけを再作成するため、古いファイルは残りません。

#### スクリーンショット / Screenshot evidence

以下は同じローカル fixture デモから取得した、すべて合成データの証跡です。
各キャプションは sanitized fixture output であることを示しており、実ユーザーの
個人情報、資格情報、応募送信は含みません。

![Japan IT scan — sanitized fixture output](screenshots/japan-it-scan.png)

*Sanitized fixture output — 日本向け IT 求人スキャン（ネットワーク無効）。*

![Bilingual evaluation — sanitized fixture output](screenshots/bilingual-evaluation.png)

*Sanitized fixture output — 英日バイリンガル評価（合成 fixture）。*

![Generated artifacts — sanitized fixture output](screenshots/generated-artifacts.png)

*Sanitized fixture output — ローカル Markdown/HTML artifact と manifest。*

![Local tracker — sanitized fixture output](screenshots/local-tracker.png)

*Sanitized fixture output — 合成求人だけを含むローカル tracker。*

```bash
npm install
node --test test/demo-japan.test.mjs
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
```

上記のスクリーンショットは、この合成デモ出力から取得した release evidence です。デモは実サイトの最新性、
採用精度、在留資格・法務、応募送信の成功を保証しません。
