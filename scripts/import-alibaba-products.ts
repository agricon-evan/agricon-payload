import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import type { Product } from '../src/payload-types'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(projectRoot, 'alibaba-extract/data.json')
const imgRoot = path.join(projectRoot, 'alibaba-extract/images')
const detailPublicRoot = path.join(projectRoot, 'public/catalog/alibaba')

interface Extracted {
  id: string
  name: string
  slug: string
  brand?: string | null
  images: string[]
  descriptionImages: string[]
  price?: string | null
  priceText?: string
  moq?: string | null
  attributes: Array<{ label: string; value: string }>
  features: Array<{ title: string; text: string }>
  description: string
  overviewHtml?: string | null
}

// ─────────────────────────────────────────────
// Categorisation: product id -> target subcategory.
// slug = existing subcategory slug (reuse), or a new one to create.
// ─────────────────────────────────────────────
const NEW_SUBCATEGORIES: Record<string, { name: string; slug: string; category: string }> = {
  'gestation-crate': { name: 'Gestation Crate', slug: 'gestation-crate', category: 'livestock-equipment' },
  'transport-crate': { name: 'Transport Crate', slug: 'transport-crate', category: 'poultry-equipment' },
  'quail-cage': { name: 'Quail Cage', slug: 'quail-cage', category: 'poultry-equipment' },
  'screw-conveyor': { name: 'Screw Conveyor', slug: 'screw-conveyor', category: 'agriculture-machinery' },
  'peanut-sheller': { name: 'Peanut Sheller', slug: 'peanut-sheller', category: 'agriculture-machinery' },
  'threshing-machine': { name: 'Threshing Machine', slug: 'threshing-machine', category: 'agriculture-machinery' },
}

const PRODUCT_MAP: Record<string, string> = {
  '1601735269006': 'layer-cage',        // 半套A型蛋鸡笼
  '1601735511012': 'layer-cage',        // A型蛋鸡笼
  '1601742283769': 'hatcher-equipment', // 小型孵化器
  '1601756972145': 'hatcher-equipment', // 小型孵化器
  '1601754884955': 'hatcher-equipment', // 小型孵化器
  '10000041873078': 'hatcher-equipment', // 小型孵化器
  '1601757418932': 'hatcher-equipment', // 小型孵化器
  '1601742626987': 'weed-cutter',       // 侧装式割草机
  '1601751837621': 'hatcher-equipment', // 孵化器
  '1601751166880': 'breeding-accessories', // 雏鸡笼(喂水器/喂料器套件)
  '1601751177645': 'weed-cutter',       // 背负式割草机
  '1601831390615': 'farrow-pen',        // 母猪限位栏
  '1601785643729': 'layer-cage',        // H型蛋鸡笼
  '1601824135974': 'plucker-machine',   // 拔毛机
  '1601817181300': 'cage-accessories',  // 水线料线
  '1601822224721': 'gestation-crate',   // 猪栏 (new)
  '1601809298094': 'transport-crate',   // 运输框 (new)
  '1601809108971': 'cage-accessories',  // 普拉松饮水器
  '1601809649562': 'cage-accessories',  // 饮水杯
  '1601772725186': 'grass-chaff-machine', // 多功能铡草机
  '1601807769415': 'automatic-cage',    // 全自动A型蛋鸡笼
  '1601805391441': 'automatic-cage',    // 全自动H型蛋鸡笼
  '1601792609659': 'mixing-machine',    // 粉碎搅拌机
  '1601790494726': 'broiler-cage',      // 元宝型肉鸡笼
  '1601785797892': 'layer-cage',        // H型蛋鸡笼
  '1601779617450': 'mixing-machine',    // 小型搅拌机
  '1601772737736': 'grinding-machine',  // 锤片式粉碎机
  '1601777865531': 'grass-chaff-machine', // 大型铡草机
  '1601772714963': 'grinding-machine',  // 磨盘式粉碎机
  '1601772613051': 'grass-chaff-machine', // 小型铡草机
  '1601772679282': 'pellet-machine',    // 颗粒机
  '1601914306844': 'broiler-cage',      // 全自动H型肉鸡笼
  '1601914188612': 'livestock-accessories', // 塑料耳标
  '1601739878194': 'breeding-accessories', // 塑料水桶料桶
  '1601838925367': 'rabbit-cage',       // 普通兔笼
  '1601817218337': 'cage-accessories',  // 调压阀
  '1601822934383': 'quail-cage',        // 鹌鹑笼 (new)
  '10000042134456': 'screw-conveyor',   // 绞龙 (new)
  '1601812264735': 'cage-accessories',  // 吊杯
  '1601916761111': 'peanut-sheller',    // 花生脱壳机 (new)
  '1601916516592': 'threshing-machine', // 多功能脱粒机 (new)
  '1601916007401': 'threshing-machine', // 多功能脱粒机 (new)
  '1601916621685': 'threshing-machine', // 多功能脱粒机 (new)
}


