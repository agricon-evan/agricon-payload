#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Translate AGRICON content from English into ru/fr/es/sw/ar using the free
MyMemory API, and write results into Payload's *_locales SQLite tables.

Usage:
    PYTHONIOENCODING=utf-8 python scripts/translate-content.py

Notes:
- Idempotent: skips locale rows that already exist for a (_parent_id, _locale).
- Field merging: short fields of one record are joined with "|" and translated
  in a single request to stay within free API quotas.
- HTML fields (overview_html, content, summary...) are translated with tags
  protected via placeholder tokens.
"""
import json
import re
import sqlite3
import sys
import time
import html as html_mod

DB = "agricon-dev.db"
TARGETS = ["ru", "fr", "es", "sw", "ar"]
API = "https://api.mymemory.translated.net/get"

# (locale_table, parent_table, [fields]) — fields in translation priority order
JOBS = [
    ("categories_locales", "categories", ["name", "description"]),
    ("subcategories_locales", "subcategories", ["name", "subtitle", "description"]),
    ("products_locales", "products", ["name", "seo_title", "seo_description", "description", "overview_html"]),
    ("products_features_locales", "products_features", ["feature"]),
    ("solutions_locales", "solutions", ["name", "description"]),
    ("case_studies_locales", "case_studies", ["title", "subtitle", "location", "farm_name", "farm_scale", "key_result", "equipment", "application", "challenge", "summary", "content"]),
]

import urllib.request
import urllib.parse
import argparse

LIMIT = None

def fetch(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def api_translate(text, target):
    """Translate text via MyMemory. Returns translated string or None."""
    params = urllib.parse.urlencode({"q": text, "langpair": f"en|{target}"})
    url = f"{API}?{params}"
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 agricon-cms/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            if data.get("responseStatus") == 200 and data.get("responseData", {}).get("translatedText"):
                return data["responseData"]["translatedText"]
            if data.get("quotaFinished"):
                print("!! QUOTA EXHAUSTED", file=sys.stderr)
                return None
        except Exception as e:
            print(f"  retry {attempt}: {e}", file=sys.stderr)
        time.sleep(2 + attempt)
    return None

PLACEHOLDER = re.compile(r"ZZTOK(\d+)ZZ")

TOKEN = "ZZTOK"

def protect_tags(html_text):
    """Replace <tag ...> with ZZTOK{n}ZZ placeholders; return (masked, tags)."""
    tags = []
    def rep(m):
        tags.append(m.group(0))
        return f"{TOKEN}{len(tags)-1}{TOKEN}"
    masked = re.sub(r"<[^>]+>", rep, html_text)
    return masked, tags

def restore_tags(masked, tags):
    return PLACEHOLDER.sub(lambda m: tags[int(m.group(1))], masked)

def translate_fields(fields, target):
    """Translate a list of strings (may be empty). Returns list aligned to input.
    Short fields are merged with '|' for a single API call; long fields go alone."""
    out = []
    for text in fields:
        if text is None or not str(text).strip():
            out.append(None)
            continue
        out.append(text)
    return out

def translate_merged(fields, target, long_threshold=250):
    """Translate a list of strings. Long/HTML fields translated separately with
    tag protection; short fields merged with '|' to save quota."""
    out = [None] * len(fields)
    # Long or HTML fields -> translate alone with tag protection
    for i, f in enumerate(fields):
        if f is None or not str(f).strip():
            continue
        s = str(f)
        if len(s) > long_threshold or ('<' in s and '>' in s):
            masked, tags = protect_tags(s)
            r = api_translate(masked, target)
            if r:
                out[i] = restore_tags(r, tags)
            time.sleep(0.4)
    # Short plain fields -> merge with '|'
    short = [i for i, f in enumerate(fields) if f is not None and str(f).strip() and out[i] is None]
    if short:
        merged = " | ".join(str(fields[i]) for i in short)
        result = api_translate(merged, target)
        if result:
            parts = [p.strip() for p in result.split("|")]
            if len(parts) >= len(short):
                for j, i in enumerate(short):
                    out[i] = parts[j]
            else:
                for i in short:
                    r = api_translate(str(fields[i]), target)
                    if r:
                        out[i] = r
                    time.sleep(0.4)
    return out

def main():
    global LIMIT
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="max parent records per job")
    parser.add_argument("--langs", default="ru,fr,es,sw,ar", help="comma-separated target languages")
    args = parser.parse_args()
    LIMIT = args.limit
    targets = [l.strip() for l in args.langs.split(",") if l.strip()]
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    total_calls = 0
    skipped = 0

    for table, parent, fields in JOBS:
        rows = conn.execute(f"SELECT * FROM {table} WHERE _locale='en'").fetchall()
        if LIMIT:
            rows = rows[:LIMIT]
        for row in rows:
            pid = row["_parent_id"]
            for lang in targets:
                exists = conn.execute(
                    f"SELECT COUNT(*) c FROM {table} WHERE _parent_id=? AND _locale=?",
                    (pid, lang),
                ).fetchone()["c"]
                if exists:
                    skipped += 1
                    continue
                texts = [row[f] for f in fields]
                translated = translate_merged(texts, lang)
                # 翻译失败/为空时回退英文原文，避免 NOT NULL 约束
                translated = [
                    t if t else (str(texts[i]) if texts[i] and str(texts[i]).strip() else None)
                    for i, t in enumerate(translated)
                ]
                total_calls += 1
                if any(translated):
                    cols = fields + ["_locale", "_parent_id"]
                    vals = translated + [lang, pid]
                    conn.execute(
                        f"INSERT INTO {table} ({', '.join(fields)}, _locale, _parent_id) VALUES ({', '.join(['?']*len(fields))}, ?, ?)",
                        vals,
                    )
                    conn.commit()
                    print(f"[{table}] {pid} {lang} -> {translated[0][:40] if translated[0] else ''}")
                time.sleep(0.35)

    conn.close()
    print(f"\nDone. API calls: {total_calls}, skipped existing: {skipped}")

if __name__ == "__main__":
    main()
