import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const externalCatalogRoot = 'C:/Users/Evan/WorkBuddy/2026-08-10-15-00-06/output/catalog'
const catalogRoot = process.env.CATALOG_DIR || (fs.existsSync(externalCatalogRoot) ? externalCatalogRoot : path.join(projectRoot, 'docs/catalog'))
const catalogPath = path.join(catalogRoot, 'catalog.md')
const assetRoot = path.join(catalogRoot, 'assets')
const outputImageRoot = path.join(projectRoot, 'public/catalog/products')
const outputMapPath = path.join(projectRoot, 'src/lib/catalog-images.ts')

interface ParsedProduct {
  name: string
  slug: string
  description: string
  features: string[]
  sourceImage: string
}

function normalize(value: string) {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}

function parseProducts(markdown: string, subcategories: Array<{ name: string; slug: string }>): ParsedProduct[] {
  const start = markdown.indexOf('<!-- 第 24 页 -->')
  const end = markdown.indexOf('<!-- 第 121 页 -->')
  const productSection = markdown.slice(start >= 0 ? start : 0, end >= 0 ? end : markdown.length)
  const byName = new Map(subcategories.map((sub) => [normalize(sub.name), sub]))
  const aliases: Record<string, string> = {
    'flat breeding equipment': 'floor-rearing-equipment',
    'cage accessory': 'cage-accessories',
    'breeding accessory': 'breeding-accessories',
    'farrowing pen': 'farrow-pen',
  }
  const headings = [...productSection.matchAll(/^## (.+?)\s*$/gm)]
  const products: ParsedProduct[] = []

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index]
    const title = heading[1].trim()
    const subcategory = byName.get(normalize(title)) || subcategories.find((sub) => sub.slug === aliases[normalize(title)])
    if (!subcategory) continue

    const blockStart = heading.index! + heading[0].length
    const blockEnd = headings[index + 1]?.index ?? productSection.length
    const block = productSection.slice(blockStart, blockEnd)
    const images = [...block.matchAll(/!\[.*?\]\((assets\/[^)]+)\)/g)].map((match) => match[1])
    if (images.length === 0) continue

    const beforeAdvantages = block.split('### ADVANTAGES')[0]
      .replace(/!\[.*?\]\(assets\/[^)]+\)/g, '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')

    const advantageBlock = block.split('### ADVANTAGES')[1] || ''
    const features = [...advantageBlock.matchAll(/^-\s+(.+)$/gm)].map((match) => match[1].trim())

    products.push({
      name: subcategory.name,
      slug: subcategory.slug,
      description: beforeAdvantages,
      features,
      sourceImage: images[0].replace(/^assets\//, ''),
    })
  }

  return products
}

async function main() {
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog not found: ${catalogPath}`)
  }

  const markdown = fs.readFileSync(catalogPath, 'utf8')
  process.env.PAYLOAD_PUSH_SCHEMA = 'false'
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })
  const { docs: siteSettings } = await payload.find({ collection: 'siteSettings', limit: 1 })
  if (siteSettings[0]) {
    await payload.update({
      collection: 'siteSettings',
      id: siteSettings[0].id,
      data: {
        siteName: 'AGRICON',
        contactEmail: 'peter@agricon.cn',
        contactPhone: '+86 139 0125 9598',
        whatsappNumber: '+8613901259598',
        stats: {
          countriesServed: '30+',
          farmProjects: '100+',
          yearsInBusiness: '500+',
          onTimeDelivery: '500+',
          equipmentModels: '10+',
        },
        claims: {
          iso9001: false,
          ceMarked: false,
          galvanizedLifespan: null,
        },
      },
    })
  }

  const { docs: subcategories } = await payload.find({
    collection: 'subcategories',
    locale: 'en',
    depth: 1,
    limit: 100,
    sort: 'sortOrder',
  })

  const products = parseProducts(markdown, subcategories.map((sub) => ({ name: sub.name, slug: sub.slug })))
  const { docs: solutions } = await payload.find({ collection: 'solutions', locale: 'en', limit: 100 })
  const solutionBySlug = new Map(solutions.map((solution) => [solution.slug, solution.id]))
  const solutionMap: Record<string, string[]> = {
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
  fs.mkdirSync(outputImageRoot, { recursive: true })

  const imageMap: Record<string, string> = {}
  let created = 0
  let updated = 0

  for (const [index, product] of products.entries()) {
    const subcategory = subcategories.find((sub) => sub.slug === product.slug)
    if (!subcategory) continue

    const sourceImage = path.join(assetRoot, product.sourceImage)
    const destinationName = `${product.slug}.jpg`
    const destinationImage = path.join(outputImageRoot, destinationName)
    if (fs.existsSync(sourceImage)) {
      fs.copyFileSync(sourceImage, destinationImage)
      imageMap[product.slug] = `/catalog/products/${destinationName}`
    } else if (fs.existsSync(destinationImage)) {
      imageMap[product.slug] = `/catalog/products/${destinationName}`
    }

    const data = {
      name: product.name,
      slug: product.slug,
      subcategory: subcategory.id,
      description: product.description,
      features: product.features.map((feature) => ({ feature })),
      tags: [product.name, subcategory.name].map((tag) => ({ tag })),
      featured: index < 10,
      sortOrder: index + 1,
      seoTitle: `${product.name} | Agricon Agricultural Equipment`,
      seoDescription: product.description,
      solutions: (typeof subcategory.category === 'object' && subcategory.category
        ? solutionMap[subcategory.category.slug] || []
        : []).map((slug) => solutionBySlug.get(slug)).filter((id): id is number => typeof id === 'number'),
    }

    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: product.slug } },
      limit: 1,
      locale: 'en',
    })

    if (existing.docs[0]) {
      await payload.update({ collection: 'products', id: existing.docs[0].id, data, locale: 'en' })
      updated += 1
    } else {
      await payload.create({ collection: 'products', data, locale: 'en' })
      created += 1
    }
  }

  const mapSource = `// Generated from the Agricon product catalog.\nexport const catalogProductImages: Record<string, string> = ${JSON.stringify(imageMap, null, 2)}\n`
  fs.writeFileSync(outputMapPath, mapSource)
  console.log(`Catalog import complete: ${products.length} products parsed, ${created} created, ${updated} updated.`)
  console.log(`Product images copied: ${Object.keys(imageMap).length}`)
  await payload.destroy()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
