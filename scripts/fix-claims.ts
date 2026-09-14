import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })
  const { docs } = await payload.find({ collection: 'siteSettings', limit: 1 })
  const cur = docs[0] as any
  const galv = (cur.claims && cur.claims.galvanizedLifespan) || '15–20 years (hot-dip galvanized, 60+ µm zinc)'
  // Explicitly set the flags to false so Local API does not shallow-merge the old true.
  await payload.update({
    collection: 'siteSettings',
    id: cur.id,
    data: { claims: { iso9001: false, ceMarked: false, galvanizedLifespan: galv } },
  })
  const after = await payload.find({ collection: 'siteSettings', limit: 1 })
  console.log('claims after revert:', JSON.stringify((after.docs[0] as any).claims))
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
