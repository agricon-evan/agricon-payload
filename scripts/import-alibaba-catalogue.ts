/**
 * Import the Alibaba catalogue into the site.
 *
 * Reads the scraped data under `docs/scrape/` and rebuilds the whole product
 * taxonomy — categories, subcategories, media and products — in whatever
 * database `DATABASE_URI` points at. Safe to run against local SQLite or a
 * production Postgres (Neon) instance.
 *
 *   # local (default from .env)
 *   pnpm tsx scripts/import-alibaba-catalogue.ts
 *
 *   # production
 *   DATABASE_URI='postgresql://…' pnpm tsx scripts/import-alibaba-catalogue.ts
 *
 * ⚠️  Destructive: clears every existing category, subcategory and product
 *     before importing. Back up first.
 *
 * Flags:
 *   --keep-taxonomy   don't delete existing categories/subcategories
 *   --skip-media      reuse already-uploaded media (matched by product index)
 *   --dry-run         parse and report, write nothing
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const SCRAPE = path.join(ROOT, 'docs/scrape')
const TAXONOMY = path.join(SCRAPE, 'taxonomy-78sub-2026-09-17.json')
const PRODUCTS = path.join(SCRAPE, 'alibaba-products-2026-09-16.jsonl')
const DETAILS = path.join(SCRAPE, 'alibaba-details-2026-09-17.jsonl')
const RICH = path.join(SCRAPE, 'alibaba-rich-2026-09-17.jsonl')
const JSONLD = path.join(SCRAPE, 'alibaba-jsonld-verify-2026-09-17.jsonl')
const IMG_DIR = path.join(ROOT, '.cache/alibaba-images')
const DETAIL_IMG_DIR = path.join(ROOT, '.cache/alibaba-detail-images')
const CAT_DIR = path.join(ROOT, 'public/catalog/categories')
const SUB_DIR = path.join(ROOT, 'public/catalog/products')

/** new category slug -> old catalog image basename */
const CATEGORY_IMG: Record<string, string> = {
  'poultry-equipment': 'poultry-equipment',
  'livestock-equipment': 'livestock-equipment',
  'aquaculture-equipment': 'aquaculture-equipment',
  'agriculture-machinery': 'agriculture-machinery',
  'breeding-coop-equipment': 'breeding-house-equipment',
  'slaughter-equipment': 'slaughter-equipment',
  'farming-tools': 'farming-tools',
  'farming-vehicle': 'farming-vehicles',
  'wire-mesh': 'wire-mesh-fencing',
  'other-machine': 'other-machines',
}

