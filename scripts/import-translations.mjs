#!/usr/bin/env node
/**
 * Import LLM-generated translations (scripts/translations/*.json) into the
 * Payload SQLite *_locales tables.
 *
 * Products keep their English names as technical terms; descriptions are
 * translated. seo_title is generated as "{name} | Agricon {equipment word}".
 */
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const T_DIR = join(__dirname, 'translations')

const LANGS = ['ru', 'fr', 'es', 'sw', 'ar']
const SITE_TITLE = {
  ru: 'Сельскохозяйственное оборудование',
  fr: 'Équipement agricole',
  es: 'Equipo agrícola',
  sw: 'Vifaa vya Kilimo',
  ar: 'معدات زراعية',
}

const db = new DatabaseSync(join(__dirname, '..', 'agricon-dev.db'))
db.exec('PRAGMA busy_timeout=10000; PRAGMA journal_mode=WAL;')

function load(file) {
  const p = join(T_DIR, file)
  if (!existsSync(p)) throw new Error(`missing ${p}`)
  return JSON.parse(readFileSync(p, 'utf-8'))
}

function upsert(table, fields, row) {
  const cols = [...fields, '_locale', '_parent_id']
  const placeholders = cols.map(() => '?').join(', ')
  const existing = db
    .prepare(`SELECT COUNT(*) c FROM ${table} WHERE _parent_id=? AND _locale=?`)
    .get(row._parent_id, row._locale).c
  if (existing) {
    const set = fields.map((f) => `${f}=?`).join(', ')
    db.prepare(`UPDATE ${table} SET ${set} WHERE _parent_id=? AND _locale=?`).run(
      ...fields.map((f) => row[f] ?? null), row._parent_id, row._locale,
    )
  } else {
    db.prepare(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
    ).run(...cols.map((c) => row[c] ?? null))
  }
}

const en = load('en-content.json')
let total = 0

for (const lang of LANGS) {
  const t = load(`${lang}.json`)
  const tp = load(`${lang}-products.json`)
  const siteWord = SITE_TITLE[lang]

  // categories
  for (const c of en.categories) {
    const tr = t.categories?.[String(c._parent_id)]
    if (!tr) continue
    upsert('categories_locales', ['name', 'description'], {
      _parent_id: c._parent_id, _locale: lang,
      name: tr.name ?? c.name, description: tr.description ?? c.description,
    })
    total++
  }

  // subcategories
  for (const s of en.subcategories) {
    const tr = t.subcategories?.[String(s._parent_id)]
    if (!tr) continue
    upsert('subcategories_locales', ['name', 'subtitle', 'description'], {
      _parent_id: s._parent_id, _locale: lang,
      name: tr.name ?? s.name, description: tr.description ?? s.description,
    })
    total++
  }

  // products — keep English name (technical term), translate description
  for (const p of en.products) {
    const desc = tp[String(p._parent_id)] || p.description
    const seoTitle = `${p.name} | Agricon ${siteWord}`
    upsert('products_locales', ['name', 'description', 'overview_html', 'seo_title', 'seo_description'], {
      _parent_id: p._parent_id, _locale: lang,
      name: p.name, description: desc, seo_title: seoTitle, seo_description: desc,
    })
    total++
  }

  // product features (vocabulary lookup by English phrase)
  const featureMap = t.features || {}
  for (const f of en.products_features) {
    const tr = featureMap[f.feature]
    if (!tr) continue
    upsert('products_features_locales', ['feature'], {
      _parent_id: f._parent_id, _locale: lang, feature: tr,
    })
    total++
  }

  // solutions
  for (const s of en.solutions) {
    const tr = t.solutions?.[String(s._parent_id)]
    if (!tr) continue
    upsert('solutions_locales', ['name', 'description'], {
      _parent_id: s._parent_id, _locale: lang,
      name: tr.name ?? s.name, description: tr.description ?? s.description,
    })
    total++
  }

  // case studies
  for (const cs of en.case_studies) {
    const tr = t.case_studies?.[String(cs._parent_id)]
    if (!tr) continue
    const fields = ['title', 'subtitle', 'summary', 'content', 'farm_name', 'key_result', 'equipment', 'application', 'challenge']
    const row = { _parent_id: cs._parent_id, _locale: lang }
    for (const f of fields) row[f] = tr[f] ?? cs[f] ?? null
    upsert('case_studies_locales', fields, row)
    total++
  }

  console.log(`[${lang}] done (cumulative ${total})`)
}

db.close()
console.log(`\nImport complete: ${total} rows written/updated`)
