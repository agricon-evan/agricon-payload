/**
 * Additively import the client's curated link list (D:/链接.txt, 53 products)
 * from `docs/scrape/alibaba-links-2026-09-18.jsonl`, using the per-SKU
 * subcategory + model-level name from `docs/scrape/import-names-2026-09-18.json`.
 *
 *   pnpm tsx scripts/import-links.ts            # dry run: report what would change
 *   pnpm tsx scripts/import-links.ts --apply
 *
 * Unlike `import-alibaba-catalogue.ts` this NEVER clears anything:
 *   • a SKU already on the site (matched by its `alibaba-<sku>` tag) is renamed
 *     and moved to the mapped subcategory;
 *   • a SKU that is missing is created with its images, price, MOQ and SEO title.
 * Re-running is safe and only reports "no change" for finished rows.
 *
 * Names come from the mapping file, not from the Alibaba title: those are
 * keyword-stuffed ("… Galvanized Steel Square Opening Garden Fence Panel Farm
 * Boundary Livestock Barrier Metal - Buy Product on Alibaba.com") and the client
 * asked for model-level names.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import type { CollectionSlug } from 'payload'

import { locales } from '../src/i18n/config.js'
import { describeFromSpecs, stripSupplierBoilerplate, summarizeCopy } from '../src/lib/supplier-text.js'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const APPLY = process.argv.includes('--apply')
const MAP_FILE = 'docs/scrape/import-names-2026-09-18.json'
const SCRAPE_FILE = 'docs/scrape/alibaba-links-2026-09-18.jsonl'
const DETAILS_FILE = 'docs/scrape/alibaba-details-2026-09-18.jsonl'
const IMG_DIR = process.env.TEMP ? path.join(process.env.TEMP, 'agricon-link-images') : 'tmp-link-images'
const IMAGES_PER_PRODUCT = 5

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)

type Scraped = {
  sku: string
  name: string
  price: string | null
  images: string[]
  moq: string | null
  supply: string | null
}

const mapping = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) as {
  products: Record<string, [string, string]>
}
const scraped = new Map<string, Scraped>()
for (const line of fs.readFileSync(SCRAPE_FILE, 'utf8').split('\n')) {
  if (!line.trim()) continue
  const row = JSON.parse(line) as Scraped & { ok: boolean }
  if (row.ok) scraped.set(String(row.sku), row)
}

/**
 * Detail pages (`scripts/` sibling scrape) carry the two things the JSON-LD pass
 * cannot: the supplier's long-form description and the "Key attributes" table.
 * 8 of the 53 pages have no description section at all, so those keep their
 * parameters only.
 */