/** new subcategory slug -> old catalog image basename (see src/lib/images.ts) */
const SUBCATEGORY_IMG: Record<string, string> = {
  'layer-cage': 'layer-cage', 'broiler-cage': 'broiler-cage', 'chick-cage': 'chick-cage',
  'automatic-cage': 'automatic-cage', 'hatcher-equipment': 'hatcher-equipment',
  'flat-breeding-equipment': 'floor-rearing-equipment', 'cage-accessory': 'cage-accessories',
  'breeding-accessory': 'breeding-accessories', 'farm-fence': 'farm-fence',
  'cattle-panels': 'cattle-panels', 'livestock-scale': 'livestock-scale', 'farrow-pen': 'farrow-pen',
  'goat-pen': 'goat-pen', 'rabbit-cage': 'rabbit-cage', 'livestock-accessory': 'livestock-accessories',
  'water-pump': 'water-pump', oxygenerator: 'aerator', 'fish-pound': 'fish-pond',
  'float-pound': 'floating-cage', 'fish-net': 'fish-net', 'aquaculture-accessory': 'aquaculture-accessories',
  'pellet-machine': 'pellet-machine', 'extruder-machine': 'extruder-machine',
  'grinding-machine': 'grinding-machine', 'grass-chaff-machine': 'grass-chaff-machine',
  'mixing-machine': 'mixing-machine', 'drying-machine': 'drying-machine',
  'rice-mill-machine': 'rice-mill-machine', 'production-line': 'production-line',
  'machine-accessory': 'production-line', 'screw-elevator': 'screw-conveyor',
  'multifunctional-thresher': 'threshing-machine', 'peanut-sheller': 'peanut-sheller',
  'corn-peeler': 'threshing-machine', 'corn-peeler-thresher': 'threshing-machine',
  'corn-thresher': 'threshing-machine', 'vibrating-screen': 'production-line',
  'metal-structure': 'metal-structure', 'green-house': 'greenhouse', 'exhaust-fans': 'exhaust-fan',
  'cooling-pad': 'cooling-pad', 'floor-pallet': 'slatted-floor', 'manure-scraper': 'manure-scraper',
  'feed-silo': 'feed-silo', 'environment-controller': 'environment-controller',
  'disinfection-equipment': 'disinfection-equipment', 'off-grid-solar': 'metal-structure',
  'coop-accessory': 'floor-rearing-equipment', 'plucker-machine': 'plucker-machine',
  'scalding-machine': 'scalding-machine', 'bleed-cone': 'bleeding-cone',
  'cutting-machine': 'cutting-machine', 'working-table': 'working-table',
  'automatic-machine': 'automatic-processing-machine', 'slaughter-accessory': 'working-table',
  planter: 'planter', 'weed-cutter': 'weed-cutter', sprayer: 'sprayer', 'mist-maker': 'mist-maker',
  'irrigation-equipment': 'irrigation-equipment', 'packing-bag': 'packing-bag',
  'transport-crate': 'transport-crate', tractor: 'tractor', harvester: 'harvester',
  tricycle: 'tricycle', 'walking-tractor': 'walking-tractor', 'tractor-parts': 'tractor',
  'vehicle-accessory': 'tricycle', 'welded-wire-mesh': 'welded-wire-mesh',
  'cattle-fence': 'cattle-fence', 'chain-link-fence': 'chain-link-fence',
  'hexagonal-mesh': 'hexagonal-wire-mesh', 'cage-mesh': 'cage-mesh',
  'egg-tray-machine': 'egg-tray-machine', 'egg-sizing-machine': 'egg-sizing-machine',
  'egg-conveyor-machine': 'egg-conveyor-machine', 'egg-counting-machine': 'egg-counting-machine',
  'brick-making-machine': 'brick-making-machine',
}

function resolveFile(dir: string, baseName: string): string | null {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const p = path.join(dir, baseName + ext)
    if (fs.existsSync(p)) return p
  }
  return null
}

const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry-run')
const KEEP_TAXONOMY = args.has('--keep-taxonomy')
const SKIP_MEDIA = args.has('--skip-media')

const readJsonl = (p: string) =>
  fs
    .readFileSync(p, 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l))

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Alibaba titles are keyword-stuffed; trim to something a human would read. */
function cleanName(raw: string, group: string): string {
  let t = (raw || '').trim()
  t = t.replace(/^(Agricon|New|2026|2025|Used|Hot Selling|Hot Sale|Wholesale|Factory)\s+/gi, '')
  t = t.replace(/\bAgricon\b/gi, '').replace(/\s+/g, ' ').trim()
  if (t.length > 62) {
    const cut = t.slice(0, 62)
    const sp = cut.lastIndexOf(' ')
    t = (sp > 34 ? cut.slice(0, sp) : cut).trim()
  }
  return t || group
}

/**
 * Some products have no supplier description block at all. What gets captured instead is
 * Alibaba's cross-sell widget — "Frequently bought together" followed by OTHER products'
 * titles and prices. That must never be shown as this product's description.
 */
function isCrossSellJunk(raw: string): boolean {
  const head = (raw || '').slice(0, 400)
  return /Frequently bought together|Video Description|You may also like/i.test(head)
}

/** First sentence-ish of the supplier blurb, for the product header. Null when unusable. */
function shortDesc(raw: string, fallback: string): string | null {
  if (!raw || isCrossSellJunk(raw)) return null
  const t = raw
    .replace(/\s+/g, ' ')
    // strip the supplier's section labels, which otherwise leak into the header
    .replace(/^(Report abuse|Highlights at a glance|Highlights|Product Description)\s*/gi, '')
    .trim()
  if (!t) return null
  const cut = t.slice(0, 260)
  const end = cut.lastIndexOf('. ')
  return (end > 80 ? cut.slice(0, end + 1) : cut).trim() || null
}

/**
 * The supplier blurb is one long run of text with inline "Heading: body" labels.
 * Deliberately NOT anchored to a preceding sentence end — the next label often
 * follows a word with no period, which drops most of the headings if you require one.
 */
