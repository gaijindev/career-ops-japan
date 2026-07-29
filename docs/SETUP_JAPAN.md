# Japan setup guide / 日本向けセットアップガイド

This guide describes the local, human-in-the-loop Japan workflow. The
English section comes first; the Japanese section mirrors the same commands
and safety rules.

## English

### Prerequisites and installation

- Node.js 20 or newer: `node --version`
- npm: `npm --version`
- One supported AI coding CLI if you want agent-assisted evaluation: Codex,
  Claude Code, or OpenCode
- Chromium is optional. Install it only for browser/PDF workflows:
  `npx playwright install chromium`

From the repository root:

```bash
npm install
node doctor.mjs --json
```

For a normal personal workspace, create the ignored user-layer files and edit
them with your own information:

```bash
cp config/profile.example.yml config/profile.yml
cp templates/portals.example.yml portals.yml
touch cv.md
```

Put personal facts only in `cv.md`, `config/profile.yml`, or other documented
user-layer files. Do not put real contact information in fixtures, tests,
reports committed to a branch, or pull requests.

### Reproducible offline demo

The demo is the safest first check. It uses three committed synthetic listings
and never needs a profile, API key, login, browser, or live URL:

> **Install first:** from the repository root, run `npm install`. If the demo
> reports missing dependencies, run that command and retry.

```bash
npm install
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
```

Network is disabled by default. The command rejects untracked fixture files,
rejects credential-like fixture content, blocks global `fetch`, and writes all
generated files below `output/demo`. Re-running the command produces the same
reports, HTML, tracker, marker, and manifests. An existing non-empty target is
only cleared when its demo ownership marker is valid; an unmarked target fails
without modification.

Expected output includes:

```text
Japan fixture demo (network: disabled)
[1/4] loaded 3 committed synthetic fixtures
[2/4] processed 3 fixture listings through scan, normalize, evaluate
[3/4] wrote 3 reports + 3 HTML artifacts
[4/4] wrote tracker: output/demo/tracker/applications.md
Demo complete: 3 fixtures, 3 reports, 3 HTML artifacts, 3 tracker entries
```

See [the demo readme](demo/README.md) for the output contract and fixture
inventory.

### Using Codex, Claude Code, or OpenCode

Start the CLI in the repository root. Interactive prompts can use the same
market mode names; exact slash-command availability depends on the CLI:

```bash
codex
claude
opencode
```

Examples:

```text
Run the career-ops Japan auto-pipeline for this pasted job description. Use the Japanese market mode, show unknowns, and stop before any application action.
```

Codex one-shot:

```bash
codex exec "Evaluate this pasted Japan JD with career-ops auto-pipeline: Fixture sanitized software engineering role in Tokyo; salary JPY 6000000-9000000; sponsorship available. Do not submit, log in, bypass CAPTCHA, or send anything."
```

Claude Code one-shot:

```bash
claude -p "Evaluate this pasted Japan JD with career-ops auto-pipeline: Fixture sanitized software engineering role in Tokyo; salary JPY 6000000-9000000; sponsorship available. Do not submit, log in, bypass CAPTCHA, or send anything."
```

OpenCode one-shot:

```bash
opencode run "Evaluate this pasted Japan JD with career-ops auto-pipeline: Fixture sanitized software engineering role in Tokyo; salary JPY 6000000-9000000; sponsorship available. Do not submit, log in, bypass CAPTCHA, or send anything."
```

If a CLI does not provide a `/career-ops` command, say “run the career-ops
Japan `kyujin` or `oubo` mode” in plain language. The agent should show its
source, evidence, uncertainty, and proposed next step before you act.

### Supported Japan sources and fallback input

The Japan vertical includes first-class adapters for:

- TokyoDev: public search/detail pages and normalized job facts.
- GaijinPot Jobs: public job pages, including English/Japanese level and
  overseas-application signals when explicitly present.
- Hello Work: public listing pages, Japanese employment fields, and the
  distinction between disclosed and anonymous employers.

Page shapes change. When a URL is unsupported, blocked, stale, or cannot be
parsed safely, paste the job description instead. A pasted URL or JD is input
for evaluation only; it is not permission to log in or apply:

```text
Evaluate this pasted Japan JD with the career-ops auto-pipeline:

[paste the complete JD here]

Compare it with my configured profile, cite literal JD evidence, keep missing
salary/visa/employer facts as unknown, and stop at a draft recommendation.
```

For a URL fallback, paste the URL and request a safe fetch through the named
adapter. If the source requires an account, CAPTCHA, or an interactive
challenge, copy the visible JD text instead.

### Privacy and application safety

The repository is local-first. The fixture demo uses only committed synthetic
documents and does not read credentials. Normal agent workflows may send the
profile, CV, pasted JD, or generated draft to the AI provider selected in your
CLI; review that provider's retention and training settings.

career-ops does not bypass CAPTCHA, defeat anti-bot controls, guess login
credentials, or use a private account to access a listing. It does not
auto-submit applications, send email, click a final Apply button, or silently
upload a CV. You manually review and submit every application on the source
site. Treat every generated claim as a draft until checked against your own
records and the employer's current page.

### Limitations

- Public source HTML and terms can change; an adapter may return an explicit
  diagnostic rather than a complete job.
- Missing salary, sponsorship, employer identity, Japanese level, or work mode
  stays unknown. Unknown is not a negative judgment.
