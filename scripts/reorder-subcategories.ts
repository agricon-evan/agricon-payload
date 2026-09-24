/**
 * Set the display order (and optionally rename) the subcategories of one
 * category. The card order on `/products/<category>` follows `sortOrder`, and
 * every subcategory in a freshly seeded database shares `sortOrder: 1`, so the
 * cards come out in an arbitrary order until this runs.
 *
 *   pnpm tsx scripts/reorder-subcategories.ts --category=poultry-equipment \
 *     --order=layer-cage,broiler-cage,chick-cage,quail-cage,automatic-cage,hatcher-equipment,floor-rearing-equipment,cage-accessories,breeding-accessories
 *   ...add --apply to write
 *
 *   pnpm tsx scripts/reorder-subcategories.ts --category=poultry-equipment \
 *     --rename=cage-accessories:"Cage Accessory" --locale=en --apply
 *
 * Subcategories of the category that are NOT listed keep their current
 * sortOrder and are reported, so a newly added one is never silently moved.
 *
 * ⚠️ `import-alibaba-catalogue.ts` rebuilds categories/subcategories from
 * `docs/scrape/taxonomy-*.json` and assigns its own `sortOrder` (and its own
 * names), so re-apply this after a full re-import. The order below is the
 * taxonomy's own order — keep the two in sync.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const raw = process.argv.slice(2)
const flags = raw.filter((a) => a.startsWith('--') && a.includes('='))
const single = new Map(flags.map((a) => a.replace(/^--/, '').split('=') as [string, string]))
const renames = flags
  .filter((a) => a.startsWith('--rename='))
  .map((a) => a.slice('--rename='.length))
  .map((pair) => {
    const at = pair.indexOf(':')
    if (at < 0) throw new Error(`--rename expects slug:"New Name", got "${pair}"`)
    return { slug: pair.slice(0, at), name: pair.slice(at + 1) }
  })
const describes = flags
  .filter((a) => a.startsWith('--describe='))
  .map((a) => a.slice('--describe='.length))
  .map((pair) => {
    const at = pair.indexOf(':')
    if (at < 0) throw new Error(`--describe expects slug:"Card description", got "${pair}"`)
    return { slug: pair.slice(0, at), text: pair.slice(at + 1) }
  })

const categorySlug = single.get('category')
const order = (single.get('order') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const locale = single.get('locale') || 'en'
const apply = raw.includes('--apply')

if (!categorySlug) {
  console.error(
    'usage: --category=<category-slug> [--order=a,b,c] [--rename=slug:Name] [--describe=slug:Text] [--locale=en] [--apply]',
  )
  process.exit(2)
}
if (order.length === 0 && renames.length === 0 && describes.length === 0) {
  console.error('nothing to do: pass --order= and/or --rename= and/or --describe=')
  process.exit(2)
}

const { default: config } = await import('../src/payload.config.js')
const payload = await getPayload({ config })

const category = (
  await payload.find({
    collection: 'categories',
    where: { slug: { equals: categorySlug } },
    locale: 'en',
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0]
if (!category) throw new Error(`category "${categorySlug}" not found`)

const { docs } = await payload.find({
  collection: 'subcategories',
  where: { category: { equals: category.id } },
  locale,
  depth: 0,
  limit: 500,
  overrideAccess: true,
  sort: 'sortOrder',
})
const bySlug = new Map((docs as Array<Record<string, unknown>>).map((d) => [String(d.slug), d]))

for (const slug of [...order, ...renames.map((r) => r.slug), ...describes.map((d) => d.slug)]) {
  if (!bySlug.has(slug)) throw new Error(`subcategory "${slug}" is not in category "${categorySlug}"`)
}

console.log(`category ${categorySlug} · ${docs.length} subcategor(ies) · locale ${locale}\n`)

if (order.length > 0) {
  console.log('current → new order:')
  const currentOrder = (docs as Array<Record<string, unknown>>).map((d) => String(d.slug))
  order.forEach((slug, i) => {
    const position = currentOrder.indexOf(slug)
    console.log(
      `  ${String(i + 1).padStart(2, '0')}  ${slug.padEnd(26)} ${String(bySlug.get(slug)?.name)}` +
        `   (was #${position + 1})`,
    )
  })
  const untouched = currentOrder.filter((s) => !order.includes(s))
  if (untouched.length > 0) {
    console.log(`\n  ⚠️ not listed, keeps its sortOrder and stays after the listed ones: ${untouched.join(', ')}`)
  }
}

if (renames.length > 0) {
  console.log('\nrenames:')
  for (const r of renames) console.log(`  ${r.slug}: "${bySlug.get(r.slug)?.name}" → "${r.name}"`)
}

if (describes.length > 0) {
  console.log('\ndescriptions (card blurb):')
  for (const d of describes) {
    const current = String(bySlug.get(d.slug)?.description || '')
    console.log(`  ${d.slug}\n    was: ${current || '（空）'}\n    new: ${d.text}`)
  }
}

if (!apply) {
  console.log('\ndry run — re-run with --apply to write')
  process.exit(0)
}

for (const [i, slug] of order.entries()) {
  await payload.update({
    collection: 'subcategories',
    id: bySlug.get(slug)?.id as never,
    locale,
    depth: 0,
    overrideAccess: true,
    data: { sortOrder: i + 1 } as never,
  })
}
if (order.length > 0) console.log(`✓ ordered ${order.length} subcategor(ies)`)

for (const r of renames) {
  await payload.update({
    collection: 'subcategories',
    id: bySlug.get(r.slug)?.id as never,
    locale,
    depth: 0,
    overrideAccess: true,
    data: { name: r.name } as never,
  })
  const after = (
    await payload.find({
      collection: 'subcategories',
      where: { slug: { equals: r.slug } },
      locale,
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0] as Record<string, unknown> | undefined
  console.log(`✓ ${r.slug} → "${after?.name}"`)
}

for (const d of describes) {
  await payload.update({
    collection: 'subcategories',
    id: bySlug.get(d.slug)?.id as never,
    locale,
    depth: 0,
    overrideAccess: true,
    data: { description: d.text } as never,
  })
  const after = (
    await payload.find({
      collection: 'subcategories',
      where: { slug: { equals: d.slug } },
      locale,
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0] as Record<string, unknown> | undefined
  const written = String(after?.description || '')
  console.log(written === d.text ? `✓ ${d.slug} 简介: "${written}"` : `✗ ${d.slug} 写入失败: "${written}"`)
}

const after = await payload.find({
  collection: 'subcategories',
  where: { category: { equals: category.id } },
  locale,
  depth: 0,
  limit: 500,
  overrideAccess: true,
  sort: 'sortOrder',
})
console.log(`\n${categorySlug} now renders as:`)
for (const [i, d] of (after.docs as Array<Record<string, unknown>>).entries()) {
  console.log(`  ${String(i + 1).padStart(2, '0')}  ${String(d.slug).padEnd(26)} ${String(d.name)}`)
}
process.exit(0)