type Detail = { attrs: Array<[string, string]>; descHtml: string | null; descText: string | null }
const details = new Map<string, Detail>()
if (fs.existsSync(DETAILS_FILE)) {
  for (const line of fs.readFileSync(DETAILS_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue
    const row = JSON.parse(line) as { sku: string } & Detail
    if (row.sku) details.set(String(row.sku), row)
  }
}

const { default: config } = await import('../src/payload.config.js')
const payload = await getPayload({ config })

const asRec = (v: unknown): Record<string, any> => (typeof v === 'object' && v !== null ? (v as any) : {})

// ── subcategories ────────────────────────────────────────────────────────────
const needed = [...new Set(Object.values(mapping.products).map(([sub]) => sub))]
const subIds: Record<string, number> = {}
const subNames: Record<string, string> = {}
const missingSubs: string[] = []

for (const slug of needed) {
  const found = await payload.find({
    collection: 'subcategories',
    where: { slug: { equals: slug } },
    locale: 'en',
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs[0]) {
    subIds[slug] = found.docs[0].id as number
    subNames[slug] = String(found.docs[0].name)
  } else {
    missingSubs.push(slug)
  }
}

// Only `vibrating-screen` is expected to be missing: the taxonomy has it under
// agriculture-machinery but the seeded site never created it, so the "Shaking
// screen machine" product had nowhere to go.
const NEW_SUB: Record<string, { name: string; category: string; after: string }> = {
  'vibrating-screen': { name: 'Vibrating Screen', category: 'agriculture-machinery', after: 'threshing-machine' },
}

for (const slug of missingSubs) {
  const spec = NEW_SUB[slug]
  if (!spec) throw new Error(`subcategory "${slug}" does not exist and has no creation rule`)
  const cat = (
    await payload.find({
      collection: 'categories',
      where: { slug: { equals: spec.category } },
      locale: 'en',
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]
  if (!cat) throw new Error(`category "${spec.category}" not found`)
  const siblings = await payload.find({
    collection: 'subcategories',
    where: { category: { equals: cat.id } },
    locale: 'en',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: 'sortOrder',
  })
  const maxOrder = Math.max(0, ...siblings.docs.map((d) => Number((d as any).sortOrder) || 0))

  console.log(`+ create subcategory "${spec.name}" (${slug}) under ${spec.category}`)
  if (!APPLY) {
    subIds[slug] = -1 // placeholder so the dry run can continue
    continue
  }
  const created = await payload.create({
    collection: 'subcategories',
    locale: 'en',
    depth: 0,
    overrideAccess: true,
    data: { name: spec.name, slug, category: cat.id as never, sortOrder: maxOrder + 1 } as never,
  })
  subIds[slug] = created.id as number
  subNames[slug] = spec.name
  // Localized `name` is required in every locale the site renders — copy the English one.
  for (const locale of locales.filter((l) => l !== 'en')) {
    await payload.update({
      collection: 'subcategories',
      id: created.id,
      locale,
      depth: 0,
      overrideAccess: true,
      data: { name: spec.name } as never,
    })
  }
}

// ── existing products (match on the alibaba-<sku> tag) ───────────────────────
const existing = await payload.find({
  collection: 'products',
  locale: 'en',
  depth: 1,
  limit: 500,
  overrideAccess: true,
})
const bySku = new Map<string, Record<string, any>>()
const usedSlugs = new Set<string>()
for (const doc of existing.docs as Array<Record<string, any>>) {
  usedSlugs.add(String(doc.slug))
  for (const t of (doc.tags as Array<{ tag?: string }>) || []) {
    const m = /^alibaba-(.+)$/.exec(String(t?.tag || ''))
    if (m) bySku.set(m[1], doc)
  }
}

const parseMoq = (raw: string | null): string => {
  if (!raw) return ''
  const m = /Min\.?\s*Order\s*([\d,]+)\s*([A-Za-z]+)/i.exec(raw)
  return m ? `${m[1]} ${m[2].toLowerCase()}` : ''
}

/**
 * The scrape only carries Alibaba's JSON-LD, which has no buyer-facing copy, so a
 * product created from it would ship with an empty meta description — the page
 * audit flags those (234 pages: 39 products × 6 locales). This fills the gap with
 * a factual line instead of leaving the tags blank.
 */
const seoDescription = (name: string, subSlug: string): string =>
  `${name} — ${subNames[subSlug] || subSlug} from Agricon. Factory-direct agricultural equipment with export packaging and worldwide shipping.`

/**
 * The scraped description HTML is the supplier's own module, so it carries things
 * that must not reach the site:
 *
 *  • links back to Alibaba's help centre (they show up in the link audit as broken);
 *  • `<img>` tags with no alt text (the image audit flags every one);
 *  • an embedded supplier video served from `play.video.alibaba.com` — the site's
 *    CSP is `default-src 'self'` with no `media-src`, so the player would never
 *    load and would just render a dead box.
 *
 * All three are fixed here, at the door, rather than by a separate cleanup pass.
 */
const cleanOverview = (html: string, name: string): string => {
  const alt = name.replace(/"/g, '')
  return html
    .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, '')
    .replace(/<source\b[^>]*alibaba\.com[^>]*>/gi, '')
    .replace(/<a\b[^>]*href="[^"]*alibaba\.com[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<img\b(?![^>]*\balt=)([^>]*?)\/?>/gi, `<img alt="${alt}"$1/>`)
}

/** True when stored copy still carries something `cleanOverview` would remove. */
const overviewNeedsClean = (html: string): boolean =>
  /alibaba\.com/i.test(html) || /<img(?![^>]*\balt=)/i.test(html)

async function downloadImage(url: string, file: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 2048) return false
    fs.writeFileSync(file, buf)
    return true
  } catch {
    return false
  }
}

// ── import ───────────────────────────────────────────────────────────────────
const plan: string[] = []
let created = 0
const renamed: string[] = []
const unchanged: string[] = []
const failed: string[] = []

for (const [sku, [subSlug, name]] of Object.entries(mapping.products)) {
  const row = scraped.get(sku)
  if (!row) {
    failed.push(`${sku}: not in scrape file`)
    continue
  }
  const subId = subIds[subSlug]
  const found = bySku.get(sku)
  const currentSub = found ? String(asRec(found.subcategory).slug || '') : ''

  if (found) {
    const sameName = String(found.name) === name
    const sameSub = currentSub === subSlug
    const needsSeo = !found.seoDescription
    if (sameName && sameSub && !needsSeo) {
      unchanged.push(name)
      continue
    }
    plan.push(`~ ${name}  (${sameName ? '' : `name: "${found.name}" → "${name}"`}${!sameName && !sameSub ? ' · ' : ''}${sameSub ? '' : `sub: ${currentSub} → ${subSlug}`}${needsSeo ? `${sameName && sameSub ? '' : ' · '}fill seoDescription` : ''})`)
    if (!APPLY) {
      renamed.push(name)
      continue
    }
    for (const locale of locales) {
      const doc = locale === 'en' ? found : await payload.find({
        collection: 'products',
        where: { slug: { equals: found.slug } },
        locale,
        depth: 0,
        limit: 1,
        overrideAccess: true,
      }).then((r) => r.docs[0] as Record<string, any>)
      const oldName = String(doc?.name ?? found.name)
      const oldSeo = typeof doc?.seoTitle === 'string' ? doc.seoTitle : ''
      await payload.update({
        collection: 'products',
        id: found.id,
        locale,
        depth: 0,
        overrideAccess: true,
        data: {
          name,
          subcategory: subId as never,
          seoDescription: seoDescription(name, subSlug),
          ...(oldSeo.startsWith(oldName) ? { seoTitle: name + oldSeo.slice(oldName.length) } : {}),
        } as never,
      })
    }
    renamed.push(name)
    continue
  }

  // new product
  const slug = slugify(name)
  let unique = slug
  let n = 2
  while (usedSlugs.has(unique)) unique = `${slug}-${n++}`
  const price = row.price ? `US$${row.price}` : ''
  const moq = parseMoq(row.moq || row.supply)
  plan.push(`+ ${name}  → ${subSlug}  (${price || 'no price'}${moq ? `, MOQ ${moq}` : ''}, ${(row.images || []).length} img)`)
  if (!APPLY) {
    created++
    usedSlugs.add(unique)
    continue
  }

  const mediaIds: number[] = []
  fs.mkdirSync(IMG_DIR, { recursive: true })
  for (const [i, url] of (row.images || []).slice(0, IMAGES_PER_PRODUCT).entries()) {
    const ext = /\.png(\?|$)/i.test(url) ? 'png' : 'jpg'
    const file = path.join(IMG_DIR, `${unique}-${i + 1}.${ext}`)
    if (!(await downloadImage(url, file))) continue
    const media = await payload.create({
      collection: 'media' as CollectionSlug,
      depth: 0,
      overrideAccess: true,
      data: { alt: name } as never,
      filePath: file,
    })
    mediaIds.push(media.id as number)
  }

  const doc = await payload.create({
    collection: 'products',
    locale: 'en',
    depth: 0,
    overrideAccess: true,
    data: {
      name,
      slug: unique,
      subcategory: subId as never,
      description: row.desc && !/Find Complete Details/i.test(row.desc) ? row.desc : undefined,
      price,
      moq,
      seoTitle: `${name} | Agricon Agricultural Equipment`,
      seoDescription: seoDescription(name, subSlug),
      tags: [{ tag: `alibaba-${sku}` }, { tag: name }],
      images: mediaIds.map((id, i) => ({ image: id, alt: i === 0 ? name : `${name} — view ${i + 1}` })),
      seoImage: mediaIds[0],
    } as never,
  })
  for (const locale of locales.filter((l) => l !== 'en')) {
    await payload.update({
      collection: 'products',
      id: doc.id,
      locale,
      depth: 0,
      overrideAccess: true,
      data: {
        name,
        seoTitle: `${name} | Agricon Agricultural Equipment`,
        seoDescription: seoDescription(name, subSlug),
        ...(row.desc && !/Find Complete Details/i.test(row.desc) ? { description: row.desc } : {}),
      } as never,
    })
  }
  usedSlugs.add(unique)
  created++
}

// ── details pass: parameters + long-form copy ────────────────────────────────
// Only EMPTY fields are written, so re-running never clobbers hand-edited copy.
// English only: `localization.fallback` is true, so the other five locales render
// the English text — the same trade-off the catalogue already makes for
// long-form `overviewHtml`.
let detailed = 0
const detailPlan: string[] = []
if (details.size > 0) {
  const after = await payload.find({
    collection: 'products',
    locale: 'en',
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })
  const current = new Map<string, Record<string, any>>()
  for (const doc of after.docs as Array<Record<string, any>>) {
    for (const t of (doc.tags as Array<{ tag?: string }>) || []) {
      const m = /^alibaba-(.+)$/.exec(String(t?.tag || ''))
      if (m) current.set(m[1], doc)
    }
  }

  for (const [sku, [, name]] of Object.entries(mapping.products)) {
    const d = details.get(sku)
    const product = current.get(sku)
    if (!d || !product) continue

    const hasSpecs = Array.isArray(product.specs) && product.specs.length > 0
    const storedOverview = typeof product.overviewHtml === 'string' ? product.overviewHtml : ''
    const hasOverview = storedOverview.trim().length > 50
    const storedDesc = typeof product.description === 'string' ? product.description : ''
    const hasDesc = storedDesc.trim().length > 0
    const dirtyOverview = hasOverview && overviewNeedsClean(storedOverview)
    // Copy the generator produced is owned by the generator: it may be rewritten
    // when the template improves. Hand-written copy never carries the closing
    // sentence, so it is left alone.
    const generatedDesc = /Send your capacity and site requirements for a matched quotation\.$/.test(storedDesc)
    if (hasSpecs && hasOverview && hasDesc && !dirtyOverview && !generatedDesc) continue

    const html = d.descHtml ? cleanOverview(stripSupplierBoilerplate(d.descHtml), name) : ''
    const text = d.descText ? stripSupplierBoilerplate(d.descText) : ''
    const specRows = d.attrs.slice(0, 30).map(([label, value]) => ({ label, value }))
    // Prefer the supplier's own words; fall back to a sentence built from the
    // parameters when the page has no description module at all.
    const short = text
      ? summarizeCopy(text)
      : describeFromSpecs(hasSpecs ? (product.specs as Array<{ label?: string; value?: string }>) : specRows)

    const data: Record<string, unknown> = {}
    if (!hasSpecs && specRows.length > 0) data.specs = specRows
    if (html.length > 50 && (!hasOverview || dirtyOverview)) data.overviewHtml = html
    if (short && (!hasDesc || (generatedDesc && short !== storedDesc))) data.description = short
    if (Object.keys(data).length === 0) continue

    detailPlan.push(
      `  ${name}: ${[
        data.specs ? `${(data.specs as unknown[]).length} 项参数` : '',
        data.overviewHtml ? (dirtyOverview ? '正文(清洗)' : '正文') : '',
        data.description ? (generatedDesc ? '简介(重算)' : '简介') : '',
      ]
        .filter(Boolean)
        .join(' + ')}`,
    )
    detailed++
    if (!APPLY) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      locale: 'en',
      depth: 0,
      overrideAccess: true,
      data: data as never,
    })
  }
}

console.log(`\n${APPLY ? '已执行' : '预演（dry run）'}：新建 ${created} · 改名/移动 ${renamed.length} · 无变化 ${unchanged.length} · 失败 ${failed.length} · 补详情 ${detailed}\n`)
for (const line of plan) console.log('  ' + line)
if (detailPlan.length) {
  console.log(`\n详情补全（参数表 / 正文 / 简介）：`)
  for (const line of detailPlan) console.log(line)
}
if (unchanged.length && unchanged.length <= 8) console.log(`  无变化: ${unchanged.join(', ')}`)
if (failed.length) console.log(`\n失败:\n  ${failed.join('\n  ')}`)
if (!APPLY) console.log('\n预演完成 —— 加 --apply 才会写库')
process.exit(0)