- Benchmark/demo judgments are deterministic regression signals, not hiring
  accuracy, legal, immigration, tax, or career advice.
- Browser/PDF paths need the optional Chromium installation and may need an
  available browser tool in the active CLI.
- Live scanning is subject to each source's robots rules, rate limits, terms,
  and availability. Use narrow, respectful requests.

### Troubleshooting

`node: command not found` means Node.js is not installed or is not on `PATH`.
Install Node.js 20+ and reopen the terminal.

`fixture is not committed` means the demo manifest or one of its JSON files is
not tracked by Git. Use the committed `evals/japan/demo` set, or stage/commit a
reviewed synthetic custom set before running it.

`attempted network access` means a code path tried to leave fixture mode. Do
not disable the guard; inspect the adapter path and rerun the offline test.

If an adapter reports `blocked`, `stale`, `unsupported`, malformed HTML, or
anonymous employer, preserve the diagnostic and use pasted JD text. Do not
work around a source control with a login or CAPTCHA bypass.

### Tests and legal reference

Run the focused gates from the repository root:

```bash
node --test test/demo-japan.test.mjs
node --test test/e2e/japan-career-ops.e2e.test.mjs
node test-all.mjs
```

The source is distributed under the [MIT License](../LICENSE), with original
career-ops attribution retained. Read [LEGAL_DISCLAIMER.md](../LEGAL_DISCLAIMER.md)
before using live sources.

## 日本語

### 前提条件とインストール

- Node.js 20 以上: `node --version`
- npm: `npm --version`
- エージェント評価を使う場合は Codex、Claude Code、または OpenCode
- ブラウザー/PDF が必要な場合だけ Chromium を追加:
  `npx playwright install chromium`

リポジトリのルートで実行します。

```bash
npm install
node doctor.mjs --json
```

個人用ワークスペースでは、次の無視対象ファイルを作成して自分の情報
だけを記入してください。

```bash
cp config/profile.example.yml config/profile.yml
cp templates/portals.example.yml portals.yml
touch cv.md
```

個人情報は `cv.md`、`config/profile.yml` などの user-layer にだけ保存し、
fixture、テスト、コミット済みレポート、Pull Request には実データを入れない
でください。

### 再現可能なオフラインデモ

デモは、コミット済みの合成求人 3 件だけを使います。プロフィール、API キー、
ログイン、ブラウザー、実在 URL は不要です。

> **先にインストール:** リポジトリのルートで `npm install` を実行してください。
> 依存関係エラーが出た場合は、そのコマンド後に再実行します。

```bash
npm install
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo
```

既定でネットワークは無効です。未追跡 fixture、credential らしい値、global
`fetch` の呼び出しを拒否し、生成物はすべて `output/demo` 以下に置きます。同じ
コマンドを再実行してもレポート、HTML、tracker、marker、manifest は同じになります。
既存の非空ディレクトリは ownership marker がある場合だけ消去し、marker がなければ
変更せず失敗します。

### Codex / Claude Code / OpenCode

リポジトリのルートで CLI を起動します。

```bash
codex
claude
opencode
```

スラッシュコマンドが使えない場合は、通常の文章で「career-ops の日本向け
`kyujin` / `oubo` モードを実行」と依頼できます。Codex の一回実行例:

```bash
codex exec "貼り付けた日本の求人票を career-ops の日本向け auto-pipeline で評価してください。応募、ログイン、CAPTCHA 回避、送信はしないでください。"
```

### 対応ソースと貼り付けフォールバック

第一級アダプターは TokyoDev、GaijinPot Jobs、Hello Work です。公開ページの
構造が変わった、ブロックされた、古い、または安全に解析できない場合は、公開
されている求人票の本文を貼り付けてください。URL や JD の貼り付けは評価の入力
であり、ログインや応募の許可ではありません。

### プライバシーと応募の安全性

fixture デモは合成データのみを読み、資格情報を読みません。通常のエージェント
実行では、設定した AI プロバイダーに CV、プロフィール、JD、下書きが送られる
可能性があるため、各プロバイダーの保持・学習設定を確認してください。

CAPTCHA、bot 対策、ログイン、最終 Apply、メール送信、自動応募、CV の無断アップ
ロードは行いません。生成された内容は必ず自分の経歴と求人元で確認し、最後の応募
操作は本人が行ってください。

### 制限、トラブルシューティング、テスト

公開ページの HTML、利用規約、レート制限は変わります。給与、在留資格・スポンサー、
雇用主、日本語レベル、勤務形態の欠落は unknown のままです。デモと benchmark は
採用精度や法務・在留資格・税務の助言ではありません。

```bash
node --test test/demo-japan.test.mjs
node --test test/e2e/japan-career-ops.e2e.test.mjs
node test-all.mjs
```

`fixture is not committed` は、manifest または JSON が Git に追跡されていない
という意味です。`attempted network access` は fixture モード外の通信を意味する
ため、guard を無効にせず原因を確認してください。詳しいアダプター追加手順は
[ADAPTERS_JAPAN.md](ADAPTERS_JAPAN.md)、法的注意は
[LEGAL_DISCLAIMER.md](../LEGAL_DISCLAIMER.md) を参照してください。

コードは [MIT License](../LICENSE) で配布され、career-ops の原作者表示を保持します。
