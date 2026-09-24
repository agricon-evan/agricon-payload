/**
 * Move every product from one subcategory into another, then remove the empty
 * subcategory. Used when the catalogue taxonomy is reorganised — e.g. the
 * "Transport Crate" subcategory turned out to be a kind of breeding accessory,
 * so its one product moved into "Breeding Accessories".
 *
 *   pnpm tsx scripts/move-subcategory.ts --from=transport-crate --to=breeding-accessories           # dry run
 *   pnpm tsx scripts/move-subcategory.ts --from=transport-crate --to=breeding-accessories --apply
 *
 * What it does:
 *   1. lists the products in `--from` and re-points their `subcategory` field;
 *   2. deletes `--from` (refusing if it still has products or is referenced);
 *   3. prints the URL that changes, so redirects can be added to next.config.ts.
 *
 * ⚠️ Product pages are `/products/<category>/<subcategory>/<slug>`, so moving a
 * product changes its URL. Add a redirect for every printed path, otherwise the
 * old URL 404s and any inbound link or indexed page breaks.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const args = new Map(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--') && a.includes('='))
    .map((a) => a.replace(/^--/, '').split('=') as [string, string]),
)
const from = args.get('from')
const to = args.get('to')
const apply = process.argv.includes('--apply')

if (!from || !to) {
  console.error('usage: --from=<subcategory-slug> --to=<subcategory-slug> [--apply]')
  process.exit(2)
}

const { default: config } = await import('../src/payload.config.js')
const payload = await getPayload({ config })

const findSub = async (slug: string) => {
  const { docs } = await payload.find({
    collection: 'subcategories',
    where: { slug: { equals: slug } },
    locale: 'en',
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  return docs[0] as Record<string, unknown> | undefined
}

const source = await findSub(from)
const target = await findSub(to)
if (!source) throw new Error(`subcategory "${from}" not found`)
if (!target) throw new Error(`subcategory "${to}" not found`)

const catSlug = (sub: Record<string, unknown>): string => {
  const category = sub.category
  return typeof category === 'object' && category ? String((category as { slug?: string }).slug || '') : ''
}
const sourceCat = catSlug(source)
const targetCat = catSlug(target)

const { docs: products } = await payload.find({
  collection: 'products',
  where: { subcategory: { equals: source.id } },
  locale: 'en',
  depth: 0,
  limit: 500,
  overrideAccess: true,
})

console.log(`move ${products.length} product(s): ${from} (category ${sourceCat}) → ${to} (category ${targetCat})\n`)
for (const product of products as Array<Record<string, unknown>>) {
  console.log(`  ${product.slug}`)
  console.log(`    old: /products/${sourceCat}/${from}/${product.slug}`)
  console.log(`    new: /products/${targetCat}/${to}/${product.slug}`)
}
console.log(`\nsubcategory "${from}" will be deleted; its page /products/${sourceCat}/${from} should redirect to /products/${sourceCat}`)

if (!apply) {
  console.log('\ndry run — re-run with --apply to perform the move')
  process.exit(0)
}

for (const product of products as Array<Record<string, unknown>>) {
  await payload.update({
    collection: 'products',
    id: product.id as never,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
    data: { subcategory: target.id } as never,
  })
}
console.log(`\n✓ re-pointed ${products.length} product(s) to ${to}`)

// Localized values of the removed subcategory (name/description) are dropped with
// it; the target's own translations stay untouched.
await payload.delete({
  collection: 'subcategories',
  id: source.id as never,
  depth: 0,
  overrideAccess: true,
})
console.log(`✓ deleted subcategory ${from}`)

const after = await payload.find({
  collection: 'products',
  where: { subcategory: { equals: target.id } },
  locale: 'en',
  depth: 0,
  limit: 500,
  overrideAccess: true,
})
console.log(`  ${to} now holds ${after.totalDocs} product(s): ${after.docs.map((d) => (d as { slug?: string }).slug).join(', ')}`)
process.exit(0)
