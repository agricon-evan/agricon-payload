import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function main() {
  process.env.PAYLOAD_PUSH_SCHEMA = 'false'
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  const { docs: all } = await payload.find({ collection: 'products', limit: 1000, depth: 1 })
  const bySlug = new Map(all.map((p) => [p.slug as string, p]))

  // duplicates: slug ends with '-<alibabaId>' and the base slug exists as another product
  const dupes: Array<{ id: number; slug: string }> = []
  for (const p of all) {
    const slug = p.slug as string
    const m = slug.match(/-(\d{10,14})$/)
    if (m && bySlug.has(slug.replace(`-${m[1]}`, ''))) {
      dupes.push({ id: p.id, slug })
    }
  }
  console.log(`duplicates found: ${dupes.length}`)
  for (const d of dupes) {
    await payload.delete({ collection: 'products', id: d.id })
    console.log('  deleted product', d.id, d.slug.slice(0, 70))
  }

  // orphan media cleanup
  const { docs: allMedia } = await payload.find({ collection: 'media', limit: 1000, depth: 0 })
  const mediaIds = new Set(allMedia.map((m) => m.id))
  const { docs: remaining } = await payload.find({ collection: 'products', limit: 1000, depth: 1 })
  const used = new Set<number>()
  for (const p of remaining) {
    for (const im of p.images || []) {
      const img = im.image
      if (typeof img === 'object' && img) used.add(img.id as number)
    }
    if (p.seoImage && typeof p.seoImage === 'object') used.add(p.seoImage.id as number)
  }
  const orphans = [...mediaIds].filter((id) => !used.has(id))
  console.log(`orphan media to delete: ${orphans.length}`)
  for (const id of orphans) {
    const doc = allMedia.find((m) => m.id === id)
    await payload.delete({ collection: 'media', id })
    if (doc?.filename) {
      const f = path.join(projectRoot, 'media', doc.filename as string)
      if (fs.existsSync(f)) fs.unlinkSync(f)
    }
  }
  console.log('cleanup done')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
