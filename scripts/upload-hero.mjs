import 'dotenv/config'
import fs from 'node:fs'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const payload = await getPayload({ config: (await import('../src/payload.config')).default })

// find existing by filename
const existing = await payload.find({ collection: 'media', where: { filename: { equals: 'home-hero-agricon.png' } }, limit: 1 })
let mediaId
if (existing.totalDocs > 0) {
  mediaId = existing.docs[0].id
  console.log('media exists:', mediaId)
} else {
  const data = fs.readFileSync('public/images/home-hero-agricon.png')
  const doc = await payload.create({
    collection: 'media',
    data: { alt: 'Agricon farm hero' },
    file: { data, mimetype: 'image/png', name: 'home-hero-agricon.png', size: data.length },
  })
  mediaId = doc.id
  console.log('media uploaded:', mediaId)
}
await payload.update({ collection: 'siteSettings', id: 1, data: { hero: { image: mediaId } } })
console.log('hero image linked:', mediaId)
process.exit(0)
