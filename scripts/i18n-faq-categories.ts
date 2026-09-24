/**
 * Localize the six CMS FAQ category names.
 *
 * `faqCategories.name` is `localized: true`, but only the English rows were ever
 * written. With `fallback: true` every locale therefore received the English
 * name, and `/faq` rendered "Ordering & MOQ", "Shipping & Export" … as the quick
 * category chips on the Russian, Arabic and Swahili pages.
 *
 * The frontend already maps these six known names onto the localized
 * `faq.categoryChips` UI strings (see src/app/(frontend)/[locale]/faq/page.tsx),
 * so the visible leak is closed. This script fixes the data itself so the admin
 * panel is correct too, and so an editor reading the CMS sees the right
 * language. The two must stay in sync — the chip mapping is keyed by the
 * **English** name, which is the stable identity of a category (the collection
 * has no slug field), so the English rows are left exactly as they are.
 *
 * Idempotent. Safety: every write is re-read and asserted.
 *
 *   pnpm tsx scripts/i18n-faq-categories.ts            # dry run
 *   pnpm tsx scripts/i18n-faq-categories.ts --apply
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

/** English name → per-locale translation. Mirrors faq.categoryChips in the UI. */
const NAMES: Record<string, Record<string, string>> = {
  'Ordering & MOQ': {
    ru: 'Заказ и мин. партия',
    fr: 'Commande et MOQ',
    es: 'Pedidos y MOQ',
    sw: 'Kuagiza na MOQ',
    ar: 'الطلب والحد الأدنى',
  },
  'Shipping & Export': {
    ru: 'Доставка и экспорт',
    fr: 'Expédition et export',
    es: 'Envío y exportación',
    sw: 'Usafirishaji na Uuzaji nje',
    ar: 'الشحن والتصدير',
  },
  'Quality Control': {
    ru: 'Контроль качества',
    fr: 'Contrôle qualité',
    es: 'Control de calidad',
    sw: 'Udhibiti wa Ubora',
    ar: 'ضبط الجودة',
  },
  'Farm Projects': {
    ru: 'Проекты ферм',
    fr: 'Projets de ferme',
    es: 'Proyectos de granja',
    sw: 'Miradi ya Shamba',
    ar: 'مشروعات المزارع',
  },
  Distributors: {
    ru: 'Дистрибьюторы',
    fr: 'Distributeurs',
    es: 'Distribuidores',
    sw: 'Wasambazaji',
    ar: 'الموزعون',
  },
  'After-sales': {
    ru: 'Сервис после продажи',
    fr: 'Service après-vente',
    es: 'Posventa',
    sw: 'Huduma baada ya mauzo',
    ar: 'خدمة ما بعد البيع',
  },
}

const LOCALES = ['ru', 'fr', 'es', 'sw', 'ar']
const apply = process.argv.slice(2).includes('--apply')

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  // Read the English names, which are the stable keys.
  const { docs } = await payload.find({
    collection: 'faqCategories',
    locale: 'en',
    depth: 0,
    limit: 100,
    pagination: false,
    select: { name: true },
  })
  const categories = docs as unknown as Array<{ id: number; name?: string | null }>
  console.log(`${categories.length} FAQ categor(ies) in the CMS\n`)

  const failures: string[] = []
  const unmapped: string[] = []
  let total = 0

  for (const cat of categories) {
    const english = (cat.name || '').trim()
    const table = NAMES[english]
    if (!table) {
      unmapped.push(english || `(id ${cat.id})`)
      continue
    }

    for (const locale of LOCALES) {
      const name = table[locale]
      if (!name) {
        failures.push(`${english}/${locale}: no translation defined`)
        continue
      }
      if (!apply) {
        total += 1
        continue
      }
      try {
        await payload.update({ collection: 'faqCategories', id: cat.id, locale, data: { name } })
      } catch (err) {
        const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
        failures.push(`${english}/${locale}: ${msg}`)
        console.error(`  ✗ ${english}/${locale}: ${msg}`)
        continue
      }
      // No-fallback re-read: a fallback read would return the English name and
      // make a rejected write look successful.
      const check = await payload.findByID({
        collection: 'faqCategories',
        id: cat.id,
        locale,
        fallbackLocale: false,
        depth: 0,
        select: { name: true },
      })
      const written = (check as unknown as { name?: string | null }).name
      if (written !== name) {
        failures.push(`${english}/${locale}: verify mismatch (got ${JSON.stringify(written)})`)
        console.error(`  ✗ ${english}/${locale}: verify mismatch`)
        continue
      }
      total += 1
    }
  }

  console.log(`${apply ? 'Applied' : 'Would apply'} ${total} category-name write(s)`)
  if (unmapped.length) {
    console.log(
      `${unmapped.length} categor(ies) have no translation table and were skipped: ${unmapped.join(', ')}`,
    )
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
