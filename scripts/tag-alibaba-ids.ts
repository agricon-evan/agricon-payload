import 'dotenv/config'
import fs from 'node:fs'
import { getPayload } from 'payload'

const cleanName = (name: string) =>
  name.replace(/^(New\s+|Hot Selling\s+|Wholesale\s+|Popular\s+)/i, '').replace(/\s+/g, ' ').trim()
const slugify = (name: string) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

async function main() {
  process.env.PAYLOAD_PUSH_SCHEMA = 'false'
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  const { products } = JSON.parse(fs.readFileSync('alibaba-extract/data.json', 'utf8'))
  const { docs: existing } = await payload.find({ collection: 'products', limit: 1000, depth: 0 })

  const bySlug = new Map(existing.map((p) => [p.slug as string, p]))
  let tagged = 0
  for (const p of products) {
    const oldSlug = slugify(cleanName(p.name)).slice(0, 90)
    const doc = bySlug.get(oldSlug)
    if (!doc) {
      console.warn('no match for', p.id, '->', oldSlug)
      continue
    }
    const tags = (doc.tags || []).map((t) => ({ tag: typeof t === 'object' ? t.tag : t }))
    if (!tags.some((t) => t.tag === `alibaba-${p.id}`)) {
      tags.push({ tag: `alibaba-${p.id}` })
    }
    await payload.update({ collection: 'products', id: doc.id, data: { tags }, locale: 'en' })
    tagged += 1
  }
  console.log(`tagged ${tagged}/${products.length} products`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