function toOverviewHtml(raw: string): string {
  let t = (raw || '').trim()
  t = t.replace(/^Report abuse\s*/i, '').replace(/^Highlights at a glance\s*/i, '')
  t = t.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
  if (!t) return ''

  const re = /([A-Z][^:.!?\n]{3,70}?):\s+/g
  const marks: Array<{ at: number; len: number; title: string }> = []
  let m: RegExpExecArray | null
  while ((m = re.exec(t))) marks.push({ at: m.index, len: m[0].length, title: m[1].trim() })

  if (marks.length < 2) return `<p>${esc(t)}</p>`

  const out: string[] = []
  for (let i = 0; i < marks.length; i++) {
    const body = t.slice(marks[i].at + marks[i].len, i + 1 < marks.length ? marks[i + 1].at : t.length).trim()
    out.push(`<h3>${esc(marks[i].title)}</h3>`)
    if (body) out.push(`<p>${esc(body)}</p>`)
  }
  return out.join('\n')
}

async function downloadImages(urls: string[], dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  const CONC = 8
  let ok = 0
  let fail = 0

  const one = async (url: string) => {
    const ext = (url.match(/\.(jpg|jpeg|png|webp)$/i) || [, 'jpg'])[1].toLowerCase()
    const name = slugify(url.split('/').pop() || 'img').slice(0, 60) + '.' + ext
    const file = path.join(dest, name)
    if (fs.existsSync(file) && fs.statSync(file).size > 1000) {
      ok++
      return file
    }
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.alibaba.com/' },
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 1000) throw new Error('too small')
      fs.writeFileSync(file, buf)
      ok++
      return file
    } catch {
      fail++
      return null
    }
  }

  const files: Array<string | null> = []
  for (let i = 0; i < urls.length; i += CONC) {
    files.push(...(await Promise.all(urls.slice(i, i + CONC).map(one))))
  }
  return { files, ok, fail }
}

