#!/usr/bin/env node
// scan-japandev.mjs — scrape japan-dev.com's English-friendly Japan tech-job
// listings, apply the portals.yml filter chain, append survivors to
// data/pipeline.md.
//
// Two-pass approach:
//   1. Fetch /jobs index, parse cheap fields (title, company, URL, location,
//      tags) from each .job-item block.
//   2. For listings that pass the cheap filters, fetch the full JD page and
//      apply the jd_disqualifiers filter against the rendered HTML.
//
// japan-dev.com is explicitly targeted at "IT Jobs in Japan for English
// Speakers" — robots.txt is permissive (verified 2026-05-11). Be polite:
// concurrency capped to 3, 250ms inter-request delay.
//
// Usage:
//   node scripts/scan-japandev.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import * as cheerio from "cheerio";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTALS_PATH = path.join(ROOT, "portals.yml");
const PIPELINE_PATH = path.join(ROOT, "data", "pipeline.md");
const INDEX_URL = "https://japan-dev.com/jobs";
const ORIGIN = "https://japan-dev.com";
const REQUEST_DELAY_MS = 250;
const JD_FETCH_CONCURRENCY = 3;
const MAX_INDEX_PAGES = 10;
const UA = "Mozilla/5.0 (compatible; career-ops-japan/0.1; +https://github.com/gaijindev/career-ops-japan)";

function loadYaml(p) {
  return yaml.load(fs.readFileSync(p, "utf8"));
}

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(haystack, needles) {
  if (!haystack) return null;
  const h = haystack.toLowerCase();
  return needles.find((n) => h.includes(String(n).toLowerCase())) ?? null;
}

function matchesTitleFilter(title, titleFilter) {
  const t = title.toLowerCase();
  const pos = (titleFilter?.positive ?? []).map((s) => s.toLowerCase());
  const neg = (titleFilter?.negative ?? []).map((s) => s.toLowerCase());
  if (pos.length && !pos.some((p) => t.includes(p))) return { ok: false, reason: "title not in positive list" };
  const hitNeg = neg.find((n) => t.includes(n));
  if (hitNeg) return { ok: false, reason: `title matched negative term "${hitNeg}"` };
  return { ok: true };
}

function matchesLocation(location, locationFilter) {
  if (!locationFilter || locationFilter.length === 0) return { ok: true };
  const hit = containsAny(location, locationFilter);
  if (!hit) return { ok: false, reason: `location "${location}" not in filter` };
  return { ok: true };
}

