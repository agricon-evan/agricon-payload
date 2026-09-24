/**
 * Build the deduplicated translation manifest for `overviewHtml`.
 *
 * WHY DEDUPLICATE
 * ---------------
 * The 60 supplier articles share a large boilerplate block ("About this
 * supplier", "Competitive advantages", "Why Choose Us", the Agricon company
 * paragraph, "FAQs" …). Across the 963 prose runs there are only 542 distinct
 * strings — 63 of them repeat up to 28 times and account for half of all runs.
 *
 * Translating per-product would therefore translate that boilerplate up to 28
 * times per language, which is both wasteful and a consistency hazard: the same
 * English sentence could come back 28 slightly different ways. Keying the work by
 * unique string makes the shared block translate once and appear identically
 * everywhere.
 *
 * Outputs
 *   _todo/overview-unique.json   { "<id>": "<english>" }
 *   _todo/overview-unique-map.json  { "<slug>": ["s0001", "s0002", …] }
 *
 * The map lists one id per prose run, in document order, so expanding a
 * translated dictionary back into per-product run arrays is a pure lookup.
 *
 *   pnpm tsx scripts/i18n-overview-unique.ts --extract
 *   pnpm tsx scripts/i18n-overview-unique.ts --adopt-ru   # salvage existing per-product work
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TR = path.join(ROOT, 'scripts/translations')
const ALL_FILE = path.join(TR, '_todo/overview-all.json')
const UNIQUE_FILE = path.join(TR, '_todo/overview-unique.json')
const MAP_FILE = path.join(TR, '_todo/overview-unique-map.json')

const all = JSON.parse(fs.readFileSync(ALL_FILE, 'utf8')) as Record<string, string[]>
const slugs = Object.keys(all)

/** Stable id per distinct trimmed string, assigned in first-seen order. */
const ids = new Map<string, string>()
const unique: Record<string, string> = {}
let next = 1
const pad = (n: number) => `s${String(n).padStart(4, '0')}`

const map: Record<string, string[]> = {}
for (const slug of slugs) {
  map[slug] = all[slug].map((raw) => {
    const text = raw.trim()
    let id = ids.get(text)
    if (!id) {
      id = pad(next++)
      ids.set(text, id)
      unique[id] = text
    }
    return id
  })
}

fs.writeFileSync(UNIQUE_FILE, JSON.stringify(unique, null, 2) + '\n')
fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + '\n')

const runs = slugs.reduce((n, s) => n + all[s].length, 0)
const chars = Object.values(unique).reduce((n, s) => n + s.length, 0)
const counts = new Map<string, number>()
for (const slug of slugs) for (const id of map[slug]) counts.set(id, (counts.get(id) ?? 0) + 1)
const repeated = [...counts.values()].filter((n) => n > 1).length

console.log(`${runs} run(s) → ${Object.keys(unique).length} unique string(s)`)
console.log(`${chars} chars (${(chars / 1024).toFixed(0)} KB) to translate per language`)
console.log(`${repeated} string(s) used more than once\n`)

// ---- salvage the already-completed Russian per-product batches ---------------
if (process.argv.slice(2).includes('--adopt-ru')) {
  const files = fs
    .readdirSync(TR)
    .filter((f) => /^ru-overview-batch\d+\.json$/.test(f))
    .sort()
  if (!files.length) {
    console.error('no ru-overview-batch*.json found — nothing to adopt')
    process.exit(1)
  }

  const adopted: Record<string, string> = {}
  const conflicts: string[] = []
  let covered = 0

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(TR, file), 'utf8')) as Record<string, string[]>
    for (const [slug, runsArr] of Object.entries(data)) {
      const expectedIds = map[slug]
      if (!expectedIds) {
        console.error(`  ! ${file}: unknown slug ${slug}`)
        continue
      }
      if (runsArr.length !== expectedIds.length) {
        console.error(`  ! ${file}: ${slug} has ${runsArr.length} run(s), expected ${expectedIds.length}`)
        continue
      }
      runsArr.forEach((translated, i) => {
        const id = expectedIds[i]
        const value = String(translated).trim()
        if (!value) return
        covered += 1
        // A repeated English string must map to one translation. Record any
        // disagreement rather than silently letting the first one win.
        if (id in adopted && adopted[id] !== value) {
          conflicts.push(`${id}: "${adopted[id].slice(0, 60)}" vs "${value.slice(0, 60)}"`)
          return
        }
        adopted[id] = value
      })
    }
  }

  fs.writeFileSync(
    path.join(TR, 'ru-overview-unique-adopted.json'),
    JSON.stringify(adopted, null, 2) + '\n',
  )
  console.log(`adopted ${Object.keys(adopted).length} unique ru string(s) from ${covered} run(s)`)
  console.log(`coverage: ${((100 * Object.keys(adopted).length) / Object.keys(unique).length).toFixed(1)}%`)
  if (conflicts.length) {
    console.log(`\n${conflicts.length} inconsistent repeat(s) — first occurrence kept:`)
    for (const c of conflicts.slice(0, 10)) console.log('  · ' + c)
  } else {
    console.log('no inconsistencies among repeated strings')
  }
  const missing = Object.keys(unique).filter((id) => !(id in adopted))
  console.log(`\nstill needed for ru: ${missing.length} string(s)`)
  fs.writeFileSync(path.join(TR, '_todo/ru-overview-missing.json'), JSON.stringify(missing, null, 2) + '\n')
}
