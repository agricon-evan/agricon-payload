/**
 * Creates FAQ categories and assigns the 8 seeded FAQs to them,
 * so the /faq page quick chips are driven by CMS data.
 * Idempotent.
 * Usage: pnpm tsx scripts/seed-faq-categories.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const CATEGORIES: Array<{ name: string; sortOrder: number; questions: string[] }> = [
  { name: 'Ordering & MOQ', sortOrder: 1, questions: ['What is the minimum order quantity (MOQ)?', 'What payment terms do you accept?'] },
  { name: 'Shipping & Export', sortOrder: 2, questions: ['Can you help with shipping and export documentation?'] },
  { name: 'Farm Projects', sortOrder: 3, questions: ['Can you supply a complete farm project, not just single machines?'] },
  { name: 'Quality Control', sortOrder: 4, questions: ['How do you ensure product quality before shipment?'] },
  { name: 'Distributors', sortOrder: 5, questions: ['Do you support distributors and long-term cooperation?'] },
  { name: 'After-sales', sortOrder: 6, questions: ['What about spare parts and after-sales support?', 'Can equipment be customized for my farm?'] },
]

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  // Ensure categories exist
  const created: Record<string, number> = {}
  for (const cat of CATEGORIES) {
    const existing = await payload.find({ collection: 'faqCategories', where: { name: { equals: cat.name } }, limit: 1 })
    if (existing.totalDocs > 0) {
      created[cat.name] = existing.docs[0].id
    } else {
      const doc = await payload.create({ collection: 'faqCategories', data: { name: cat.name, sortOrder: cat.sortOrder } })
      created[cat.name] = doc.id
      console.log(`  category created: ${cat.name}`)
    }
  }

  // Assign FAQs to categories
  for (const cat of CATEGORIES) {
    for (const q of cat.questions) {
      const faq = await payload.find({ collection: 'faqs', where: { question: { equals: q } }, limit: 1 })
      if (faq.totalDocs > 0) {
        const doc = faq.docs[0] as { id: number; category?: number | { id: number } | null }
        if (!doc.category) {
          await payload.update({ collection: 'faqs', id: doc.id, data: { category: created[cat.name] } })
          console.log(`  faq categorized: ${q.slice(0, 30)}… → ${cat.name}`)
        }
      }
    }
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