function matchesJdDisqualifiers(jdText, disqualifiers) {
  if (!disqualifiers || disqualifiers.length === 0) return { ok: true };
  const hit = containsAny(jdText, disqualifiers);
  if (hit) return { ok: false, reason: `JD contains disqualifier "${hit}"` };
  return { ok: true };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,*/*" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseIndex(html) {
  const $ = cheerio.load(html);
  const jobs = [];
  $(".job-item").each((_, el) => {
    const $el = $(el);
    const titleAnchor = $el.find("a.job-item__title").first();
    const title = titleAnchor.text().trim();
    if (!title) return;
    const href = titleAnchor.attr("href") ?? "";
    const url = href.startsWith("http") ? href : ORIGIN + href;

    // Company: derive from slug `/jobs/<company>/...`
    const slugMatch = href.match(/^\/jobs\/([^/]+)\//);
    const companySlug = slugMatch ? slugMatch[1] : "";
    const company =
      $el.find(".company-logo__inner").attr("alt")?.trim() ||
      companySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    // Location tag (e.g. "Tokyo / Remote")
    const location =
      $el
        .find(".job__tag-desc")
        .map((_, t) => $(t).text().trim())
        .get()
        .filter(Boolean)
        .join(" / ") || "Japan";

    // Top tags (e.g. "🇯🇵 Residents Only", "Full Remote")
    const tags = $el
      .find(".job-top-tag-list__job-top-tag")
      .map((_, t) => $(t).text().trim())
      .get();

    jobs.push({ title, company, url, location, tags });
  });
  return jobs;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJdBody(html) {
  // Japan Dev wraps the JD in .job-detail-main-content. Falls back to
  // .job-detail (broader, includes header) and then the full page if
  // neither selector matches.
  const $ = cheerio.load(html);
  const body =
    $(".job-detail-main-content").html() ||
    $(".job-detail").html() ||
    $("main").html() ||
    html;
  return stripHtml(body);
}

async function fetchJdInBatches(items, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const slice = items.slice(i, i + concurrency);
    const fetched = await Promise.all(
      slice.map(async (item) => {
        try {
          const html = await fetchText(item.url);
          return { ...item, jdText: extractJdBody(html), error: null };
        } catch (err) {
          return { ...item, jdText: "", error: err.message };
        }
      }),
    );
    results.push(...fetched);
    if (i + concurrency < items.length) await sleep(REQUEST_DELAY_MS);
  }
  return results;
}

function renderPipelineBlock({ candidates, breakdown, errors, startedAt }) {
  const lines = [];
  lines.push("");
  lines.push(`## Scan run: ${startedAt} (japandev)`);
  lines.push("");
  lines.push(`- **Source:** japandev`);
  lines.push(`- **Index URL:** ${INDEX_URL}`);
  lines.push(`- **Total listings fetched:** ${breakdown.totalFetched}`);
  lines.push(`- **After title filter:** ${breakdown.afterTitle}`);
  lines.push(`- **After location filter:** ${breakdown.afterLocation}`);
  lines.push(`- **JD pages fetched:** ${breakdown.jdFetched}`);
  lines.push(`- **JD fetch errors:** ${breakdown.jdErrors}`);
  lines.push(`- **Passed filters:** ${candidates.length}`);
  lines.push("");

  if (errors.length) {
    lines.push("### ⚠️ JD-fetch errors");
    lines.push("");
    for (const e of errors) {
      lines.push(`- **${e.title}** — ${e.company}: ${e.error}`);
      lines.push(`  → ${e.url}`);
    }
    lines.push("");
  }

  if (candidates.length === 0) {
    lines.push("### Candidates");
    lines.push("");
    lines.push("_No listings passed all filters in this run._");
    lines.push("");
    lines.push("Common reasons:");
    lines.push("- `portals.yml > title_filter.positive` is too narrow");
    lines.push("- Japan Dev has no current open listings matching your title");
    lines.push("- All listings hit a JD disqualifier (Japanese-language requirement)");
  } else {
    lines.push(`### Candidates (${candidates.length})`);
    lines.push("");
    for (const j of candidates) {
      lines.push(`#### ${j.title} — ${j.company}`);
      lines.push("");
      lines.push(`- **Site:** japandev`);
      lines.push(`- **Location:** ${j.location}`);
      lines.push(`- **Tags:** ${j.tags.length ? j.tags.join(" · ") : "(none)"}`);
      lines.push(`- **URL:** ${j.url}`);
      lines.push(`- **Status:** NEW`);
      lines.push(`- **Notes:** _(add your review here)_`);
      lines.push("");
    }
  }

  lines.push("---");
  return lines.join("\n");
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[scan-japandev] started ${startedAt}`);

  const portals = loadYaml(PORTALS_PATH);
  const titleFilter = portals.title_filter ?? {};
  const locationFilter = portals.location_filter ?? [];
  const jdDisqualifiers = portals.jd_disqualifiers ?? [];

  // Allow opt-out via portals.yml > sources[id=japandev].status
  const src = (portals.sources ?? []).find((s) => s.id === "japandev");
  if (src && src.status !== "working") {
    console.log("[scan-japandev] portals.yml has japandev status != working; exiting.");
    return;
  }

  console.log(`[scan-japandev] fetching index pages...`);
  const allJobs = [];
  const seenUrls = new Set();
  for (let page = 1; page <= MAX_INDEX_PAGES; page++) {
    const url = page === 1 ? INDEX_URL : `${INDEX_URL}?page=${page}`;
    const html = await fetchText(url);
    const pageJobs = parseIndex(html);
    const fresh = pageJobs.filter((j) => !seenUrls.has(j.url));
    for (const j of fresh) seenUrls.add(j.url);
    console.log(`[scan-japandev]   page ${page}: ${pageJobs.length} parsed, ${fresh.length} new`);
    if (fresh.length === 0) break;
    allJobs.push(...fresh);
    if (page < MAX_INDEX_PAGES) await sleep(REQUEST_DELAY_MS);
  }
  console.log(`[scan-japandev] parsed ${allJobs.length} unique listings`);

  const afterTitle = allJobs.filter((j) => matchesTitleFilter(j.title, titleFilter).ok);
  console.log(`[scan-japandev] after title filter: ${afterTitle.length}`);

  const afterLocation = afterTitle.filter((j) => matchesLocation(j.location, locationFilter).ok);
  console.log(`[scan-japandev] after location filter: ${afterLocation.length}`);

  console.log(`[scan-japandev] fetching ${afterLocation.length} JD pages...`);
  const withJd = await fetchJdInBatches(afterLocation, JD_FETCH_CONCURRENCY);
  const jdErrors = withJd.filter((j) => j.error);
  const jdSuccess = withJd.filter((j) => !j.error);

  const candidates = jdSuccess.filter((j) => matchesJdDisqualifiers(j.jdText, jdDisqualifiers).ok);

  const breakdown = {
    totalFetched: allJobs.length,
    afterTitle: afterTitle.length,
    afterLocation: afterLocation.length,
    jdFetched: jdSuccess.length,
    jdErrors: jdErrors.length,
  };

  const block = renderPipelineBlock({ candidates, breakdown, errors: jdErrors, startedAt });

  fs.mkdirSync(path.dirname(PIPELINE_PATH), { recursive: true });
  let prefix = "";
  if (!fs.existsSync(PIPELINE_PATH)) {
    prefix = "# Pipeline\n\nScan output is appended below. Most recent at the bottom. Curate by hand — set `Status: APPLIED / REJECTED / SKIPPED` as you triage.\n\n";
  }
  fs.appendFileSync(PIPELINE_PATH, prefix + block + "\n");

  console.log(`[scan-japandev] done — ${candidates.length} candidates`);
  console.log(`[scan-japandev] wrote to ${path.relative(ROOT, PIPELINE_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
