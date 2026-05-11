#!/usr/bin/env python3
"""
scan-jobspy.py — scan LinkedIn / Indeed / Glassdoor / Google Jobs via JobSpy,
apply the portals.yml filter chain, append survivors to data/pipeline.md.

Mirrors the schema produced by scripts/scan-greenhouse.mjs so downstream
modes (oferta, batch, tracker) work uniformly across sources.

Usage:
    .venv/bin/python scripts/scan-jobspy.py

Requirements: see requirements.txt (python-jobspy, PyYAML).
"""

from __future__ import annotations

import datetime as dt
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

import yaml

try:
    from jobspy import scrape_jobs
except ImportError:
    sys.stderr.write(
        "python-jobspy is not installed. Activate the venv first:\n"
        "  .venv/bin/python scripts/scan-jobspy.py\n"
        "Or install: pip install -r requirements.txt\n"
    )
    raise

ROOT = Path(__file__).resolve().parent.parent
PORTALS_PATH = ROOT / "portals.yml"
PIPELINE_PATH = ROOT / "data" / "pipeline.md"

HTML_TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")


def strip_html(text: str | None) -> str:
    if not text:
        return ""
    cleaned = HTML_TAG_RE.sub(" ", str(text))
    cleaned = (
        cleaned.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
    )
    return WHITESPACE_RE.sub(" ", cleaned).strip()


def load_portals() -> dict:
    with PORTALS_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def find_jobspy_source(portals: dict) -> dict | None:
    for src in portals.get("sources") or []:
        if src.get("id") == "jobspy":
            return src
    return None


def contains_any(haystack: str, needles: list[str]) -> str | None:
    if not haystack:
        return None
    low = haystack.lower()
    for n in needles:
        if str(n).lower() in low:
            return n
    return None


def matches_title(title: str, title_filter: dict) -> tuple[bool, str]:
    pos = [s.lower() for s in (title_filter.get("positive") or [])]
    neg = [s.lower() for s in (title_filter.get("negative") or [])]
    low = title.lower()
    if pos and not any(p in low for p in pos):
        return False, "title not in positive list"
    for n in neg:
        if n in low:
            return False, f'title matched negative term "{n}"'
    return True, ""


def matches_location(location: str, loc_filter: list[str]) -> tuple[bool, str]:
    if not loc_filter:
        return True, ""
    hit = contains_any(location, loc_filter)
    if not hit:
        return False, f'location "{location}" not in filter'
    return True, ""


def matches_jd(jd_text: str, disqualifiers: list[str]) -> tuple[bool, str]:
    if not disqualifiers:
        return True, ""
    hit = contains_any(jd_text, disqualifiers)
    if hit:
        return False, f'JD contains disqualifier "{hit}"'
    return True, ""


def run_one_query(
    query: dict, sites: list[str], country_indeed: str, results_wanted: int, hours_old: int
) -> Any:
    search_term = query.get("search_term", "")
    location = query.get("location", "")
    kwargs: dict[str, Any] = {
        "site_name": sites,
        "search_term": search_term,
        "location": location,
        "results_wanted": results_wanted,
        "hours_old": hours_old,
        "country_indeed": country_indeed,
    }
    if "google" in sites:
        kwargs["google_search_term"] = f"{search_term} jobs near {location}"
    return scrape_jobs(**kwargs)


def render_pipeline_block(candidates, breakdown, errors, started_at, sites, queries):
    lines = []
    lines.append("")
    lines.append(f"## Scan run: {started_at} (jobspy)")
    lines.append("")
    lines.append("- **Source:** jobspy")
    lines.append(f"- **Sites enabled:** {', '.join(sites)}")
    lines.append(f"- **Queries:** {len(queries)}")
    lines.append(f"- **Queries erroring:** {len(errors)}")
    total_fetched = sum(b["fetched"] for b in breakdown)
    lines.append(f"- **Total listings fetched:** {total_fetched}")
    lines.append(f"- **Passed filters:** {len(candidates)}")
    lines.append("")

    if errors:
        lines.append("### ⚠️ Errors")
        lines.append("")
        for e in errors:
            lines.append(f"- Query `{e['query']}` (site `{e['site']}`): {e['message']}")
        lines.append("")

    lines.append("### Per-query breakdown")
    lines.append("")
    lines.append("| Query | Location | Fetched | After title | After location | After JD |")
    lines.append("|---|---|---:|---:|---:|---:|")
    for b in breakdown:
        lines.append(
            f"| {b['query']} | {b['location']} | {b['fetched']} | "
            f"{b['after_title']} | {b['after_location']} | {b['after_jd']} |"
        )
    lines.append("")

    if not candidates:
        lines.append("### Candidates")
        lines.append("")
        lines.append("_No listings passed all filters in this run._")
        lines.append("")
        lines.append("Common reasons:")
        lines.append(
            "- `portals.yml > title_filter.positive` is too narrow — try broader keywords"
        )
        lines.append(
            "- All fetched listings landed on the JD-disqualifier list (Japanese-language requirements)"
        )
        lines.append("- The chosen sites returned 0 — Google Jobs is currently blocked")
    else:
        lines.append(f"### Candidates ({len(candidates)})")
        lines.append("")
        for j in candidates:
            lines.append(f"#### {j['title']} — {j['company']}")
            lines.append("")
            lines.append(f"- **Site:** {j['site']}")
            lines.append(f"- **Location:** {j['location']}")
            lines.append(f"- **Posted:** {j['date_posted'] or 'unknown'}")
            lines.append(f"- **URL:** {j['url']}")
            lines.append(f"- **Status:** NEW")
            lines.append(f"- **Notes:** _(add your review here)_")
            lines.append("")

    lines.append("---")
    return "\n".join(lines)


