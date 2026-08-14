#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Translate blog posts and FAQs into ru/fr/es/sw/ar using the free MyMemory API.
Handles lexical richText (blog content / FAQ answer) by recursively translating
only text nodes, preserving the JSON structure.

Usage:
    PYTHONIOENCODING=utf-8 python scripts/translate-blog-faq.py [--langs ru,fr,es,sw,ar] [--limit N]

Idempotent: skips locale rows that already exist.
"""
import json
import re
import sqlite3
import sys
import time
import io
import urllib.request
import urllib.parse
import argparse

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB = "agricon-dev.db"
API = "https://api.mymemory.translated.net/get"
JOBS = [
    ("blog_posts_locales", ["title", "excerpt", "content"]),
    ("faqs_locales", ["question", "answer"]),
]

def api_translate(text, target):
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
            time.sleep(2)
    return None

def translate_plain(text, target):
    if not text or not str(text).strip():
        return None
    s = str(text)
    if len(s) > 500:
        # long text: translate sentence chunks and join
        parts = re.split(r'(?<=[.!?])\s+', s)
        out = []
        for p in parts:
            r = api_translate(p, target)
            if r:
                out.append(r)
            else:
                out.append(p)
            time.sleep(0.3)
        return " ".join(out)
    r = api_translate(s, target)
    time.sleep(0.3)
    return r

def translate_lexical(node, target):
    """Recursively translate text nodes in lexical JSON."""
    if isinstance(node, dict):
        if node.get("type") == "text" and node.get("text") and str(node["text"]).strip():
            r = api_translate(str(node["text"]), target)
            time.sleep(0.25)
            if r:
                node["text"] = r
        for v in node.values():
            translate_lexical(v, target)
    elif isinstance(node, list):
        for item in node:
            translate_lexical(item, target)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--langs", default="ru,fr,es,sw,ar")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()
    targets = [l.strip() for l in args.langs.split(",") if l.strip()]
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    total = 0
    skipped = 0

    for table, fields in JOBS:
        rows = conn.execute(f"SELECT * FROM {table} WHERE _locale='en'").fetchall()
        if args.limit:
            rows = rows[:args.limit]
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
                out = {}
                ok = False
                for f in fields:
                    val = row[f]
                    if val is None or not str(val).strip():
                        out[f] = val
                        continue
                    if f in ("content", "answer"):
                        try:
                            data = json.loads(val)
                            translate_lexical(data, lang)
                            out[f] = json.dumps(data, ensure_ascii=False)
                            ok = True
                        except Exception:
                            out[f] = val  # keep English if not valid JSON
                    else:
                        r = translate_plain(val, lang)
                        out[f] = r if r else val
                        if r:
                            ok = True
                if ok:
                    cols = fields + ["_locale", "_parent_id"]
                    vals = [out.get(f) for f in fields] + [lang, pid]
                    conn.execute(
                        f"INSERT INTO {table} ({', '.join(fields)}, _locale, _parent_id) VALUES ({', '.join(['?']*len(fields))}, ?, ?)",
                        vals,
                    )
                    conn.commit()
                    total += 1
                    print(f"[{table}] {pid} {lang} -> {str(out.get(fields[0]))[:40]}")
    print(f"\nDone. Translated {total} rows, skipped {skipped}.")

if __name__ == "__main__":
    main()
