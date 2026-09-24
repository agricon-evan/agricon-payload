/**
 * Apply translated product `description` values to the CMS.
 *
 * WHY
 * ---
 * `products.description` is `localized: true` and is the short marketing summary
 * rendered directly under the product name in the page header. Only 32 of the 65
 * products had a translation in any given locale, so on the other 33 the header
 * fell back to English — visible English body copy in the most prominent slot on
 * the page, on all five non-English locales.
 *
 * Input files (one per locale, produced by the translation pass):
 *   scripts/translations/<lang>-descriptions.json   →  { "<slug>": "<text>" }
 *
 * Safety: every write is re-read with `fallbackLocale: false` and asserted. A
 * fallback read would return the English description for a failed write and
 * report success, which is precisely the failure mode being fixed.
 *
 *   pnpm tsx scripts/i18n-product-descriptions.ts            # dry run
 *   pnpm tsx scripts/i18n-product-descriptions.ts --apply
 *   pnpm tsx scripts/i18n-product-descriptions.ts --apply --lang=ru
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
    const file = path.join(TR, `${lang}-descriptions.json`)
    if (!fs.existsSync(file)) {
      failures.push(`${lang}: missing ${path.relative(ROOT, file)}`)
      console.error(`✗ ${lang}: input file not found — ${path.relative(ROOT, file)}`)
      continue
    }
    const table = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>
    const slugs = Object.keys(table)
    console.log(`${lang}: ${slugs.length} description(s) in ${path.basename(file)}`)

    let updated = 0
    for (const slug of slugs) {
      const id = idBySlug.get(slug)
      if (!id) {
        missing.push(`${lang}/${slug}`)
        continue
      }
      const description = String(table[slug] ?? '').trim()
      if (!description) {
        failures.push(`${lang}/${slug}: empty translation`)
        continue
      }

      if (!apply) {
        updated += 1
        continue
      }

      try {
        await payload.update({ collection: 'products', id, locale: lang, data: { description } })
      } catch (err) {
        const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
        failures.push(`${lang}/${slug}: ${msg}`)
        console.error(`  ✗ ${lang}/${slug}: ${msg}`)
        continue
      }

      const check = await payload.findByID({
        collection: 'products',
        id,
        locale: lang,
        fallbackLocale: false,
        depth: 0,
        select: { description: true },
      })
      const written = (check as unknown as { description?: string | null }).description
      if (written !== description) {
        failures.push(`${lang}/${slug}: verify mismatch`)
        console.error(`  ✗ ${lang}/${slug}: verify mismatch`)
        continue
      }
      updated += 1
    }

    console.log(`  ${apply ? 'updated' : 'to update'}: ${updated}`)
    total += updated
  }

  console.log(`\n${apply ? 'Applied' : 'Would apply'} ${total} description write(s)`)
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