def main() -> int:
    started_at = dt.datetime.now(dt.timezone.utc).isoformat()
    print(f"[scan-jobspy] started {started_at}", flush=True)

    portals = load_portals()
    title_filter = portals.get("title_filter") or {}
    location_filter = portals.get("location_filter") or []
    jd_disqualifiers = portals.get("jd_disqualifiers") or []

    jobspy_src = find_jobspy_source(portals)
    if not jobspy_src:
        print("[scan-jobspy] no jobspy source defined in portals.yml; exiting.")
        return 0
    if jobspy_src.get("status") != "working":
        print("[scan-jobspy] jobspy source status is not 'working' in portals.yml; exiting.")
        return 0

    cfg = jobspy_src.get("config") or {}
    sites = cfg.get("sites") or ["indeed"]
    country_indeed = cfg.get("country_indeed", "japan")
    results_wanted = int(cfg.get("results_wanted_per_query", 30))
    hours_old = int(cfg.get("hours_old", 168))
    queries = cfg.get("queries") or []

    if not queries:
        print("[scan-jobspy] no queries configured under jobspy.config.queries; exiting.")
        return 0

    candidates: list[dict] = []
    breakdown: list[dict] = []
    errors: list[dict] = []
    seen_urls: set[str] = set()

    for query in queries:
        q_label = query.get("search_term", "")
        q_loc = query.get("location", "")
        stats = {
            "query": q_label,
            "location": q_loc,
            "fetched": 0,
            "after_title": 0,
            "after_location": 0,
            "after_jd": 0,
        }
        try:
            print(f'[scan-jobspy] querying "{q_label}" in "{q_loc}"...', flush=True)
            df = run_one_query(query, sites, country_indeed, results_wanted, hours_old)
            stats["fetched"] = len(df) if df is not None else 0

            if df is not None and len(df):
                for _, row in df.iterrows():
                    title = str(row.get("title") or "")
                    company = str(row.get("company") or "")
                    location = str(row.get("location") or "")
                    job_url = str(row.get("job_url") or row.get("job_url_direct") or "")
                    date_posted = row.get("date_posted")
                    site = str(row.get("site") or "")
                    description = strip_html(str(row.get("description") or ""))

                    if not job_url or job_url in seen_urls:
                        continue

                    t_ok, _ = matches_title(title, title_filter)
                    if not t_ok:
                        continue
                    stats["after_title"] += 1

                    l_ok, _ = matches_location(location, location_filter)
                    if not l_ok:
                        continue
                    stats["after_location"] += 1

                    d_ok, _ = matches_jd(description, jd_disqualifiers)
                    if not d_ok:
                        continue
                    stats["after_jd"] += 1

                    seen_urls.add(job_url)
                    candidates.append(
                        {
                            "title": title,
                            "company": company,
                            "location": location,
                            "url": job_url,
                            "date_posted": str(date_posted) if date_posted else None,
                            "site": site,
                        }
                    )
        except Exception as exc:
            msg = str(exc).splitlines()[0][:200]
            print(f'[scan-jobspy] query "{q_label}" failed: {msg}', file=sys.stderr)
            errors.append({"query": q_label, "site": ",".join(sites), "message": msg})

        breakdown.append(stats)
        time.sleep(1.5)  # gentle pacing between queries

    block = render_pipeline_block(
        candidates, breakdown, errors, started_at, sites, queries
    )

    PIPELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    prefix = ""
    if not PIPELINE_PATH.exists():
        prefix = (
            "# Pipeline\n\n"
            "Scan output is appended below. Most recent at the bottom. "
            "Curate by hand — set `Status: APPLIED / REJECTED / SKIPPED` as you triage.\n\n"
        )
    with PIPELINE_PATH.open("a", encoding="utf-8") as f:
        f.write(prefix + block + "\n")

    print(
        f"[scan-jobspy] done — {len(candidates)} candidates, {len(errors)} errors",
        flush=True,
    )
    print(
        f"[scan-jobspy] wrote to {PIPELINE_PATH.relative_to(ROOT)}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
