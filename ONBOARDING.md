# Welcome to career-ops-japan

> 👋 This is the default message new users see when they first invoke `/career-ops` on a fresh clone.

---

This is a career-ops fork preconfigured for the Japanese job market — English-friendly tech roles, with Japanese-language-required listings auto-filtered out.

## Out of the box, this scans

- **15 global SaaS companies with Tokyo offices** — Greenhouse API ✅
  Figma · Stripe · Cloudflare · GitHub · HubSpot · PagerDuty · Snowflake · Splunk · Dropbox · MongoDB · Datadog · Elastic · Twilio · Asana · Zendesk
- **Japan Dev** ✅ — English-first board, ~60 latest listings via HTML scrape
- **Indeed Japan** ✅ — via JobSpy (LinkedIn / Glassdoor opt-in)
- **English-first Japan boards** *(coming)* — TokyoDev, JobsInJapan, Daijob, GaijinPot, CareerCross
- **Japanese-native boards with English filters** *(coming)* — Green, Doda, Bizreach, Mynavi Tenshoku, Rikunabi NEXT
- **HelloWork** *(coming)* — Japanese government board, scanned with 12 English-keyword searches

See [README.md § Status](README.md#status) for the current build state.

## Before your first scan, customize 4 files

The assistant will walk you through these if you run `/career-ops` on a fresh clone.

### 1. `cv.md` — your CV in markdown

```bash
cp cv.md.example cv.md
```

Open and replace with your real CV. Or paste a LinkedIn profile URL and ask the assistant to extract it for you.

> ⚠️ `cv.md` is git-ignored — your real CV never lands in the public repo.

### 2. `config/profile.yml` — identity and preferences

```bash
cp config/profile.yml.example config/profile.yml
```

Edit:

- `name`, `email`, `location` — basic identity
- `target_roles` — what you want to be hired as
- `comp_range` — target compensation in JPY annual
- `archetypes` — role types with seniority levels you'd accept
- `japanese_level` — your current level (`none`, `n5`, `n4`, `n3`, `n2`, `n1`)

> ⚠️ `config/profile.yml` is git-ignored.

### 3. `portals.yml > title_filter`

This is the **most important step**. Default values are intentionally generic placeholders — they'll match almost anything. Edit:

- `title_filter.positive` — keywords that match YOUR target role titles
  Example: `"Software Engineer"`, `"IT Support"`, `"Workplace Technology"`
- `title_filter.negative` — keywords to exclude
  Example: `"Sales Engineer"`, `"Customer Success"`, `"Account Manager"`

### 4. `portals.yml > tracked_companies` (optional)

The default 15 Greenhouse companies are a starter set. Add or remove based on where you want to work. Each entry needs a `careers_url`. Companies on Greenhouse can use the free API; others fall back to scraping in later phases.

## Notes on Japanese-native boards (coming)

Green, Doda, Mynavi Tenshoku, Bizreach, and Rikunabi NEXT are primarily Japanese-language. Their queries will include English/bilingual filter clauses (`英語`, `外資系`, `バイリンガル`) to surface English-friendly roles. Expect a lower hit rate (~15% English-friendly) but unique coverage — many JP-domestic SMBs and foreign-affiliated firms post here but not on LinkedIn.

**Bizreach is scout-based** (recruiters find you) — maintaining a complete Bizreach profile is as valuable as searching it.

## HelloWork quirk (coming)

HelloWork is the government board — heavily Japanese-required roles. Default config will run 12 Japanese keyword searches (`英語`, `外資`, `バイリンガル`, …) to surface English-friendly listings, but expect a <10% apply hit rate. Unique discovery, low precision.

## Hunting outside Japan or outside tech?

See [FORKING.md](FORKING.md) — swap `portals.yml` and `jd_disqualifiers`, keep the workflow. Worked examples for other markets live under `examples/forks/`.

## Ready?

```bash
/career-ops scan
```

Or run scanners directly:

```bash
npm run scan              # all working scanners in sequence
npm run scan:greenhouse   # just Greenhouse API
npm run scan:japandev     # just Japan Dev
npm run scan:jobspy       # just Indeed Japan via JobSpy
```

Output lands in `data/pipeline.md`. Review candidates and run `/career-ops oferta <jd>` to evaluate any specific one.

> **Stuck?** Open an issue: <https://github.com/gaijindev/career-ops-japan/issues>
