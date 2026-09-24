/**
 * Localize product gallery image `alt` text for every locale.
 *
 * WHY
 * ---
 * `products.images[].alt` is `localized: true`, but only the English rows were
 * ever populated. Because the site configures `fallback: true`, every other
 * locale silently received the **English** alt text, so a Russian or Arabic
 * product page announced English strings to screen readers and shipped English
 * `alt` attributes to Google Images.
 *
 * On top of that, 207 of the 357 English alts are raw Alibaba listing titles —
 * keyword-stuffed marketing copy such as
 *   "Automatic Digital Egg Incubator 48-96 Eggs Capacity Temperature Humidity
 *    Control Roller Tray For Chicken Poultry Hatching 98%"
 * which is poor alt text even in English: it describes the supplier's listing,
 * not the picture, and six gallery images of one product all carried the exact
 * same string.
 *
 * WHAT
 * ----
 * Alt text is regenerated from the **localized product name**, which is already
 * translated and is the one string that actually identifies the subject:
 *
 *     image 1  →  <localized name>
 *     image N  →  <localized name> — <localized "view"> N
 *
 * This is a deterministic transformation, not machine translation, so it needs
 * no review: every locale gets its own product name, and the numbered suffix
 * disambiguates the gallery the way the 150 already-good rows did.
 *
 * Safety: every write is re-read and asserted, so a rejected update cannot be
 * reported as success.
 *
 *   pnpm tsx scripts/i18n-image-alt.ts            # dry run
 *   pnpm tsx scripts/i18n-image-alt.ts --apply
 *   pnpm tsx scripts/i18n-image-alt.ts --apply --lang=ru
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ALL_LOCALES = ['en', 'ru', 'fr', 'es', 'sw', 'ar'] as const

/** The word used to number the 2nd..Nth gallery image, per locale. */
const VIEW_WORD: Record<string, string> = {
  en: 'view',
  ru: 'вид',
  fr: 'vue',
  es: 'vista',
  sw: 'mwonekano',
  ar: 'عرض',
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const langArg = args.find((a) => a.startsWith('--lang='))?.split('=')[1]
const LOCALES = (langArg ? [langArg] : ALL_LOCALES).filter((l): l is string => Boolean(l))

interface ImageRow {
  id?: string
  image?: unknown
  alt?: string | null
}

function altFor(name: string, index: number, locale: string): string {
  if (index === 0) return name
  return `${name} — ${VIEW_WORD[locale] ?? VIEW_WORD.en} ${index + 1}`
}

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  let changed = 0
  let skipped = 0
  const failures: string[] = []

  for (const locale of LOCALES) {
    const { docs } = await payload.find({
      collection: 'products',
      locale,
      fallbackLocale: false,
      depth: 0,
      limit: 200,
      pagination: false,
      select: { slug: true, name: true, images: true },
    })

    let localeChanged = 0

    for (const doc of docs as unknown as Array<{ id: number; slug?: string; name?: string | null; images?: ImageRow[] }>) {
      const rows = doc.images ?? []
      if (rows.length === 0) continue

      // `name` is required and localized, so with fallbackLocale:false a null
      // here means the product genuinely has no name in this locale. Leave the
      // existing alt alone rather than inventing one.
      const name = (doc.name || '').trim()
      if (!name) {
        skipped += 1
        continue
      }

      const next = rows.map((row, i) => ({ ...row, alt: altFor(name, i, locale) }))
      const already = rows.every((row, i) => row.alt === next[i].alt)
      if (already) continue

      if (!apply) {
        console.log(`  [dry] ${locale} ${doc.slug}: ${rows.length} alt(s), e.g. "${next[0].alt}"`)
        localeChanged += 1
        continue
      }

      try {
        await payload.update({
          collection: 'products',
          id: doc.id,
          locale,
          depth: 0,
          data: { images: next } as never,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
        failures.push(`${locale}/${doc.slug}: ${msg}`)
        console.error(`  ✗ ${locale}/${doc.slug}: ${msg}`)
        continue
      }

      // Re-read and assert: a rejected write must never be reported as success.
      const check = await payload.findByID({
        collection: 'products',
        id: doc.id,
        locale,
        fallbackLocale: false,
        depth: 0,
        select: { images: true },
      })
      const written = ((check as unknown as { images?: ImageRow[] }).images ?? []).map((r) => r.alt)
      const expected = next.map((r) => r.alt)
      if (JSON.stringify(written) !== JSON.stringify(expected)) {
        failures.push(`${locale}/${doc.slug}: verify mismatch ${JSON.stringify(written.slice(0, 2))}`)
        console.error(`  ✗ ${locale}/${doc.slug}: verify mismatch`)
        continue
      }

      localeChanged += 1
    }

    console.log(`${locale}: ${localeChanged} product(s) ${apply ? 'updated' : 'to update'}`)
    changed += localeChanged
  }

  console.log(
    `\n${apply ? 'Applied' : 'Would apply'} to ${changed} product-locale pair(s)` +
      (skipped ? `; ${skipped} skipped (no localized name)` : ''),
  )
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
