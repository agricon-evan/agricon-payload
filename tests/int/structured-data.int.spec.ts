import { describe, expect, it } from 'vitest'
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  offerFromPrice,
  productSchema,
  richTextToPlainText,
} from '@/lib/structured-data'

const lexicalAnswer = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
        version: 1,
      },
    ],
  },
})

describe('graph', () => {
  it('wraps nodes with the schema.org context and drops empty ones', () => {
    const out = graph([{ '@type': 'Organization', name: 'Agricon' }, {}, { name: undefined } as never])
    expect(out['@context']).toBe('https://schema.org')
    expect(out['@graph']).toHaveLength(1)
  })
})

describe('offerFromPrice', () => {
  it('parses the free-text price strings the CMS stores', () => {
    expect(offerFromPrice('US$52.3', 'https://x/p')).toMatchObject({ price: '52.3', priceCurrency: 'USD' })
    expect(offerFromPrice('US$0.05', 'https://x/p')).toMatchObject({ price: '0.05' })
    expect(offerFromPrice('€120', 'https://x/p')).toMatchObject({ priceCurrency: 'EUR' })
  })

  it('returns nothing when there is no usable amount', () => {
    // An Offer without a price invalidates the whole Product node, so it must be
    // omitted rather than emitted empty.
    expect(offerFromPrice('', 'https://x/p')).toBeUndefined()
    expect(offerFromPrice(null, 'https://x/p')).toBeUndefined()
    expect(offerFromPrice('Contact for price', 'https://x/p')).toBeUndefined()
  })
})

describe('productSchema', () => {
  it('keeps the fields it has and omits the ones it does not', () => {
    const schema = productSchema({
      name: 'H-Type Layer Cage',
      description: 'Galvanized battery cage.',
      image: '/api/media/file/a.png',
      url: 'https://agricon.cn/en/products/poultry-equipment/layer-cage/h-type',
      sku: 'h-type-layer-cage',
      price: 'US$335',
    })
    expect(schema['@type']).toBe('Product')
    expect(schema.name).toBe('H-Type Layer Cage')
    expect(schema.image).toEqual(['/api/media/file/a.png'])
    expect(schema.offers).toMatchObject({ price: '335', priceCurrency: 'USD' })
  })

  it('omits offers entirely when the price is unparseable', () => {
    const schema = productSchema({ name: 'X', url: 'https://x', price: '' })
    expect(schema.offers).toBeUndefined()
    expect(schema.description).toBeUndefined()
  })
})

describe('faqPageSchema', () => {
  it('drops entries without both a question and an answer', () => {
    const schema = faqPageSchema([
      { question: 'What is the MOQ?', answer: 'One container.' },
      { question: '   ', answer: 'orphan answer' },
      { question: 'orphan question', answer: '' },
    ])
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toHaveLength(1)
    expect(schema.mainEntity).toMatchObject([
      { '@type': 'Question', name: 'What is the MOQ?', acceptedAnswer: { '@type': 'Answer', text: 'One container.' } },
    ])
  })
})

describe('breadcrumbSchema', () => {
  it('numbers the trail from 1', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', url: 'https://x/en' },
      { name: 'Products', url: 'https://x/en/products' },
    ])
    expect((schema.itemListElement as Array<{ position: number }>).map((i) => i.position)).toEqual([1, 2])
  })
})

describe('richTextToPlainText', () => {
  it('reads a full Lexical document (not just a bare node)', () => {
    expect(richTextToPlainText(lexicalAnswer('Yes, we ship worldwide.'))).toBe('Yes, we ship worldwide.')
  })

  it('joins multiple paragraphs and nested children', () => {
    const doc = {
      root: {
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'First line.' }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'Second' }, { type: 'text', text: 'line.' }] },
        ],
      },
    }
    expect(richTextToPlainText(doc)).toBe('First line. Second line.')
  })

  it('returns an empty string for missing or malformed input', () => {
    expect(richTextToPlainText(null)).toBe('')
    expect(richTextToPlainText('plain')).toBe('')
    expect(richTextToPlainText({ root: {} })).toBe('')
  })
})
