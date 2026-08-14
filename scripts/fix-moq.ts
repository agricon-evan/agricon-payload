import 'dotenv/config'
import { getPayload } from 'payload'

const MOQ_FIXES: Record<string, string> = {
  '128-capacity-4-tier-4-doors-layer-cage-for-chicken-farm-automatic-egg-collecting': '10 sets',
  'h-type-layer-cage-for-chicken-poultry-farm-battery-cage-system-automatic-feeding-drinking-': '10 sets',
  'automatic-layer-cage-hot-dipped-galvanized-steel-battery-cage-for-poultry-farm-with-feedin': '10 sets',
  'automatic-chicken-drinking-bowl-gravity-flow-poultry-water-cup-with-valve-for-chicken-duck': '100 units',
  'plastic-animal-ear-tags-livestock-identification-laser-printed-ear-marking-tags-for-cattle': '1,000 units',
}

async function main() {
  process.env.PAYLOAD_PUSH_SCHEMA = 'false'
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  for (const [slug, moq] of Object.entries(MOQ_FIXES)) {
    const { docs } = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    if (!docs[0]) {
      console.warn('not found:', slug)
      continue
    }
    await payload.update({ collection: 'products', id: docs[0].id, data: { moq }, locale: 'en' })
    console.log(`moq set: ${slug.slice(0, 50)}... = ${moq}`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