const NAME_OVERRIDES: Record<string, string> = {
  '10000041873078': '48-96 Egg Digital Incubator',
  '10000042134456': 'Industrial Screw Conveyor Auger',
  '1601735269006': '48-Bird Half-Set Layer Cage',
  '1601735511012': '128-Bird 4-Tier Layer Cage',
  '1601739878194': 'Poultry Feeder & Drinker Set',
  '1601742283769': '192-Egg Incubator',
  '1601742626987': 'Stainless Steel Bush Cutter',
  '1601751166880': 'Poultry Feeding & Watering Set',
  '1601751177645': 'Backpack Gasoline Brush Cutter',
  '1601751837621': 'Industrial Hatcher Incubator',
  '1601754884955': '24-500 Egg Automatic Incubator',
  '1601756972145': 'Mini Plastic Home Incubator',
  '1601757418932': '64-400 Egg Smart Incubator',
  '1601772613051': 'Small Chaff Cutter 400kg/h',
  '1601772679282': 'AGP-160 Flat Die Pellet Machine',
  '1601772714963': 'Toothed Disc Mill Grinder',
  '1601772725186': '4.8T Multi-Function Chaff Cutter',
  '1601772737736': 'Hammer Mill Grinder',
  '1601777865531': 'Large Chaff Cutter 5T/h',
  '1601779617450': 'Compact Animal Feed Mixer',
  '1601785643729': 'H-Type Layer Cage 96-160 Birds',
  '1601785797892': 'H-Type Layer Cage Battery System',
  '1601790494726': 'H-Frame Broiler Cage',
  '1601792609659': 'Feed Mixing & Grinding Machine',
  '1601805391441': 'H-Frame Automatic Layer Cage',
  '1601807769415': 'A-Type Automatic Layer Cage',
  '1601809108971': 'Plasson Bell Drinker',
  '1601809298094': 'Plastic Poultry Transport Crate',
  '1601809649562': 'Chicken Drinking Bowl',
  '1601812264735': 'Poultry Nipple Drinking Cup',
  '1601817181300': 'Automatic Poultry Feeding Line',
  '1601817218337': 'Poultry Water Pressure Regulator',
  '1601822224721': 'Pig Gestation Crate',
  '1601822934383': 'Automatic Quail Cage',
  '1601824135974': 'Stainless Steel Chicken Plucker',
  '1601831390615': 'Farrowing Crate',
  '1601838925367': 'H-Type Rabbit Cage',
  '1601914188612': 'Plastic Animal Ear Tags',
  '1601914306844': 'Automatic H-Frame Broiler Cage',
  '1601916007401': 'Diesel Threshing Machine 8hp',
  '1601916516592': 'Bean Thresher 200kg/h',
  '1601916621685': 'Corn Peeling & Shelling Machine',
  '1601916761111': 'Electric Peanut Sheller',
}

const SOLUTION_MAP: Record<string, string[]> = {
  'poultry-equipment': ['poultry-farming'],
  'livestock-equipment': ['livestock-farming'],
  'aquaculture-equipment': ['aquaculture'],
  'agriculture-machinery': ['feed-processing', 'farm-machinery'],
  'breeding-house-equipment': ['breeding-house'],
  'slaughter-equipment': ['livestock-farming'],
  'farming-tools': ['farm-machinery'],
  'farming-vehicles': ['farm-machinery'],
  'wire-mesh-fencing': ['livestock-farming'],
  'other-machines': ['farm-machinery'],
}

