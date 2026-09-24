/**
 * Regenerate `seoTitle` and `seoDescription` for every product, in every locale.
 *
 * WHY
 * ---
 * Both fields are `localized: true`, but only the English rows ever held real
 * values — and, worse, the non-English rows that *did* have a value held the
 * **English string**. `fallbackLocale: false` cannot detect that: the English
 * text is genuinely stored in the Russian row, so a no-fallback read returns it
 * as if it were a Russian translation.
 *
 * The rendered result was an English `<title>` and an English meta description
 * on /ru, /fr, /es, /sw and /ar product pages — the wrong language in the search
 * result, and six near-identical English snippets competing with each other.
 *
 * WHAT
 * ----
 * Both fields are *derived*, not authored — the English data proves it:
 *
 *   seoTitle        63/65 are exactly  `<name> | Agricon Agricultural Equipment`
 *   seoDescription  29/65 are exactly  `<name> — <subcategory> from Agricon.
 *                                       Factory-direct agricultural equipment
 *                                       with export packaging and worldwide shipping.`
 *                   the other 36 are the product `description`, truncated to 158 chars.
 *
 * So they are regenerated from already-localized content:
 *
 *   seoTitle        `<localized name> | Agricon Agricultural Equipment`
 *   seoDescription  the localized `description` truncated to 158 chars when one
 *                   exists, otherwise the localized template above.
 *
 * Using the localized `description` is strictly better than the English
 * behaviour: it is a real sentence about the product rather than boilerplate,
 * and it is what the page already falls back to. The 158-char cut matches the
 * existing English rows exactly (their lengths are 158,158,110,158,…).
 *
 * A trailing partial word is trimmed at a word boundary so the snippet never
 * ends mid-word.
 *
 * Idempotent. Safety: every write is re-read and asserted.
 *
 *   pnpm tsx scripts/i18n-product-seo.ts            # dry run
 *   pnpm tsx scripts/i18n-product-seo.ts --apply
 *   pnpm tsx scripts/i18n-product-seo.ts --apply --lang=ru
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ALL_LOCALES = ['en', 'ru', 'fr', 'es', 'sw', 'ar']
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const langArg = args.find((a) => a.startsWith('--lang='))?.split('=')[1]
const LOCALES = langArg ? [langArg] : ALL_LOCALES

/** Matches the English rows' observed cut-off exactly. */
const DESC_LIMIT = 158

/** Localized "from Agricon. Factory-direct … worldwide shipping." boilerplate. */
const TEMPLATE_TAIL: Record<string, string> = {
  en: 'from Agricon. Factory-direct agricultural equipment with export packaging and worldwide shipping.',
  ru: 'от Agricon. Сельскохозяйственное оборудование напрямую с завода, экспортная упаковка и доставка по всему миру.',
  fr: "par Agricon. Équipement agricole en direct d'usine, emballage d'exportation et expédition dans le monde entier.",
  es: 'de Agricon. Equipo agrícola directo de fábrica, embalaje de exportación y envío a todo el mundo.',
  sw: 'kutoka Agricon. Vifaa vya kilimo moja kwa moja kutoka kiwandani, ufungashaji wa kuuza nje na usafirishaji duniani kote.',
  ar: 'من Agricon. معدات زراعية مباشرة من المصنع مع تغليف التصدير والشحن إلى جميع أنحاء العالم.',
}

const SEO_TITLE_SUFFIX = '| Agricon Agricultural Equipment'

/**
 * Truncate to `limit` characters, cutting at a word boundary so the snippet does
 * not end mid-word, and appending an ellipsis when anything was dropped.
 */
function truncate(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= limit) return clean
  const cut = clean.slice(0, limit)
  const lastSpace = cut.lastIndexOf(' ')
  const body = lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut
  return body.replace(/[\s,;:.—-]+$/, '') + '…'
}

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  const failures: string[] = []
  let total = 0

  for (const locale of LOCALES) {
    // No fallback: a fallback read would hand back English `name`/`description`
    // for any locale that is genuinely missing them, silently producing English
    // SEO text — the exact bug this script exists to remove.
    const { docs } = await payload.find({
      collection: 'products',
      locale,
      fallbackLocale: false,
      depth: 0,
      limit: 500,
      pagination: false,
      select: { slug: true, name: true, description: true, subcategory: true },
    })
    type Row = {
      id: number
      slug?: string | null
      name?: string | null
      description?: string | null
      subcategory?: { name?: string | null } | number | null
    }
    const rows = docs as unknown as Row[]

    let updated = 0
    let skippedNoName = 0

    for (const doc of rows) {
      const name = (doc.name || '').trim()
      if (!name || !doc.slug) {
        // Without a localized name there is nothing correct to build from.
        // Leaving the field alone beats writing English into a foreign locale.
        skippedNoName += 1
        continue
      }

      const subName =
        doc.subcategory && typeof doc.subcategory === 'object'
          ? (doc.subcategory.name || '').trim()
          : ''

      const seoTitle = `${name} ${SEO_TITLE_SUFFIX}`

      const description = (doc.description || '').replace(/\s+/g, ' ').trim()
      const seoDescription = description
        ? truncate(description, DESC_LIMIT)
        : `${name} — ${subName} ${TEMPLATE_TAIL[locale] ?? TEMPLATE_TAIL.en}`.replace(/\s+/g, ' ').trim()

      if (!apply) {
        updated += 1
        continue
      }

      try {
        await payload.update({
          collection: 'products',
          id: doc.id,
          locale,
          data: { seoTitle, seoDescription } as never,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
        failures.push(`${locale}/${doc.slug}: ${msg}`)
        console.error(`  ✗ ${locale}/${doc.slug}: ${msg}`)
        continue
      }

      // No-fallback re-read so a rejected write cannot look like a success.
      const check = await payload.findByID({
        collection: 'products',
        id: doc.id,
        locale,
        fallbackLocale: false,
        depth: 0,
        select: { seoTitle: true, seoDescription: true },
      })
      const got = check as unknown as { seoTitle?: string | null; seoDescription?: string | null }
      if (got.seoTitle !== seoTitle || got.seoDescription !== seoDescription) {
        failures.push(`${locale}/${doc.slug}: verify mismatch`)
        console.error(`  ✗ ${locale}/${doc.slug}: verify mismatch`)
        continue
      }
      updated += 1
    }

    console.log(
      `${locale}: ${updated} product(s) ${apply ? 'updated' : 'to update'}` +
        (skippedNoName ? `, ${skippedNoName} skipped (no localized name)` : ''),
    )
    total += updated
  }

  console.log(`\n${apply ? 'Applied' : 'Would apply'} ${total} SEO write(s)`)
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
