/**
 * Rename products (display name + SEO title) without touching their slug, so
 * URLs, redirects and inbound links keep working.
 *
 *   pnpm tsx scripts/rename-products.ts \
 *     --rename=48-bird-half-set-layer-cage:"Half-Set Layer Cage" \
 *     --rename=128-bird-4-tier-layer-cage:"A-Type Layer Cage"
 *   ...add --apply to write
 *
 * Why a script instead of the admin: `name` and `seoTitle` are LOCALIZED, so a
 * rename made only in the English tab leaves the other five languages showing
 * the old name. This writes every locale (all six currently carry the same
 * English product name, because product names are deliberately kept English).
 *
 * `seoTitle` usually reads "<name> | Agricon Agricultural Equipment" — the old
 * name is swapped for the new one in that prefix and the rest is preserved. If a
 * seoTitle does not start with the old name it is left alone and reported.
 *
 * ⚠️ Duplicate names are allowed by the schema but render as two identical cards.
 * The script warns when a rename collides with an existing product name.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import { locales } from '../src/i18n/config.js'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const raw = process.argv.slice(2)
const flags = raw.filter((a) => a.startsWith('--') && a.includes('='))
const single = new Map(flags.map((a) => a.replace(/^--/, '').split('=') as [string, string]))
const apply = raw.includes('--apply')

const renames = flags
  .filter((a) => a.startsWith('--rename='))
  .map((a) => a.slice('--rename='.length))
  .map((pair) => {
    const at = pair.indexOf(':')
    if (at < 0) throw new Error(`--rename expects slug:"New Name", got "${pair}"`)
    return { slug: pair.slice(0, at), name: pair.slice(at + 1) }
  })

if (renames.length === 0) {
  console.error('usage: --rename=<slug>:"New Name" [--rename=…] [--apply]')
  process.exit(2)
}

const targetLocales = (single.get('locales') || locales.join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const { default: config } = await import('../src/payload.config.js')
const payload = await getPayload({ config })

const findProduct = async (slug: string, locale: string) =>
  (
    await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      locale,
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0] as Record<string, unknown> | undefined

// Name collisions: same name already used by another product.
const { docs: allProducts } = await payload.find({
  collection: 'products',
  locale: 'en',
  depth: 0,
  limit: 500,
  overrideAccess: true,
})

console.log(`renaming ${renames.length} product(s) across ${targetLocales.length} locale(s): ${targetLocales.join(', ')}\n`)

const plan: Array<{ slug: string; id: number | string; from: string; to: string; seoTitles: Record<string, string | null> }> = []
const plannedNames = new Map<string, string>()

for (const r of renames) {
  const product = await findProduct(r.slug, 'en')
  if (!product) throw new Error(`product "${r.slug}" not found`)

  const clash = [
    ...(allProducts as Array<Record<string, unknown>>)
      .filter((p) => p.name === r.name && p.slug !== r.slug)
      .map((p) => String(p.slug)),
    ...(plannedNames.has(r.name) ? [`${plannedNames.get(r.name)} (same run)`] : []),
  ]
  plannedNames.set(r.name, r.slug)
  console.log(`  ${r.slug}\n    "${product.name}" → "${r.name}"`)
  if (clash.length > 0) {
    console.log(
      `    ⚠️ "${r.name}" ends up used by: ${clash.join(', ')} — the cards will share one title.`,
    )
  }

  // seoTitle is localized like name; keep the suffix ("| Agricon …").
  const seoTitles: Record<string, string | null> = {}
  for (const locale of targetLocales) {
    const doc = locale === 'en' ? product : await findProduct(r.slug, locale)
    const current = typeof doc?.seoTitle === 'string' ? doc.seoTitle : ''
    const oldName = String(doc?.name ?? product.name)
    seoTitles[locale] = current.startsWith(oldName) ? r.name + current.slice(oldName.length) : null
    if (current && seoTitles[locale] === null) {
      console.log(`    i ${locale}: seoTitle "${current}" does not start with the name — left unchanged`)
    }
  }
  plan.push({ slug: r.slug, id: product.id as number | string, from: String(product.name), to: r.name, seoTitles })
}

if (!apply) {
  console.log('\ndry run — re-run with --apply to write')
  process.exit(0)
}

for (const item of plan) {
  for (const locale of targetLocales) {
    const data: Record<string, string> = { name: item.to }
    const seoTitle = item.seoTitles[locale]
    if (seoTitle) data.seoTitle = seoTitle
    await payload.update({
      collection: 'products',
      id: item.id as never,
      locale,
      depth: 0,
      overrideAccess: true,
      data: data as never,
    })
  }

  // Read back every locale: a rename that silently only lands in English is the
  // exact failure this script exists to prevent.
  const problems: string[] = []
  for (const locale of targetLocales) {
    const after = await findProduct(item.slug, locale)
    if (after?.name !== item.to) problems.push(`${locale}:name="${after?.name}"`)
    const expectedSeo = item.seoTitles[locale]
    if (expectedSeo && after?.seoTitle !== expectedSeo) problems.push(`${locale}:seoTitle="${after?.seoTitle}"`)
  }
  console.log(
    problems.length === 0
      ? `✓ ${item.slug} → "${item.to}" (${targetLocales.length} locale(s) verified)`
      : `✗ ${item.slug} NOT fully written: ${problems.join(', ')}`,
  )
}
process.exit(0)
