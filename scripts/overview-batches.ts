/**
 * Split the deduplicated `overviewHtml` manifest into translation batches.
 *
 * `overviewHtml` is the product page's long-form article. All six locales
 * currently store the English text, so this is the last untranslated field.
 * The 963 prose runs collapse to 542 distinct strings (the supplier boilerplate
 * repeats up to 28 times), so translating by unique string keeps the shared
 * block consistent instead of producing 28 slightly different renderings.
 *
 * This writes one input file per batch under `_todo/overview-tr/in/`, balanced
 * by character count rather than item count (string lengths range from 3 to
 * 1,949 chars). Translators read a batch and write
 * `_todo/overview-tr/out/<lang>-batchNN.json` with the same keys.
 *
 * It also emits `ru-missing.json` — the 95 strings Russian still lacks.
 *
 *   pnpm tsx scripts/overview-batches.ts
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TR = path.join(ROOT, 'scripts/translations')
const TD = path.join(TR, '_todo')
const OUT_IN = path.join(TD, 'overview-tr/in')
const OUT_DIR = path.join(TD, 'overview-tr/out')

const BATCHES = 6

const unique = JSON.parse(fs.readFileSync(path.join(TD, 'overview-unique.json'), 'utf8')) as Record<string, string>
const ruAdopted = fs.existsSync(path.join(TR, 'ru-overview-unique-adopted.json'))
  ? (JSON.parse(fs.readFileSync(path.join(TR, 'ru-overview-unique-adopted.json'), 'utf8')) as Record<string, string>)
  : {}

fs.mkdirSync(OUT_IN, { recursive: true })
fs.mkdirSync(OUT_DIR, { recursive: true })

const ids = Object.keys(unique)
const totalChars = ids.reduce((n, id) => n + unique[id].length, 0)

// Greedy longest-first bin packing keeps the batches close in size, which
// matters because one 1.9KB paragraph is worth ~100 short labels.
const buckets: string[][] = Array.from({ length: BATCHES }, () => [])
const loads = new Array(BATCHES).fill(0)
for (const id of [...ids].sort((a, b) => unique[b].length - unique[a].length)) {
  let best = 0
  for (let i = 1; i < BATCHES; i += 1) if (loads[i] < loads[best]) best = i
  buckets[best].push(id)
  loads[best] += unique[id].length
}

const pad = (n: number) => String(n).padStart(2, '0')
let written = 0
buckets.forEach((bucket, i) => {
  // Keep ids in manifest order so the files read naturally.
  bucket.sort()
  const obj: Record<string, string> = {}
  for (const id of bucket) obj[id] = unique[id]
  const file = path.join(OUT_IN, `batch${pad(i + 1)}.json`)
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n')
  const chars = bucket.reduce((n, id) => n + unique[id].length, 0)
  console.log(`  batch${pad(i + 1)}: ${String(bucket.length).padStart(3)} strings, ${String(chars).padStart(6)} chars`)
  written += 1
})

const missingRu = ids.filter((id) => !(id in ruAdopted))
const ruMissing: Record<string, string> = {}
for (const id of missingRu) ruMissing[id] = unique[id]
fs.writeFileSync(path.join(TD, 'overview-tr/in/ru-missing.json'), JSON.stringify(ruMissing, null, 2) + '\n')
const ruChars = missingRu.reduce((n, id) => n + unique[id].length, 0)

console.log(`\n${written} batch file(s) → ${path.relative(ROOT, OUT_IN)}`)
console.log(`total: ${ids.length} unique strings, ${totalChars} chars (${(totalChars / 1024).toFixed(0)} KB) per language`)
console.log(`ru-missing.json: ${missingRu.length} strings, ${ruChars} chars`)
console.log(`languages still needing a full pass: fr, es, sw, ar`)
