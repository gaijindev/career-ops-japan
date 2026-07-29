# career-ops-japan

`career-ops-japan` は、日本向け IT 求人を評価し、確認用の成果物を作る
ローカル CLI ワークフローです。[santifer/career-ops](https://github.com/santifer/career-ops)
を基にしています。

現在の日本向けアダプター:

- [TokyoDev](https://www.tokyodev.com/)
- [GaijinPot Jobs](https://jobs.gaijinpot.com/)
- [Hello Work](https://www.hellowork.mhlw.go.jp/)
- アダプターが使えない場合の求人 URL / 求人本文の貼り付け

公開するワークフローはローカル実行・CLI 専用です。npm パッケージ、ホスト型 API、
Web UI はこのリリースの対象外です。

## クイックスタート

必要なもの: Node.js 22.5 以上、Git。AI による評価を使う場合は対応する AI
コーディング CLI も必要です。

```bash
git clone https://github.com/gaijindev/career-ops-japan.git
cd career-ops-japan
npm install

# ネットワークを使わないデモ
node scripts/demo-japan.mjs --fixture-set evals/japan/demo --output-dir output/demo --no-network

# 日本向けチェック
node --test test/demo-japan.test.mjs
node --test test/e2e/japan-career-ops.e2e.test.mjs
```

個人用には、テンプレートをコピーして自分のファイルを作成します。

```bash
cp config/profile.example.yml config/profile.yml
cp templates/portals.example.yml portals.yml
touch cv.md
```

リポジトリ内で選択した CLI を起動し、貼り付けた求人本文の評価、または日本向け
スキャンを依頼します。詳細は [docs/SETUP_JAPAN.md](docs/SETUP_JAPAN.md) を参照してください。

Codex を使う場合は、このディレクトリで `codex` を起動し、自然言語で依頼してください。
スラッシュコマンドは保証されません。詳細は [CODEX.md](CODEX.md) を参照してください。

## 作成するもの

- A–F 評価と、別枠の G（求人正当性）チェック
- 根拠を含む Markdown レポートと求人ごとの CV PDF
- ローカル tracker と HTML 確認用 artifact
- 給与、スポンサー、雇用主、日本語レベル、勤務形態が記載されていない場合の unknown

リポジトリのスクリプトと既定のワークフローは、ログイン、CAPTCHA 対応、最終 Apply
クリック、メール送信、CV アップロード、応募送信の前で停止します。確認と応募は本人が
行います。CLI やモデルの指示・ツールを変更した場合は、挙動を確認してください。

## デモ画像

以下は日本の IT 求人を使った、合成 fixture の出力です。

![Japan IT scan](docs/demo/screenshots/japan-it-scan.png)

![Bilingual evaluation](docs/demo/screenshots/bilingual-evaluation.png)

![Generated artifacts](docs/demo/screenshots/generated-artifacts.png)

![Local tracker](docs/demo/screenshots/local-tracker.png)

fixture の一覧とデモの契約は [docs/demo/README.md](docs/demo/README.md) にあります。

## ドキュメント

- [日本語・英語セットアップガイド](docs/SETUP_JAPAN.md)
- [アダプターガイド](docs/ADAPTERS_JAPAN.md)
- [データ契約とプライバシー境界](DATA_CONTRACT.md)
- [法的免責と利用条件](LEGAL_DISCLAIMER.md)
- [コントリビューションガイド](CONTRIBUTING.md)
- [リリースチェックリスト](docs/release-checklist.md)

## 範囲と制限

このリリースはコミット済み fixture でアダプターとワークフローを検証しています。
実サイトの smoke test は実行していません。公開ページの構造、規約、レート制限、利用可能性は
変わる可能性があります。各サイトの規約に従い、許可された公開アクセスだけを使ってください。

上流由来の単独モデル evaluator や実験的 Web UI はソースツリーに残っていますが、この
日本向けリリースのドキュメントとテストの対象外です。

## ライセンス

MIT。 [LICENSE](LICENSE) と [TRADEMARK.md](TRADEMARK.md) を参照してください。
