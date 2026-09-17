/**
 * Data-quality audit across the imported catalogue.
 * Flags anything a human would want to look at before this goes to production.
 *
 * Read-only — talks to the running dev server's REST API, so start it first:
 *
 *   pnpm dev
 *   pnpm tsx scripts/audit-catalogue.ts
 *
 * Checks names, slugs, prices (format + sanity), MOQ, specs, overview, FAQ,
 * gallery/detail images, category & subcategory covers, and orphaned relations.
 */
const API = 'http://localhost:3000/api'

type Row = Record<string, any>

async function getAll(collection: string, limit = 500): Promise<Row[]> {
  const res = await fetch(`${API}/${collection}?limit=${limit}&depth=1`)
  const json = (await res.json()) as { docs: Row[] }
  return json.docs
}

const products = await getAll('products')
const categories = await getAll('categories')
const subcategories = await getAll('subcategories')

const issues: string[] = []
const flag = (slug: string, msg: string) => issues.push(`${slug}: ${msg}`)

// ── products ──────────────────────────────────────────────────────────────────
const slugs = new Set<string>()
const names = new Map<string, string[]>()

for (const p of products) {
  const slug = p.slug as string
  const name = (p.name || '') as string

  if (slugs.has(slug)) flag(slug, 'duplicate slug')
  slugs.add(slug)

  const n = name.toLowerCase().trim()
  names.set(n, [...(names.get(n) || []), slug])

  if (!name) flag(slug, 'no name')
  if (name.length > 80) flag(slug, `name is ${name.length} chars (long)`)
  if (name.length < 8) flag(slug, `name is only ${name.length} chars`)

  const imgs = (p.images as any[]) || []
  if (imgs.length === 0) flag(slug, 'no gallery images')
  if (imgs.length > 0 && imgs.length < 4) flag(slug, `only ${imgs.length} gallery image(s)`)

  const detail = (p.detailImages as any[]) || []
  const faqs = (p.faqs as any[]) || []
  const specs = (p.specs as any[]) || []

  if (!p.price) flag(slug, 'no price')
  else if (!/^US\$[\d.,]+(-[\d.,]+)?$/.test(p.price)) flag(slug, `odd price format "${p.price}"`)

  if (!p.moq) flag(slug, 'no MOQ')
  if (specs.length === 0) flag(slug, 'no specs')
  if (!p.overviewHtml) flag(slug, 'no overviewHtml')
  if (!p.description) flag(slug, 'no description')

  const desc = (p.description || '') as string
  if (desc.length < 40) flag(slug, `description only ${desc.length} chars`)
  if (desc.length > 320) flag(slug, `description ${desc.length} chars (may be truncated oddly)`)

  // price sanity: lower bound must be <= upper bound
  if (p.price) {
    const m = String(p.price).match(/US\$([\d.]+)(?:-([\d.]+))?/)
    if (m) {
      const lo = parseFloat(m[1])
      const hi = m[2] ? parseFloat(m[2]) : lo
      if (hi < lo) flag(slug, `price inverted: ${p.price}`)
      if (lo === 0) flag(slug, 'price is 0')
    }
  }

  if (!p.subcategory) flag(slug, 'no subcategory')
  else if (typeof p.subcategory === 'object' && !p.subcategory.category) flag(slug, 'subcategory has no category')
}

// duplicate names
for (const [n, list] of names) {
  if (list.length > 1) issues.push(`duplicate name "${n}" on: ${list.join(', ')}`)
}

// ── taxonomy ──────────────────────────────────────────────────────────────────
const catSlugs = new Set<string>()
for (const c of categories) {
  if (catSlugs.has(c.slug)) issues.push(`category duplicate slug ${c.slug}`)
  catSlugs.add(c.slug)
  if (!c.image) issues.push(`category ${c.slug}: no cover image`)
  if (!c.description) issues.push(`category ${c.slug}: no description`)
}

const subSlugs = new Set<string>()
for (const s of subcategories) {
  if (subSlugs.has(s.slug)) issues.push(`subcategory duplicate slug ${s.slug}`)
  subSlugs.add(s.slug)
  if (!s.image) issues.push(`subcategory ${s.slug}: no cover image`)
  if (!s.category) issues.push(`subcategory ${s.slug}: no parent category`)
}

// ── orphan check ──────────────────────────────────────────────────────────────
const subIds = new Set(subcategories.map((s) => s.id))
for (const p of products) {
  const sid = typeof p.subcategory === 'object' ? p.subcategory?.id : p.subcategory
  if (sid && !subIds.has(sid)) issues.push(`product ${p.slug}: points at missing subcategory ${sid}`)
}

// ── report ────────────────────────────────────────────────────────────────────
console.log(`audited: ${products.length} products · ${categories.length} categories · ${subcategories.length} subcategories\n`)

const byKind = new Map<string, number>()
for (const i of issues) {
  const kind = i.split(': ').slice(1).join(': ').replace(/\d+/g, 'N')
  byKind.set(kind, (byKind.get(kind) || 0) + 1)
}

if (!issues.length) {
  console.log('✅ no issues found')
} else {
  console.log(`⚠️  ${issues.length} findings:\n`)
  for (const [kind, count] of [...byKind.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(3)}  ${kind}`)
  }
  console.log('\n--- detail ---')
  issues.slice(0, 40).forEach((i) => console.log('  ' + i))
  if (issues.length > 40) console.log(`  … and ${issues.length - 40} more`)
}

// ── coverage summary ──────────────────────────────────────────────────────────
const withPrice = products.filter((p) => p.price).length
const withFaq = products.filter((p) => (p.faqs || []).length).length
const withDetail = products.filter((p) => (p.detailImages || []).length).length
const withOverview = products.filter((p) => p.overviewHtml).length
const withMoq = products.filter((p) => p.moq).length
const withSpecs = products.filter((p) => (p.specs || []).length).length

console.log('\n--- coverage ---')
console.log(`  price      ${withPrice}/${products.length}`)
console.log(`  moq        ${withMoq}/${products.length}`)
console.log(`  specs      ${withSpecs}/${products.length}`)
console.log(`  overview   ${withOverview}/${products.length}`)
console.log(`  faqs       ${withFaq}/${products.length}`)
console.log(`  detailImgs ${withDetail}/${products.length}`)
