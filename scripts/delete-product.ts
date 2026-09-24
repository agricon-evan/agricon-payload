/**
 * Delete one product and clean up everything that pointed at it. Written for the
 * case where the catalogue ended up with two listings for the same item — the
 * Alibaba scrape produced both `poultry-feeder-and-drinker-set` and
 * `poultry-feeding-and-watering-set` (same supplier, same specs, same price).
 *
 *   pnpm tsx scripts/delete-product.ts --slug=poultry-feeding-and-watering-set                                   # dry run
 *   pnpm tsx scripts/delete-product.ts --slug=poultry-feeding-and-watering-set --redirect-to=poultry-feeder-and-drinker-set --apply
 *
 * What it does:
 *   1. finds the product and prints the URL that is about to disappear;
 *   2. lists every `solutions.products` entry that references it — these MUST be
 *      removed before the delete, because in Postgres the join row has a foreign
 *      key to `products` and Payload would otherwise fail the delete;
 *   3. reports which of the product's media files become unreferenced (it never
 *      deletes media — images are the expensive part to re-create, and an
 *      unreferenced upload is harmless);
 *   4. with --apply: strips the solution references, deletes the product, and
 *      prints the redirects to paste into next.config.ts.
 *
 * ⚠️ Product URLs are `/products/<category>/<subcategory>/<slug>`. Deleting a
 * product removes its URL permanently, so add the printed redirect (pointing at
 * the surviving duplicate with --redirect-to) or the old page 404s.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import type { CollectionSlug } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const args = new Map(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--') && a.includes('='))
    .map((a) => a.replace(/^--/, '').split('=') as [string, string]),
)
const slug = args.get('slug')
const redirectTo = args.get('redirect-to')
const apply = process.argv.includes('--apply')

if (!slug) {
  console.error('usage: --slug=<product-slug> [--redirect-to=<product-slug>] [--apply]')
  process.exit(2)
}

const { default: config } = await import('../src/payload.config.js')
const payload = await getPayload({ config })

const asRecord = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}

const product = (
  await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    locale: 'en',
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
).docs[0] as Record<string, unknown> | undefined

if (!product) throw new Error(`product "${slug}" not found`)

const sub = asRecord(product.subcategory)
// depth 1 on the product expands `subcategory` but leaves `subcategory.category`
// as a bare id, so re-read the subcategory one level deeper to get the category slug.
const subFull = asRecord(
  (
    await payload.find({
      collection: 'subcategories',
      where: { id: { equals: sub.id } },
      locale: 'en',
      depth: 1,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0],
)
const cat = asRecord(subFull.category || sub.category)
const catSlug = String(cat.slug || '')
const subSlug = String(sub.slug || '')
const oldPath = `/products/${catSlug}/${subSlug}/${slug}`

const mediaIds = [
  product.seoImage,
  ...(((product.images as unknown[]) || []).map((row) => asRecord(row).image)),
  ...(((product.detailImages as unknown[]) || []).map((row) => asRecord(row).image)),
]
  .map((rel) => (typeof asRecord(rel).id === 'number' ? (asRecord(rel).id as number) : null))
  .filter((id): id is number => id !== null)
const uniqueMediaIds = [...new Set(mediaIds)]

console.log(`product   id=${product.id}  "${product.name}"`)
console.log(`location  ${subSlug} (${catSlug})`)
console.log(`URL       ${oldPath}`)
console.log(`media     ${uniqueMediaIds.length} file(s): ${uniqueMediaIds.join(', ')}`)

// ── Referencing solutions ────────────────────────────────────────────────────
const referencing: Array<{ id: number | string; slug: string; keep: unknown[] }> = []
for (const solution of (
  await payload.find({ collection: 'solutions', locale: 'en', depth: 0, limit: 200, overrideAccess: true })
).docs as Array<Record<string, unknown>>) {
  const ids = (solution.products as unknown[]) || []
  if (ids.some((v) => (typeof v === 'object' && v !== null ? (v as { id: unknown }).id : v) === product.id)) {
    referencing.push({
      id: solution.id as number | string,
      slug: String(solution.slug),
      keep: ids.filter((v) => (typeof v === 'object' && v !== null ? (v as { id: unknown }).id : v) !== product.id),
    })
  }
}
console.log(
  referencing.length > 0
    ? `\nreferenced by ${referencing.length} solution(s) — the entry will be stripped first:`
    : '\nno solution references it',
)
for (const s of referencing) console.log(`  ${s.slug}: ${(s.keep as unknown[]).length} product(s) kept`)

// ── Media that becomes unreferenced ──────────────────────────────────────────
// Walk every document at depth 1; a populated upload is an object carrying both
// `id` and `filename`, which identifies media references without hard-coding
// every field path in the schema.
const scanCollections: CollectionSlug[] = [
  'products',
  'categories',
  'subcategories',
  'caseStudies',
  'blogPosts',
  'videos',
  'downloads',
  // every image shown on the homepage lives here — it is a collection with one
  // document, not a Payload global
  'siteSettings',
]
const liveMedia = new Set<number>()
const walk = (node: unknown): void => {
  if (Array.isArray(node)) {
    node.forEach(walk)
    return
  }
  if (typeof node !== 'object' || node === null) return
  const rec = node as Record<string, unknown>
  if (typeof rec.filename === 'string' && typeof rec.id === 'number') liveMedia.add(rec.id)
  Object.values(rec).forEach(walk)
}
for (const collection of scanCollections) {
  const docs = (
    await payload.find({ collection, locale: 'en', depth: 1, limit: 500, overrideAccess: true })
  ).docs as Array<Record<string, unknown>>
  // The product being deleted still references its own images — skip it, or
  // nothing could ever look orphaned.
  walk(docs.filter((doc) => !(collection === 'products' && doc.id === product.id)))
}
const orphaned = uniqueMediaIds.filter((id) => !liveMedia.has(id))
console.log(
  orphaned.length > 0
    ? `\n${orphaned.length} of its image(s) are used by nothing else — they stay in the media library:\n  ${orphaned.join(', ')}`
    : '\nall of its images are referenced elsewhere and stay in use',
)

if (!apply) {
  console.log('\ndry run — re-run with --apply to delete the product')
  process.exit(0)
}

for (const s of referencing) {
  await payload.update({
    collection: 'solutions',
    id: s.id as never,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
    data: { products: s.keep } as never,
  })
  console.log(`✓ stripped the reference from solution ${s.slug}`)
}

await payload.delete({
  collection: 'products',
  id: product.id as never,
  depth: 0,
  overrideAccess: true,
})
console.log(`✓ deleted product ${slug}`)

const redirectTarget = redirectTo ? oldPath.replace(`/${slug}`, `/${redirectTo}`) : null
if (redirectTarget) {
  const target = (
    await payload.find({
      collection: 'products',
      where: { slug: { equals: redirectTo } },
      locale: 'en',
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]
  if (!target) throw new Error(`--redirect-to "${redirectTo}" does not exist — add the redirect by hand!`)
  console.log(`\nadd to next.config.ts redirects() — product URLs embed the subcategory:`)
  console.log(`  { source: '/:locale${oldPath}', destination: '/:locale${redirectTarget}', permanent: true },`)
} else {
  console.log(`\nno --redirect-to given: ${oldPath} now 404s on every locale.`)
}

const remaining = await payload.find({
  collection: 'products',
  where: { subcategory: { equals: sub.id } },
  locale: 'en',
  depth: 0,
  limit: 500,
  overrideAccess: true,
})
console.log(
  `  ${subSlug} now holds ${remaining.totalDocs} product(s): ${remaining.docs
    .map((d) => (d as { slug?: string }).slug)
    .join(', ')}`,
)
process.exit(0)
