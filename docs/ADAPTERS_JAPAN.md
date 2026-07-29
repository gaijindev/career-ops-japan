# Japan adapter guide / 日本向けアダプターガイド

## English

Japan adapters are deliberately small, source-specific translators. They
must turn public listing input into the shared Japan job schema without
inventing facts. The current first-class sources are TokyoDev, GaijinPot Jobs,
and Hello Work.

### Contract and safety rules

Every adapter should expose the same public shape as the existing Japan
providers: `id`, `detect`, `fetch` or search behavior, `parse`, and `normalize`
where the source needs those stages. Use the shared helpers in
`providers/_japan-job-schema.mjs`, `providers/_japan-adapter-contract.mjs`,
and `providers/_trust-validator.mjs`.

Required behavior:

1. Accept only the source's public HTTPS host and the documented URL shape.
2. Inject `fetchText` or another transport dependency so tests never need live
   HTTP.
3. Preserve literal source evidence and leave absent salary, employer,
   sponsorship, Japanese-level, and work-mode fields undefined/unknown.
4. Normalize through the shared schema and reject malformed or incomplete
   records safely.
5. Treat stale, blocked, anonymous, and unsupported pages as diagnostics; do
   not silently turn them into valid jobs.
6. Never require credentials, scrape private pages, bypass CAPTCHA, or submit
   an application.

### Contribution workflow

1. Read the existing provider and schema tests before editing. For a new source,
   start with a failing provider test at `tests/providers/<source>.test.mjs`.
2. Add a narrowly scoped `providers/<source>.mjs` module. Keep parsing and
   normalization deterministic and avoid new dependencies.
3. Add sanitized HTML/JSON under `tests/fixtures/<source>/`. Use reserved
   names, `example.invalid` values where URLs are needed, and no real candidate
   information or credentials.
4. Test detection, HTTPS/host hardening, parser fields, unknown-field behavior,
   normalization, and the shared adapter contract.
5. Add a Japan benchmark case only when it represents a distinct regression.
   Update the matching label with literal evidence; never label from metadata
   that the source document does not contain.
6. Update the supported-source documentation and the bilingual setup guide.
7. Run the focused adapter tests, Japan E2E, offline demo, and full suite:

```bash
node --test tests/providers/tokyodev.test.mjs
node --test tests/providers/gaijinpot.test.mjs
node --test tests/providers/hellowork.test.mjs
node --test tests/providers/japan-adapter-contract.test.mjs
node --test test/e2e/japan-career-ops.e2e.test.mjs
node --test test/demo-japan.test.mjs
node test-all.mjs
```

### Review checklist

- The adapter never calls global `fetch` in a fixture test.
- Redirects, schemes, hosts, detail links, and pagination are bounded.
- A missing value stays missing; no salary, sponsor, employer, or language fact
  is guessed from a title or board name.
- Evidence quotes exist literally in the sanitized source fixture.
- Unsupported, stale, blocked, malformed, duplicate, and anonymous cases have
  stable diagnostics where relevant.
- Tests and docs contain no email addresses, phone numbers, tokens, cookies,
  session data, personal CVs, or private URLs.
- The change respects the [MIT License](../LICENSE), keeps career-ops
  attribution, and does not add auto-apply behavior.

### Scope boundaries

An adapter is not an application bot. It may read a public listing and return a
structured draft for review. It must stop before login, CAPTCHA, a final Apply
click, upload, email send, or any other external side effect. Changes to
benchmark data, scan/evaluation/privacy code, or E2E files should be justified
separately and kept out of a documentation/demo-only change.

## 日本語

日本向けアダプターは、公開求人ページを共通の Japan job schema に変換する、
小さなソース固有の翻訳層です。事実を推測して補完してはいけません。現在の第一級
ソースは TokyoDev、GaijinPot Jobs、Hello Work です。

### 契約と安全ルール

`id`、`detect`、必要に応じて `fetch`/search、`parse`、`normalize` を既存アダプター
と同じ形で公開し、`providers/_japan-job-schema.mjs`、
`providers/_japan-adapter-contract.mjs`、`providers/_trust-validator.mjs` を使います。

- 公開 HTTPS ホストと URL 形式だけを受け付ける。
- `fetchText` などを注入し、テストでは実 HTTP を使わない。
- 給与、雇用主、スポンサー、日本語レベル、勤務形態がない場合は unknown のままにする。
- 共通 schema で normalize し、不完全なレコードは安全に拒否する。
- stale / blocked / anonymous / unsupported は診断として扱い、有効な求人に変換しない。
- 資格情報、非公開ページ、CAPTCHA 回避、自動応募を使わない。

### コントリビューション手順

1. 既存 provider と schema のテストを読み、`tests/providers/<source>.test.mjs` に
   失敗するテストを先に書く。
2. `providers/<source>.mjs` を小さく実装し、新しい依存関係を増やさない。
3. `tests/fixtures/<source>/` に合成 HTML/JSON を追加する。実在の候補者情報、資格情報、
   実 URL は入れない。
4. URL の検出、HTTPS/host 検証、parser、unknown、normalize、共通 contract をテストする。
5. 追加ベンチマークが本当に別の回帰を表す場合だけ、literal evidence と label を追加する。
6. 対応ソース一覧とこの日英ガイドを更新する。
7. 次を実行する。

```bash
node --test tests/providers/tokyodev.test.mjs
node --test tests/providers/gaijinpot.test.mjs
node --test tests/providers/hellowork.test.mjs
node --test tests/providers/japan-adapter-contract.test.mjs
node --test test/e2e/japan-career-ops.e2e.test.mjs
node --test test/demo-japan.test.mjs
node test-all.mjs
```

アダプターはログイン、CAPTCHA、最終 Apply、アップロード、メール送信などの外部操作を
行いません。

### MIT と attribution

コードは [MIT License](../LICENSE) の下で利用でき、元の career-ops attribution を
保持します。法的な利用条件は [LEGAL_DISCLAIMER.md](../LEGAL_DISCLAIMER.md) を確認して
ください。
