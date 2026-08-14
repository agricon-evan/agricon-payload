/**
 * Creates blog tags and attaches them to the seeded articles.
 * Idempotent.
 * Usage: pnpm tsx scripts/seed-blog-tags.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const TAGS: Record<string, string[]> = {
  'layer-cage-guide': ['Poultry Equipment', 'Layer Cages'],
  'incubation-guide': ['Breeding', 'Incubators'],
  'feed-mill-guide': ['Feed Processing', 'Farm Machinery'],
}

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })
  const tagIds: Record<string, number> = {}
  const allTags = [...new Set(Object.values(TAGS).flat())]
  for (const name of allTags) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await payload.find({ collection: 'blogTags', where: { slug: { equals: slug } }, limit: 1 })
    if (existing.totalDocs > 0) {
      tagIds[name] = existing.docs[0].id
    } else {
      const doc = await payload.create({ collection: 'blogTags', data: { name, slug } })
      tagIds[name] = doc.id
      console.log(`  tag created: ${name}`)
    }
  }

  for (const [slug, names] of Object.entries(TAGS)) {
    const post = await payload.find({ collection: 'blogPosts', where: { slug: { equals: slug } }, limit: 1 })
    if (post.totalDocs === 0) continue
    const doc = post.docs[0] as { id: number; tags?: Array<number | { id: number }> }
    const existingIds = (doc.tags || []).map((t) => (typeof t === 'object' && t !== null ? t.id : t))
    const newIds = names.map((n) => tagIds[n]).filter((id) => id && !existingIds.includes(id))
    if (newIds.length > 0) {
      await payload.update({ collection: 'blogPosts', id: doc.id, data: { tags: [...existingIds, ...newIds] } })
      console.log(`  post tagged: ${slug} → ${names.join(', ')}`)
    }
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
