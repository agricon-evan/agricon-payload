import 'dotenv/config'
import { getPayloadClient } from '../src/lib/payload'

const payload = await getPayloadClient()
const slug = 'fish-farm-equipment'
const existing = await payload.find({ collection: 'caseStudies', where: { slug: { equals: slug } }, limit: 1, locale: 'en' })

if (existing.docs[0]) {
  console.log(`Case already exists: ${slug}`)
} else {
  await payload.create({
    collection: 'caseStudies',
    locale: 'en',
    data: {
      title: 'Fish Farm Equipment Package',
      slug,
      subtitle: 'Flexible equipment support for small and medium fish farming operations.',
      summary: 'A Southeast Asia aquaculture package combining water circulation, oxygen support, cage and net equipment.',
      location: 'Southeast Asia',
      equipment: 'Water pump, aerator, fish net, floating cage and basic support products.',
      application: 'Flexible equipment package for small and medium fish farming operations.',
      farmName: 'Aquaculture Equipment Package',
      keyResult: 'Water circulation, oxygen support and flexible cage equipment supplied through one coordinated package.',
      published: true,
      sortOrder: 9,
    },
  })
  console.log(`Created case: ${slug}`)
}

process.exit(0)
