#!/usr/bin/env node
// scan-greenhouse.mjs — fetch listings from the Greenhouse Boards public API
// for every company in portals.yml > tracked_companies, apply title/location/JD
// filters, and append survivors to data/pipeline.md.
//
// Public API. No key needed.
// Docs: https://developers.greenhouse.io/job-board.html
//
// Usage:
//   node scripts/scan-greenhouse.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTALS_PATH = path.join(ROOT, "portals.yml");
const PIPELINE_PATH = path.join(ROOT, "data", "pipeline.md");
const REQUEST_DELAY_MS = 250;

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

async function fetchBoard(boardToken) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "career-ops-japan/0.1" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url}${body ? ` — ${body.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function renderPipelineBlock({ candidates, scannedCompanies, errors, startedAt }) {
  const lines = [];
  lines.push("");
  lines.push(`## Scan run: ${startedAt}`);
  lines.push("");
  lines.push(`- **Source:** greenhouse`);
  lines.push(`- **Companies scanned:** ${scannedCompanies.length}`);
  lines.push(`- **Companies erroring:** ${errors.length}`);
  lines.push(`- **Total listings fetched:** ${scannedCompanies.reduce((a, c) => a + c.totalFetched, 0)}`);
  lines.push(`- **Passed filters:** ${candidates.length}`);
  lines.push("");

  if (errors.length) {
    lines.push("### ⚠️ Errors");
    lines.push("");
    for (const e of errors) {
      lines.push(`- **${e.company}** (\`${e.boardToken}\`): ${e.message}`);
    }
    lines.push("");
  }

  lines.push("### Per-company breakdown");
  lines.push("");
  lines.push("| Company | Fetched | After title filter | After location filter | After JD filter |");
  lines.push("|---|---:|---:|---:|---:|");
  for (const c of scannedCompanies) {
    lines.push(`| ${c.name} | ${c.totalFetched} | ${c.afterTitle} | ${c.afterLocation} | ${c.afterJd} |`);
  }
  lines.push("");

  if (candidates.length === 0) {
    lines.push("### Candidates");
    lines.push("");
    lines.push("_No listings passed all filters in this run._");
    lines.push("");
    lines.push("Common reasons:");
    lines.push("- `portals.yml > title_filter.positive` is too narrow — try broader keywords");
    lines.push("- `portals.yml > location_filter` doesn't match the format the company uses (check the per-company breakdown above)");
    lines.push("- Companies have no Japan-based listings open right now");
  } else {
    lines.push(`### Candidates (${candidates.length})`);
    lines.push("");
    for (const j of candidates) {
      lines.push(`#### ${j.title} — ${j.company}`);
      lines.push("");
      lines.push(`- **Location:** ${j.location}`);
      lines.push(`- **Posted / Updated:** ${j.updatedAt ?? "unknown"}`);
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
  console.log(`[scan-greenhouse] started ${startedAt}`);

  const portals = loadYaml(PORTALS_PATH);
  const titleFilter = portals.title_filter ?? {};
  const locationFilter = portals.location_filter ?? [];
  const jdDisqualifiers = portals.jd_disqualifiers ?? [];
  const tracked = portals.tracked_companies ?? [];

  if (tracked.length === 0) {
    throw new Error("No tracked_companies in portals.yml.");
  }

  const candidates = [];
  const scannedCompanies = [];
  const errors = [];

  for (const company of tracked) {
    const stats = {
      name: company.name,
      boardToken: company.board_token,
      totalFetched: 0,
      afterTitle: 0,
      afterLocation: 0,
      afterJd: 0,
    };

    try {
      console.log(`[scan-greenhouse] fetching ${company.name} (${company.board_token})...`);
      const data = await fetchBoard(company.board_token);
      const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
      stats.totalFetched = jobs.length;

      for (const job of jobs) {
        const title = job.title ?? "";
        const location = job?.location?.name ?? "";
        const jdText = stripHtml(job?.content ?? "");

        const t = matchesTitleFilter(title, titleFilter);
        if (!t.ok) continue;
        stats.afterTitle++;

        const l = matchesLocation(location, locationFilter);
        if (!l.ok) continue;
        stats.afterLocation++;

        const d = matchesJdDisqualifiers(jdText, jdDisqualifiers);
        if (!d.ok) continue;
        stats.afterJd++;

        candidates.push({
          title,
          company: company.name,
          location,
          url: job.absolute_url ?? company.careers_url,
          updatedAt: job.updated_at ?? null,
        });
      }
    } catch (err) {
      console.error(`[scan-greenhouse] ${company.name} failed: ${err.message}`);
      errors.push({ company: company.name, boardToken: company.board_token, message: err.message });
    }

    scannedCompanies.push(stats);
    await sleep(REQUEST_DELAY_MS);
  }

  const block = renderPipelineBlock({ candidates, scannedCompanies, errors, startedAt });

  fs.mkdirSync(path.dirname(PIPELINE_PATH), { recursive: true });
  let prefix = "";
  if (!fs.existsSync(PIPELINE_PATH)) {
    prefix = "# Pipeline\n\nScan output is appended below. Most recent at the bottom. Curate by hand — set `Status: APPLIED / REJECTED / SKIPPED` as you triage.\n\n";
  }
  fs.appendFileSync(PIPELINE_PATH, prefix + block + "\n");

  console.log(`[scan-greenhouse] done — ${candidates.length} candidates, ${errors.length} errors`);
  console.log(`[scan-greenhouse] wrote to ${path.relative(ROOT, PIPELINE_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
