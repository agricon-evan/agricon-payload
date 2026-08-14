/**
 * Seeds the CMS with the content that the storefront currently shows via
 * hard-coded fallbacks, so admin edits actually take effect:
 *   - 3 blog posts   (src/lib/blog-fallback.ts   → blogPosts collection)
 *   - 8 FAQ items    (src/app/.../faq/page.tsx   → faqs collection)
 *
 * Idempotent: skips items whose slug / question already exists.
 *
 * Usage: pnpm tsx scripts/seed-fallback-content.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { FALLBACK_ARTICLES } from '../src/lib/blog-fallback'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

// ─────────────────────────────────────────────
// Lexical rich-text helpers (Payload 3 lexical format)
// ─────────────────────────────────────────────
function textNode(text: string) {
  return { type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: [textNode(text)],
    direction: 'ltr',
    textStyle: '',
    textFormat: 0,
  }
}

function heading(text: string) {
  return {
    type: 'heading',
    tag: 'h2',
    format: '',
    indent: 0,
    version: 1,
    children: [textNode(text)],
    direction: 'ltr',
  }
}

function bulletList(items: string[]) {
  return {
    type: 'list',
    tag: 'ul',
    listType: 'bullet',
    format: '',
    indent: 0,
    version: 1,
    children: items.map((item) => ({
      type: 'listitem',
      value: 1,
      format: '',
      indent: 0,
      version: 1,
      children: [textNode(item)],
      direction: 'ltr',
    })),
    direction: 'ltr',
  }
}

function richText(children: SerializedEditorState['root']['children']) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  } as never
}

// ─────────────────────────────────────────────
// FAQ content (mirrors the storefront fallback)
// ─────────────────────────────────────────────
const FAQ_ITEMS: Array<{ question: string; answer: string; sortOrder: number }> = [
  {
    question: 'What is the minimum order quantity (MOQ)?',
    answer:
      'MOQ depends on the product category. For accessories and smaller items, MOQ can be as low as one carton or a single set. For cages, machinery and bulk equipment, MOQ is typically one container or one complete set per model. Contact us with your project details for an exact quote.',
    sortOrder: 1,
  },
  {
    question: 'Can you help with shipping and export documentation?',
    answer:
      'Yes. We provide full export support including export packing, container loading plans, commercial documents (invoice, packing list, bill of lading), certificate of origin and any other documents required by your country. We coordinate shipments from factory preparation to dispatch.',
    sortOrder: 2,
  },
  {
    question: 'What payment terms do you accept?',
    answer:
      'We typically work with T/T (telegraphic transfer) — a deposit to confirm the order and the balance before shipment. For larger projects, L/C at sight or other agreed terms can be arranged. Payment terms are confirmed in the quotation for each order.',
    sortOrder: 3,
  },
  {
    question: 'Can you supply a complete farm project, not just single machines?',
    answer:
      'Yes — this is our core strength. We provide integrated solutions: equipment selection matched to your farm type and capacity, combined supply across multiple categories (poultry, livestock, feed processing, infrastructure), project planning, and export delivery coordination.',
    sortOrder: 4,
  },
  {
    question: 'How do you ensure product quality before shipment?',
    answer:
      'Product scope, specifications and key inspection points are confirmed before shipment. We coordinate production follow-up, packing checks and available inspection records with qualified manufacturing partners. You can request inspection reports and load-testing documentation.',
    sortOrder: 5,
  },
  {
    question: 'Do you support distributors and long-term cooperation?',
    answer:
      'Yes. Importers and distributors receive flexible product combinations, repeat-order support and coordinated sourcing for local market development. Product portfolios can be adjusted for project demand and regional sales channels.',
    sortOrder: 6,
  },
  {
    question: 'What about spare parts and after-sales support?',
    answer:
      'We provide spare parts support, product information and repeat-order assistance after delivery. Spare parts can be shipped together with your order or later as needed, so your farm operations continue without interruption.',
    sortOrder: 7,
  },
  {
    question: 'Can equipment be customized for my farm?',
    answer:
      'Yes. Equipment is matched to the farm type, target capacity, site conditions and operating requirements. Layouts, capacities and configurations can be adapted to your building and budget before production.',
    sortOrder: 8,
  },
]

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  const payload = await getPayload({
    config: (await import('../src/payload.config')).default,
  })

  // --- Blog posts ---
  let blogCreated = 0
  let blogSkipped = 0
  for (const article of FALLBACK_ARTICLES) {
    const existing = await payload.find({
      collection: 'blogPosts',
      where: { slug: { equals: article.slug } },
      limit: 1,
    })
    if (existing.totalDocs > 0) {
      blogSkipped++
      continue
    }
    const children: SerializedEditorState['root']['children'] = []
    for (const section of article.sections) {
      children.push(heading(section.heading))
      children.push(paragraph(section.body))
      if (section.bullets?.length) children.push(bulletList(section.bullets))
    }
    await payload.create({
      collection: 'blogPosts',
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: richText(children),
        author: 'Agricon Team',
        published: true,
      },
    })
    blogCreated++
    console.log(`  blog post created: ${article.slug}`)
  }

  // --- FAQs ---
  let faqCreated = 0
  let faqSkipped = 0
  for (const item of FAQ_ITEMS) {
    const existing = await payload.find({
      collection: 'faqs',
      where: { question: { equals: item.question } },
      limit: 1,
    })
    if (existing.totalDocs > 0) {
      faqSkipped++
      continue
    }
    await payload.create({
      collection: 'faqs',
      data: {
        question: item.question,
        answer: richText([paragraph(item.answer)]),
        sortOrder: item.sortOrder,
        published: true,
      },
    })
    faqCreated++
    console.log(`  faq created: ${item.question.slice(0, 40)}…`)
  }

  console.log(`\nDone. Blog posts: ${blogCreated} created, ${blogSkipped} skipped. FAQs: ${faqCreated} created, ${faqSkipped} skipped.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