async function main() {
  const tax = JSON.parse(fs.readFileSync(TAXONOMY, 'utf8'))
  const rows = readJsonl(PRODUCTS)
  const details = readJsonl(DETAILS)
  const detailByIdx = new Map<number, string>(details.map((d: any) => [d.idx, d.desc]))
  const richRows = fs.existsSync(RICH) ? readJsonl(RICH) : []
  const richByIdx = new Map<number, any>(richRows.map((d: any) => [d.idx, d]))

  // Video posters live in the detail block alongside the still images and must not be
  // imported as photos. Collected during the verification pass.
  const baseName = (u: string) => (u || '').split('/').pop()?.split('?')[0] || ''
  const postersByIdx = new Map<number, Set<string>>()
  if (fs.existsSync(JSONLD)) {
    for (const r of readJsonl(JSONLD) as any[]) {
      if (r.videoPosters?.length) postersByIdx.set(r.idx, new Set(r.videoPosters.map(baseName)))
    }
  }

  console.log(`taxonomy: ${tax.categories.length} categories`)
  console.log(`products: ${rows.length} · details: ${details.length}`)

  const g2s: Record<string, string> = {}
  for (const c of tax.categories) for (const s of c.subcategories) for (const g of s.groups || []) g2s[g] = s.slug

  const missing = rows.filter((r: any) => !g2s[r.group])
  if (missing.length) {
    console.error('❌ unmapped groups:', [...new Set(missing.map((r: any) => r.group))].join(' | '))
    process.exit(1)
  }

  if (DRY) {
    console.log('\n--dry-run: would clear products/subcategories/categories, then create:')
    console.log(`   ${tax.categories.length} categories`)
    console.log(`   ${tax.categories.reduce((a: number, c: any) => a + c.subcategories.length, 0)} subcategories`)
    console.log(`   ${rows.reduce((a: number, r: any) => a + (r.images || []).length, 0)} media`)
    console.log(`   ${rows.length} products`)
    process.exit(0)
  }

  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  // ── clear ───────────────────────────────────────────────────────────────────
  for (const collection of ['products', 'subcategories', 'categories'] as const) {
    if (KEEP_TAXONOMY && collection !== 'products') continue
    for (let guard = 0; guard < 500; guard++) {
      const { docs } = await payload.find({ collection, limit: 100, depth: 0 })
      if (!docs.length) break
      for (const d of docs) await payload.delete({ collection, id: d.id })
    }
    console.log(`  cleared ${collection}`)
  }

  // ── taxonomy ────────────────────────────────────────────────────────────────
  const catIds: Record<string, number> = {}
  const subIds: Record<string, number> = {}
  let order = 0
  for (const c of tax.categories) {
    const doc = await payload.create({
      collection: 'categories',
      data: { name: c.name, slug: c.slug, description: c.desc, sortOrder: order++ },
    })
    catIds[c.slug] = doc.id as number
  }
  order = 0
  for (const c of tax.categories) {
    for (const s of c.subcategories) {
      const doc = await payload.create({
        collection: 'subcategories',
        data: { category: catIds[c.slug], name: s.name, slug: s.slug, sortOrder: order++ },
      })
      subIds[s.slug] = doc.id as number
    }
  }
  console.log(`  + ${Object.keys(catIds).length} cat · ${Object.keys(subIds).length} sub`)

  // ── media ───────────────────────────────────────────────────────────────────
  const mediaByKey: Record<string, number> = {}
  if (!SKIP_MEDIA) {
    const allUrls = rows.flatMap((r: any) => r.images || [])
    console.log(`  downloading ${allUrls.length} images…`)
    const { files, ok, fail } = await downloadImages(allUrls, IMG_DIR)
    console.log(`  downloaded ok ${ok} · fail ${fail}`)

    let i = 0
    for (const r of rows) {
      for (let ii = 0; ii < (r.images || []).length; ii++) {
        const f = files[i++]
        if (!f) continue
        try {
          const doc = await payload.create({
            collection: 'media',
            data: { alt: cleanName(r.name, r.group) },
            filePath: f,
          })
          mediaByKey[`${r.idx}-${ii}`] = doc.id as number
        } catch (e: any) {
          console.log('  media FAIL', f, String(e.message).slice(0, 60))
        }
      }
    }
    console.log(`  media created: ${Object.keys(mediaByKey).length}`)
  }

  // ── detail images (long-form A+ content) ────────────────────────────────────
  const detailMediaByUrl = new Map<string, number>()
  if (!SKIP_MEDIA && richRows.length) {
    const detailUrls: string[] = [...new Set(richRows.flatMap((r: any) => r.detail || []))] as string[]
    console.log(`  downloading ${detailUrls.length} detail images…`)
    const { files: dFiles, ok: dOk, fail: dFail } = await downloadImages(detailUrls, DETAIL_IMG_DIR)
    console.log(`  detail downloaded ok ${dOk} · fail ${dFail}`)

    let di = 0
    for (const url of detailUrls) {
      const f = dFiles[di++]
      if (!f) continue
      try {
        const doc = await payload.create({
          collection: 'media',
          data: { alt: 'Product detail image' },
          filePath: f,
        })
        detailMediaByUrl.set(url, doc.id as number)
      } catch (e: any) {
        console.log('  detail media FAIL', path.basename(f), String(e.message).slice(0, 60))
      }
    }
    console.log(`  detail media created: ${detailMediaByUrl.size}`)
  }

  // ── products ────────────────────────────────────────────────────────────────
  const used = new Set<string>()
  let created = 0
  for (const r of rows) {
    const name = cleanName(r.name, r.group)
    let slug = slugify(name) || 'product'
    while (used.has(slug)) slug += '-2'
    used.add(slug)

    const images = (r.images || [])
      .map((_: string, ii: number) => mediaByKey[`${r.idx}-${ii}`])
      .filter(Boolean)
      .map((id: number) => ({ image: id, alt: name }))

    const specs = (r.specs || []).map((s: any) => ({ label: s.label, value: s.value }))
    const features = [
      { feature: `Product line: ${r.group}` },
      ...specs.slice(0, 5).map((s: any) => ({ feature: `${s.label}: ${s.value}`.slice(0, 160) })),
    ]

    // Tiered pricing ("$110 10-89 sets …") becomes spec rows so the ladder is visible.
    const rich = richByIdx.get(r.idx) as any
    const tiers: Array<{ amount: number; qty: string }> = rich?.tiers || []
    const tierSpecs = tiers.map((t) => ({
      label: t.qty ? `Price (${t.qty} sets)` : 'Price',
      value: `US$${t.amount}`,
    }))
    const mergedSpecs = tierSpecs.length
      ? [...specs.filter((s: any) => !/^price/i.test(s.label || '')), ...tierSpecs]
      : specs

    const faqs = (rich?.faqs || []).map((f: any) => ({ question: f.question, answer: f.answer }))

    // Some products have no "Minimum order quantity" line — their entry point is the
    // lowest tier of the ladder, so derive it. Take the FIRST number in the qty string:
    // concatenating all digits turns "10-89" into 1089 and picks the wrong tier.
    let moq = rich?.moq || r.moq || ''
    if (!moq && tiers.length) {
      const entry = tiers
        .map((t) => {
          const m = String(t.qty).match(/([\d,]+)/)
          return { qty: t.qty, n: m ? parseInt(m[1].replace(/,/g, ''), 10) : NaN }
        })
        .filter((t) => Number.isFinite(t.n))
        .sort((a, b) => a.n - b.n)[0]
      if (entry) {
        const m = String(entry.qty).match(/([\d,]+)\s*([a-zA-Z]*)/)
        if (m) moq = `${m[1].replace(/,/g, '')} ${(m[2] || 'units').toLowerCase()}`
      }
    }

    const banned = postersByIdx.get(r.idx)
    const detailImages = (rich?.detail || [])
      .filter((u: string) => !banned?.has(baseName(u)))
      .map((u: string) => detailMediaByUrl.get(u))
      .filter(Boolean)
      .map((id: number) => ({ image: id, alt: name }))

    try {
      await payload.create({
        collection: 'products',
        data: {
          name,
          slug,
          subcategory: subIds[g2s[r.group]],
          description: shortDesc(r.description, name) || undefined,
          overviewHtml: detailByIdx.get(r.idx) && !isCrossSellJunk(detailByIdx.get(r.idx) as string)
            ? toOverviewHtml(detailByIdx.get(r.idx) as string) || undefined
            : undefined,
          price: rich?.price || undefined,
          moq: moq || undefined,
          specs: mergedSpecs,
          features,
          faqs: faqs.length ? faqs : undefined,
          images,
          detailImages: detailImages.length ? detailImages : undefined,
          tags: [{ tag: r.group }],
          sortOrder: r.idx,
        },
      })
      created++
    } catch (e: any) {
      console.log('  product FAIL', slug, String(e.message).slice(0, 100))
    }
  }

  // ── covers ──────────────────────────────────────────────────────────────────
  // Prefer the purpose-made catalog image (public/catalog/*); fall back to the first
  // product photo. Categories with no products at all still get a proper cover this way.
  const coverCache: Record<string, number> = {}
  const coverFromCatalog = async (dir: string, baseName: string, alt: string): Promise<number | null> => {
    const file = resolveFile(dir, baseName)
    if (!file) return null
    if (coverCache[file]) return coverCache[file]
    try {
      const doc = await payload.create({ collection: 'media', data: { alt }, filePath: file })
      coverCache[file] = doc.id as number
      return doc.id as number
    } catch {
      return null
    }
  }

  const { docs: cats } = await payload.find({ collection: 'categories', limit: 100, depth: 0 })
  let catCovers = 0
  let subCovers = 0

  for (const c of cats) {
    const { docs: subs } = await payload.find({
      collection: 'subcategories',
      where: { category: { equals: c.id } },
      limit: 200,
      depth: 0,
    })

    let cover: number | null = await coverFromCatalog(CAT_DIR, CATEGORY_IMG[c.slug as string] || '', c.name as string)

    for (const s of subs) {
      let subCover = await coverFromCatalog(SUB_DIR, SUBCATEGORY_IMG[s.slug as string] || '', s.name as string)

      if (!subCover) {
        const { docs: prods } = await payload.find({
          collection: 'products',
          where: { subcategory: { equals: s.id } },
          limit: 1,
          depth: 1,
          sort: 'sortOrder',
        })
        const img = (prods[0]?.images as any[])?.[0]?.image
        const id = typeof img === 'object' && img ? img.id : img
        subCover = (id as number) || null
      }

      if (subCover) {
        await payload.update({ collection: 'subcategories', id: s.id, data: { image: subCover } })
        subCovers++
        if (!cover) cover = subCover
      }
    }

    if (cover) {
      await payload.update({ collection: 'categories', id: c.id, data: { image: cover } })
      catCovers++
    }
  }
  console.log(`  covers: ${catCovers} categories · ${subCovers} subcategories`)

  const counts = {
    categories: (await payload.count({ collection: 'categories' })).totalDocs,
    subcategories: (await payload.count({ collection: 'subcategories' })).totalDocs,
    products: (await payload.count({ collection: 'products' })).totalDocs,
    media: (await payload.count({ collection: 'media' })).totalDocs,
  }
  console.log(`\ndone. products ${created}/${rows.length}`)
  console.log('final:', JSON.stringify(counts))
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