function cleanName(name: string): string {
  return name
    .replace(/^(New\s+|Hot Selling\s+|Wholesale\s+|Popular\s+)/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(name: string): string {
  return name.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}


function shortDescription(text: string | undefined, fallback: string): string {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return fallback
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g)
  const short = sentences ? sentences.slice(0, 2).join(' ') : cleaned.slice(0, 200)
  return short.length > 240 ? short.slice(0, 240).replace(/\s+\S*$/, '') : short
}

function buildOverviewHtml(product: Extracted, detailFiles: string[], slug: string): string {
  const paras = (product.description || '')
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter((b) => b.length > 20)
  const html: string[] = []
  for (const p of paras) html.push(`<p>${p}</p>`)
  const imgDir = `/catalog/alibaba/${slug}`
  for (const f of detailFiles) {
    html.push(`<p><img src="${imgDir}/${f}" alt="${product.name}" loading="lazy" /></p>`)
  }
  return html.join('\n')
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0
  if (!fs.existsSync(dataPath)) throw new Error(`data.json not found: ${dataPath}`)
  const { products } = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as { products: Extracted[] }
  console.log(`Loading ${products.length} products from Alibaba extraction${limit ? ` (limit ${limit})` : ''}`)

  process.env.PAYLOAD_PUSH_SCHEMA = 'false'
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  // ── create any new subcategories ──
  const subBySlug = new Map<string, { id: number }>()
  const { docs: subs } = await payload.find({ collection: 'subcategories', limit: 100, depth: 0 })
  for (const s of subs) subBySlug.set(s.slug as string, { id: s.id })
  for (const [slug, def] of Object.entries(NEW_SUBCATEGORIES)) {
    if (subBySlug.has(slug)) continue
    const { docs: cats } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: def.category } },
      limit: 1,
      depth: 0,
    })
    if (!cats[0]) throw new Error(`category not found: ${def.category}`)
    const created = await payload.create({
      collection: 'subcategories',
      data: {
        name: def.name,
        slug: def.slug,
        category: cats[0].id,
        description: `${def.name} — agricultural equipment for modern farms.`,
        sortOrder: 100 + subBySlug.size,
      },
      locale: 'en',
    })
    subBySlug.set(def.slug, { id: created.id })
    console.log(`created subcategory: ${def.slug} (cat ${def.category})`)
  }

  const solutionBySlug = new Map<string, number>()
  const { docs: solutions } = await payload.find({ collection: 'solutions', limit: 100, depth: 0 })
  for (const s of solutions) solutionBySlug.set(s.slug as string, s.id)

  // existing slugs to avoid collisions
  const usedSlugs = new Set<string>()
  const existingBySlug = new Map<string, Product>()
  const existingByTag = new Map<string, Product>()
  const { docs: existing } = await payload.find({ collection: 'products', limit: 1000, depth: 1 })
  for (const e of existing) {
    usedSlugs.add(e.slug as string)
    existingBySlug.set(e.slug as string, e)
    for (const t of e.tags || []) {
      const tag = typeof t === 'object' ? t.tag : t
      if (typeof tag === 'string' && tag.startsWith('alibaba-')) existingByTag.set(tag.slice(8), e)
    }
  }

  let created = 0
  for (const [index, product] of products.entries()) {
    if (limit && index >= limit) break
    const targetSlug = PRODUCT_MAP[product.id]
    if (!targetSlug) {
      console.warn(`!! no mapping for ${product.id} (${product.name})`)
      continue
    }
    const sub = subBySlug.get(targetSlug)
    if (!sub) {
      console.warn(`!! subcategory not found: ${targetSlug} for ${product.id}`)
      continue
    }

    const name = NAME_OVERRIDES[product.id] || cleanName(product.name)
    let slug = slugify(name).slice(0, 90)
    if (!slug) slug = `product-${product.id}`
    // reuse the existing product when the canonical slug is already taken by itself
    let prev = existingByTag.get(product.id) || existingBySlug.get(slug) || null
    if (!prev && usedSlugs.has(slug)) {
      slug = `${slug}-${product.id}`
      prev = existingByTag.get(product.id) || existingBySlug.get(slug) || null
    }
    usedSlugs.add(slug)

    // ── media: idempotent — reuse existing product images if present ──
    let images: Array<{ image: number; alt: string }> = []
    let seoImage: number | null = null
    if (prev && (prev.images || []).length > 0) {
      images = (prev.images || []).map((im) => {
        const img = im.image
        return {
          image: typeof img === 'object' && img ? img.id : (img as number),
          alt: im.alt || name,
        }
      })
      seoImage = typeof prev.seoImage === 'object' && prev.seoImage
        ? (prev.seoImage.id as number)
        : ((prev.seoImage as number | null) ?? null)
    } else {
      // ── upload gallery images to media ──
      const galDir = path.join(imgRoot, product.id, 'gallery')
      const galleryFiles = fs.existsSync(galDir)
        ? fs.readdirSync(galDir).sort().slice(0, 8)
        : []
      for (const f of galleryFiles) {
        const abs = path.join(galDir, f)
        const data = fs.readFileSync(abs)
        const mime = f.endsWith('.png') ? 'image/png' : 'image/jpeg'
        const media = await payload.create({
          collection: 'media',
          data: { alt: name },
          file: { data, mimetype: mime, name: f, size: data.length },
        })
        images.push({ image: media.id, alt: name })
        if (!seoImage) seoImage = media.id
      }
    }

    // ── copy detail images to public, build local overviewHtml ──
    const detDir = path.join(imgRoot, product.id, 'detail')
    const detFiles = fs.existsSync(detDir) ? fs.readdirSync(detDir).sort() : []
    const detailPublicDir = path.join(detailPublicRoot, slug)
    fs.mkdirSync(detailPublicDir, { recursive: true })
    const detailLocal: string[] = []
    for (const f of detFiles) {
      fs.copyFileSync(path.join(detDir, f), path.join(detailPublicDir, f))
      detailLocal.push(f)
    }
    const overviewHtml = buildOverviewHtml(product, detailLocal, slug)

    // ── specs: dedupe labels, cap 24 ──
    const seenSpecs = new Set<string>()
    const specs = product.attributes
      .filter((a) => a.label && !seenSpecs.has(a.label.toLowerCase()) && seenSpecs.add(a.label.toLowerCase()))
      .slice(0, 24)
      .map((a) => ({ label: a.label, value: a.value }))

    // ── features: selling point titles (short) ──
    const features = product.features.slice(0, 10).map((f) => ({ feature: f.title }))

    // ── SEO ──
    const seoTitle = `${name} | Agricon Agricultural Equipment`
    const seoDescription = shortDescription(product.features[0]?.text || product.description, name).slice(0, 158)
    const keywords = [
      product.brand || 'Agricon',
      targetSlug.replace(/-/g, ' '),
      ...product.attributes.filter((a) => ['model number', 'material', 'capacity', 'type', 'power'].includes(a.label.toLowerCase()))
        .map((a) => a.value),
    ].filter(Boolean).slice(0, 12).join(', ')

    // ── solutions mapping (by category) ──
    const newCatFor = Object.values(NEW_SUBCATEGORIES).find((d) => d.slug === targetSlug)?.category
    const { docs: subDoc } = await payload.find({
      collection: 'subcategories',
      where: { slug: { equals: targetSlug } },
      limit: 1,
      depth: 1,
    })
    const subCat = subDoc[0]?.category
    const catSlug = (typeof subCat === 'object' && subCat ? (subCat.slug as string) : '') || newCatFor || ''
    const solutions = (SOLUTION_MAP[catSlug] || [])
      .map((s) => solutionBySlug.get(s))
      .filter(Boolean) as number[]

    const data = {
      subcategory: sub.id,
      solutions,
      name,
      slug,
      description: shortDescription(product.features[0]?.text || product.description, 'Reliable agricultural equipment matched to your farm type, capacity and operating requirements.'),
      price: product.price || undefined,
      moq: product.moq || undefined,
      tags: [name, targetSlug.replace(/-/g, ' '), product.brand || 'Agricon', `alibaba-${product.id}`]
        .map((tag) => ({ tag }))
        .slice(0, 6),
      specs,
      images,
      overviewHtml,
      features,
      featured: index < 8,
      sortOrder: index + 1,
      seoTitle,
      seoDescription,
      seoKeywords: keywords,
      ...(seoImage ? { seoImage } : {}),
    }

    const existingDoc = prev
    if (existingDoc) {
      await payload.update({ collection: 'products', id: existingDoc.id, data, locale: 'en' })
    } else {
      await payload.create({ collection: 'products', data, locale: 'en' })
    }
    created += 1
    console.log(`[${index + 1}/${products.length}] ${slug} -> ${targetSlug} (imgs ${images.length})`)
  }

  console.log(`\nImport complete: ${created}/${products.length} products created/updated`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
