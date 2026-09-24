/**
 * Apply translated product names to the CMS.
 *
 * WHY
 * ---
 * `products.name` is `localized: true`, but all 65 products stored the *same*
 * English string in all six locales — the field was populated everywhere (so a
 * "missing translations" count never flagged it) while carrying no translation
 * at all. Categories, subcategories and solutions had all been translated, so
 * product names were the last English island in the catalogue hierarchy.
 *
 * The visible cost was on every one of the 390 product pages: an English `<h1>`,
 * English breadcrumb text, English product cards on the category/subcategory and
 * search pages, English `alt` text (which is derived from the name — see
 * scripts/i18n-image-alt.ts), and English titles in Google results.
 *
 * Input files (produced by the translation pass, one per locale):
 *   scripts/translations/<lang>-product-names.json   →  { "<slug>": "<name>" }
 *
 * Safety: every write is re-read and asserted, so a rejected update cannot be
 * reported as success. Slugs present in the input but absent from the CMS are
 * reported rather than silently ignored.
 *
 *   pnpm tsx scripts/i18n-product-names.ts            # dry run, all locales
 *   pnpm tsx scripts/i18n-product-names.ts --apply
 *   pnpm tsx scripts/i18n-product-names.ts --apply --lang=ru
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const TR = path.join(ROOT, 'scripts/translations')

const ALL_LANGS = ['ru', 'fr', 'es', 'sw', 'ar']
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const langArg = args.find((a) => a.startsWith('--lang='))?.split('=')[1]
const LANGS = langArg ? [langArg] : ALL_LANGS

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  // slug → id, read once. depth 0 keeps this to the id/slug columns.
  const { docs } = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 500,
    pagination: false,
    select: { slug: true },
  })
  const idBySlug = new Map<string, number>()
  for (const d of docs as unknown as Array<{ id: number; slug?: string | null }>) {
    if (d.slug) idBySlug.set(d.slug, d.id)
  }
  console.log(`${idBySlug.size} product(s) in the CMS\n`)

  const failures: string[] = []
  const missing: string[] = []
  let total = 0

  for (const lang of LANGS) {
    const file = path.join(TR, `${lang}-product-names.json`)
    if (!fs.existsSync(file)) {
      failures.push(`${lang}: missing ${path.relative(ROOT, file)}`)
      console.error(`✗ ${lang}: input file not found — ${path.relative(ROOT, file)}`)
      continue
    }
    const table = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>
    const slugs = Object.keys(table)
    console.log(`${lang}: ${slugs.length} name(s) in ${path.basename(file)}`)

    let updated = 0
    for (const slug of slugs) {
      const id = idBySlug.get(slug)
      if (!id) {
        missing.push(`${lang}/${slug}`)
        continue
      }
      const name = String(table[slug] ?? '').trim()
      if (!name) {
        failures.push(`${lang}/${slug}: empty translation`)
        continue
      }

      if (!apply) {
        updated += 1
        continue
      }

      try {
        await payload.update({ collection: 'products', id, locale: lang, data: { name } })
      } catch (err) {
        const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
        failures.push(`${lang}/${slug}: ${msg}`)
        console.error(`  ✗ ${lang}/${slug}: ${msg}`)
        continue
      }

      // Re-read with no fallback: a fallback read would return the English name
      // and make a silently-rejected write look like a success.
      const check = await payload.findByID({
        collection: 'products',
        id,
        locale: lang,
        fallbackLocale: false,
        depth: 0,
        select: { name: true },
      })
      const written = (check as unknown as { name?: string | null }).name
      if (written !== name) {
        failures.push(`${lang}/${slug}: verify mismatch (got ${JSON.stringify(written)})`)
        console.error(`  ✗ ${lang}/${slug}: verify mismatch`)
        continue
      }
      updated += 1
    }

    console.log(`  ${apply ? 'updated' : 'to update'}: ${updated}`)
    total += updated
  }

  console.log(`\n${apply ? 'Applied' : 'Would apply'} ${total} product-name write(s)`)
  if (missing.length) {
    console.log(`${missing.length} slug(s) in the input have no product in the CMS: ${missing.slice(0, 10).join(', ')}`)
  }
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`)
    for (const f of failures.slice(0, 20)) console.error('  ' + f)
    process.exit(1)
  }
  console.log('No failures.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
