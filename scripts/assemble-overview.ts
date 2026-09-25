/**
 * Assemble the per-batch `overviewHtml` translations into one dictionary per
 * language, expand them into per-product run arrays, and validate the result.
 *
 * Pipeline
 *   _todo/overview-tr/in/batchNN.json        { id: english }        (overview-batches.ts)
 *   _todo/overview-tr/out/<lang>__batchNN.json  { id: translation } (translation agents)
 *        ↓ merge + validate keys
 *   <lang>-overview-unique-adopted.json      { id: translation }
 *        ↓ expand through _todo/overview-unique-map.json (slug -> [id, …])
 *   <lang>-overview.json                     { slug: [run, …] }     (input for i18n-overview.ts)
 *
 * WHY VALIDATE HERE
 * -----------------
 * `i18n-overview.ts` refuses to write an article whose run count does not match
 * the English source, because a short array would misplace text across the
 * article's ~1,400 tags. Catching a missing or extra key at this stage turns a
 * mid-apply failure into a clear message before anything is written.
 *
 * Russian is special: 447 of its 542 strings were already translated in an
 * earlier pass, so only the 95-string remainder is merged on top.
 *
 *   pnpm tsx scripts/assemble-overview.ts
 *   pnpm tsx scripts/assemble-overview.ts --lang=fr
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TR = path.join(ROOT, 'scripts/translations')
const TD = path.join(TR, '_todo')
const IN_DIR = path.join(TD, 'overview-tr/in')
const OUT_DIR = path.join(TD, 'overview-tr/out')

const ALL_LANGS = ['ru', 'fr', 'es', 'sw', 'ar']
const langArg = process.argv.slice(2).find((a) => a.startsWith('--lang='))?.split('=')[1]
const LANGS = langArg ? [langArg] : ALL_LANGS
const FULL_BATCHES = ['batch01', 'batch02', 'batch03', 'batch04', 'batch05', 'batch06']

const unique = JSON.parse(fs.readFileSync(path.join(TD, 'overview-unique.json'), 'utf8')) as Record<string, string>
const map = JSON.parse(fs.readFileSync(path.join(TD, 'overview-unique-map.json'), 'utf8')) as Record<string, string[]>
const all = JSON.parse(fs.readFileSync(path.join(TD, 'overview-all.json'), 'utf8')) as Record<string, string[]>

let problems = 0

for (const lang of LANGS) {
  // Russian reuses the previously adopted 447 entries and adds the rest.
  const dict: Record<string, string> = {}
  if (lang === 'ru') {
    const prev = path.join(TR, 'ru-overview-unique-adopted.json')
    if (fs.existsSync(prev)) Object.assign(dict, JSON.parse(fs.readFileSync(prev, 'utf8')))
  }

  const batches = lang === 'ru' ? ['ru-missing'] : FULL_BATCHES
  let added = 0
  let empty = 0
  let mismatched = 0

  for (const b of batches) {
    const inPath = path.join(IN_DIR, `${b}.json`)
    const outPath = path.join(OUT_DIR, `${lang}__${b}.json`)
    if (!fs.existsSync(outPath)) {
      console.error(`  ✗ ${lang}/${b}: missing output ${path.relative(ROOT, outPath)}`)
      problems += 1
      continue
    }
    const input = JSON.parse(fs.readFileSync(inPath, 'utf8')) as Record<string, string>
    const output = JSON.parse(fs.readFileSync(outPath, 'utf8')) as Record<string, string>

    const inKeys = Object.keys(input)
    const outKeys = new Set(Object.keys(output))
    const missing = inKeys.filter((k) => !outKeys.has(k))
    const extra = [...outKeys].filter((k) => !(k in input))
    if (missing.length || extra.length) {
      console.error(`  ✗ ${lang}/${b}: ${missing.length} missing key(s), ${extra.length} unknown key(s)`)
      if (missing.length) console.error(`      e.g. ${missing.slice(0, 5).join(', ')}`)
      if (extra.length) console.error(`      e.g. ${extra.slice(0, 5).join(', ')}`)
      mismatched += missing.length + extra.length
      problems += 1
    }

    for (const k of inKeys) {
      const v = output[k]
      if (typeof v === 'string' && v.trim()) {
        if (k in dict && dict[k] !== v.trim()) {
          // A repeated English string must translate identically everywhere.
          console.error(`  ! ${lang}/${b}: ${k} disagrees with an earlier batch — keeping the first`)
        } else {
          dict[k] = v.trim()
          added += 1
        }
      } else if (k in input) {
        empty += 1
      }
    }
  }

  const missingIds = Object.keys(unique).filter((id) => !(id in dict))
  console.log(
    `  ${lang}: ${Object.keys(dict).length}/${Object.keys(unique).length} strings` +
      `${added ? ` (+${added})` : ''}` +
      `${empty ? `  ✗ ${empty} empty` : ''}` +
      `${mismatched ? `  ✗ ${mismatched} key mismatch` : ''}`,
  )

  if (missingIds.length) {
    console.error(`    ✗ ${missingIds.length} untranslated id(s), e.g. ${missingIds.slice(0, 5).join(', ')}`)
    problems += 1
    continue
  }

  fs.writeFileSync(path.join(TR, `${lang}-overview-unique-adopted.json`), JSON.stringify(dict, null, 2) + '\n')

  // Expand the dictionary into one run array per product.
  const perSlug: Record<string, string[]> = {}
  for (const [slug, ids] of Object.entries(map)) {
    const want = all[slug]?.length
    const runs = ids.map((id) => dict[id])
    if (runs.length !== want) {
      console.error(`    ✗ ${slug}: ${runs.length} run(s) vs ${want} in the English source`)
      problems += 1
      continue
    }
    perSlug[slug] = runs
  }

  fs.writeFileSync(path.join(TR, `${lang}-overview.json`), JSON.stringify(perSlug, null, 2) + '\n')
  const chars = Object.values(perSlug).reduce((n, r) => n + r.join(' ').length, 0)
  console.log(`    → ${lang}-overview.json: ${Object.keys(perSlug).length} product(s), ${chars} chars`)
}

if (problems) {
  console.error(`\n${problems} problem(s) — not safe to apply.`)
  process.exit(1)
}
console.log('\nAll languages assembled and validated.')
