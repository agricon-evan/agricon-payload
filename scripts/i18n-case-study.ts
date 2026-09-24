/**
 * Create the missing `case_studies_locales` rows for `fish-farm-equipment` and
 * localize them.
 *
 * WHY
 * ---
 * Eleven of the twelve case studies have a locale row in all six languages.
 * `fish-farm-equipment` has one **only for English**, so `/ru/case-studies/…`,
 * `/ar/case-studies/…` and the other three locales rendered the card and page
 * header from the English row via `localization.fallback`.
 *
 * The English record is itself incomplete (`challenge` and `content` are null —
 * the English page renders without those sections too), so there is nothing to
 * translate for them; this script writes the eight fields that do exist.
 *
 * Input file (produced by the translation pass):
 *   scripts/translations/case-study-fish-farm.json
 *     { "<lang>": { "title": …, "subtitle": …, "summary": …, "farm_name": …,
 *                   "location": …, "key_result": …, "equipment": …, "application": … } }
 *
 * Safety: every write is re-read with `fallbackLocale: false` and asserted, so a
 * rejected update cannot be reported as success and a missing translation cannot
 * be masked by the English fallback.
 *
 *   pnpm tsx scripts/i18n-case-study.ts            # dry run
 *   pnpm tsx scripts/i18n-case-study.ts --apply
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const INPUT = path.join(ROOT, 'scripts/translations/case-study-fish-farm.json')
const SLUG = 'fish-farm-equipment'
const LOCALES = ['ru', 'fr', 'es', 'sw', 'ar']

/**
 * Input key → Payload field name.
 *
 * The input file uses the SQLite column spelling (`farm_name`, `key_result`),
 * which is what a database dump shows, but the Payload field names are camelCase.
 * Writing the snake_case key silently created nothing, which is why the
 * verification below is a re-read rather than a trust-the-call.
 */
const FIELDS: Array<[inputKey: string, field: string]> = [
  ['title', 'title'],
  ['subtitle', 'subtitle'],
  ['summary', 'summary'],
  ['farm_name', 'farmName'],
  ['location', 'location'],
  ['key_result', 'keyResult'],
  ['equipment', 'equipment'],
  ['application', 'application'],
]

const apply = process.argv.slice(2).includes('--apply')

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`✗ input file not found — ${path.relative(ROOT, INPUT)}`)
    process.exit(1)
  }
  const table = JSON.parse(fs.readFileSync(INPUT, 'utf8')) as Record<
    string,
    Record<string, string>
  >

  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  const { docs } = await payload.find({
    collection: 'caseStudies',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { slug: { equals: SLUG } },
    select: { slug: true },
  })
  const target = docs[0] as unknown as { id: number } | undefined
  if (!target) {
    console.error(`✗ no case study with slug "${SLUG}"`)
    process.exit(1)
  }
  console.log(`case study "${SLUG}" → id ${target.id}\n`)

  const failures: string[] = []
  let total = 0

  for (const locale of LOCALES) {
    const row = table[locale]
    if (!row) {
      failures.push(`${locale}: no translations in the input file`)
      console.error(`✗ ${locale}: missing from the input file`)
      continue
    }
    const missingFields = FIELDS.filter(([inputKey]) => !String(row[inputKey] ?? '').trim())
    if (missingFields.length) {
      failures.push(`${locale}: empty field(s) ${missingFields.map(([k]) => k).join(', ')}`)
      console.error(`✗ ${locale}: empty field(s) ${missingFields.map(([k]) => k).join(', ')}`)
      continue
    }

    const data = Object.fromEntries(FIELDS.map(([inputKey, field]) => [field, String(row[inputKey]).trim()]))

    if (!apply) {
      total += 1
      console.log(`  [dry] ${locale}: ${FIELDS.length} field(s)`)
      continue
    }

    try {
      await payload.update({
        collection: 'caseStudies',
        id: target.id,
        locale,
        data: data as never,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
      failures.push(`${locale}: ${msg}`)
      console.error(`  ✗ ${locale}: ${msg}`)
      continue
    }

    const check = await payload.findByID({
      collection: 'caseStudies',
      id: target.id,
      locale,
      fallbackLocale: false,
      depth: 0,
      select: Object.fromEntries(FIELDS.map(([, field]) => [field, true])),
    })
    const got = check as unknown as Record<string, string | null>
    const bad = FIELDS.filter(([, field]) => got[field] !== data[field]).map(([, field]) => field)
    if (bad.length) {
      failures.push(`${locale}: verify mismatch on ${bad.join(', ')}`)
      console.error(`  ✗ ${locale}: verify mismatch on ${bad.join(', ')}`)
      continue
    }
    total += 1
    console.log(`  ✓ ${locale}`)
  }

  console.log(`\n${apply ? 'Applied' : 'Would apply'} ${total} locale row(s)`)
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`)
    for (const f of failures) console.error('  ' + f)
    process.exit(1)
  }
  console.log('No failures.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
