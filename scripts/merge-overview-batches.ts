/**
 * Merge the per-batch `overview` translation outputs into one file per language,
 * then delete the batch outputs.
 *
 * Each language's translations arrive as `<lang>-overview-batch<N>.json`, all of
 * which together must cover exactly the slug set in `_todo/overview-all.json`.
 * This asserts that coverage before writing `<lang>-overview.json`, so a missing
 * or duplicated batch fails loudly instead of silently dropping a product.
 *
 *   pnpm tsx scripts/merge-overview-batches.ts
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TR = path.join(ROOT, 'scripts/translations')

const ALL = JSON.parse(fs.readFileSync(path.join(TR, '_todo/overview-all.json'), 'utf8')) as Record<
  string,
  string[]
>
const expected = new Set(Object.keys(ALL))
const LANGS = ['ru', 'fr', 'es', 'sw', 'ar']

const problems: string[] = []
let merged = 0

for (const lang of LANGS) {
  const batches = fs
    .readdirSync(TR)
    .filter((f) => f.startsWith(`${lang}-overview-batch`) && f.endsWith('.json'))
    .sort()

  if (!batches.length) {
    problems.push(`${lang}: no batch files found`)
    continue
  }

  const out: Record<string, string[]> = {}
  const dupes: string[] = []

  for (const file of batches) {
    const data = JSON.parse(fs.readFileSync(path.join(TR, file), 'utf8')) as Record<string, string[]>
    for (const [slug, runs] of Object.entries(data)) {
      if (slug in out) {
        dupes.push(`${slug} (${file})`)
        continue
      }
      // Length must match the English run count exactly, or the reassembly
      // in i18n-overview.ts would misplace text across tags.
      const want = ALL[slug]?.length
      if (want === undefined) {
        problems.push(`${lang}/${slug}: slug not in English source (${file})`)
        continue
      }
      if (!Array.isArray(runs) || runs.length !== want) {
        problems.push(`${lang}/${slug}: ${runs?.length ?? 'n/a'} run(s), expected ${want} (${file})`)
        continue
      }
      const bad = runs.findIndex((r) => !String(r ?? '').trim())
      if (bad !== -1) {
        problems.push(`${lang}/${slug}: empty string at index ${bad} (${file})`)
        continue
      }
      out[slug] = runs.map((r) => String(r))
    }
  }

  if (dupes.length) problems.push(`${lang}: duplicate slug(s): ${dupes.join(', ')}`)

  const missing = [...expected].filter((s) => !(s in out))
  if (missing.length) {
    problems.push(`${lang}: ${missing.length} slug(s) not covered by any batch`)
    continue
  }

  const target = path.join(TR, `${lang}-overview.json`)
  fs.writeFileSync(target, JSON.stringify(out, null, 2) + '\n')
  const runs = Object.values(out).reduce((n, r) => n + r.length, 0)
  console.log(`${lang}: merged ${Object.keys(out).length} product(s), ${runs} run(s) → ${path.basename(target)}`)
  for (const f of batches) fs.unlinkSync(path.join(TR, f))
  merged += 1
}

console.log(`\n${merged}/${LANGS.length} language file(s) written`)
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems) console.error('  ✗ ' + p)
  process.exit(1)
}
console.log('No problems.')
