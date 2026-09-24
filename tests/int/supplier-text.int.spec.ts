import { describe, expect, it } from 'vitest'
import {
  decodeLiteralUnicodeEscapes,
  describeFromSpecs,
  findSupplierArtifacts,
  hasLiteralUnicodeEscapes,
  htmlToPlainText,
  isCrossSellText,
  sanitizeSupplierText,
  stripSupplierBoilerplate,
  summarizeCopy,
} from '@/lib/supplier-text'

/**
 * The exact prefix that shipped on 31 of 43 product overview articles — captured
 * verbatim from the stored rows so a regression is caught with real data.
 */
const REAL_PREFIX = 'Product descriptions from the supplier Report abuse Highlights at a glance '

describe('supplier boilerplate scrubbing', () => {
  it('detects the captured label chain', () => {
    expect(findSupplierArtifacts(`${REAL_PREFIX}Hot Dip Galvanized Surface Treatment`)).toEqual([
      'product descriptions from the supplier',
      'report abuse',
      'highlights at a glance',
    ])
    expect(findSupplierArtifacts('Purely our own copy.')).toEqual([])
    expect(findSupplierArtifacts('')).toEqual([])
    expect(findSupplierArtifacts(null)).toEqual([])
  })

  it('removes the chain from the start of an HTML article without touching markup', () => {
    const html = `<p>${REAL_PREFIX}Plug-in shelling at home: the motors run on 220V.</p>\n<p><img src="/x.jpg" alt="x" /></p>`
    const out = stripSupplierBoilerplate(html)
    expect(out.startsWith('<p>Plug-in shelling at home')).toBe(true)
    expect(findSupplierArtifacts(out)).toEqual([])
    expect((out.match(/<p>/g) || []).length).toBe(2)
    expect((out.match(/<\/p>/g) || []).length).toBe(2)
    expect(out).toContain('<img src="/x.jpg"')
  })

  it('removes the labels wherever they appear, not just at index 0', () => {
    const out = stripSupplierBoilerplate(`<p>Real copy. Report abuse More copy.</p>`)
    expect(out).toBe('<p>Real copy. More copy.</p>')
  })

  it('drops a paragraph that contained nothing but labels', () => {
    const out = stripSupplierBoilerplate(`<p>${REAL_PREFIX}</p><p>Body</p>`)
    expect(out).toBe('<p>Body</p>')
  })

  it('is idempotent', () => {
    const once = stripSupplierBoilerplate(`<p>${REAL_PREFIX}Body text.</p>`)
    expect(stripSupplierBoilerplate(once)).toBe(once)
  })

  it('leaves clean copy byte-identical', () => {
    const clean = '<h3>Highlights</h3><p>Hot dip galvanized, 60+ µm zinc coating.</p>'
    expect(stripSupplierBoilerplate(clean)).toBe(clean)
  })

  it('collapses whitespace for plain-text fields', () => {
    expect(sanitizeSupplierText(`${REAL_PREFIX}  A   description with gaps.`)).toBe(
      'A description with gaps.',
    )
    expect(sanitizeSupplierText('line one\nline two')).toBe('line one line two')
  })

  it('recognises cross-sell widgets', () => {
    expect(isCrossSellText('Frequently bought together: other product')).toBe(true)
    expect(isCrossSellText('Video Description something')).toBe(true)
    expect(isCrossSellText('You may also like')).toBe(true)
    expect(isCrossSellText('A genuine product description about cages.')).toBe(false)
  })
})

describe('literal \\uXXXX escapes', () => {
  it('decodes the escapes the importer stored as text', () => {
    // Stored value on 65 product features — rendered as gibberish before the fix.
    expect(decodeLiteralUnicodeEscapes('\\uD83C\\uDFED Certified Factory Partnerships')).toBe(
      '🏭 Certified Factory Partnerships',
    )
    expect(decodeLiteralUnicodeEscapes('\\uD83D\\uDD27 Hot Dip Galvanized')).toBe('🔧 Hot Dip Galvanized')
  })

  it('leaves ordinary backslashes and clean text alone', () => {
    expect(decodeLiteralUnicodeEscapes('C:\\Users\\farm')).toBe('C:\\Users\\farm')
    expect(decodeLiteralUnicodeEscapes('Plain copy.')).toBe('Plain copy.')
    expect(decodeLiteralUnicodeEscapes('')).toBe('')
  })

  it('detects remaining escapes', () => {
    expect(hasLiteralUnicodeEscapes('\\uD83C\\uDFED x')).toBe(true)
    expect(hasLiteralUnicodeEscapes('🏭 x')).toBe(false)
    // a global regex must not leak lastIndex between calls
    expect(hasLiteralUnicodeEscapes('\\uD83C\\uDFED x')).toBe(true)
  })
})

describe('overview HTML flattening', () => {
  it('turns headings into sentences and drops markup', () => {
    const html = '<h3>Plug-in shelling at home</h3><p>The motors run on 220V.</p><p><img src="/x.jpg" alt="x" /></p>'
    expect(htmlToPlainText(html)).toBe('Plug-in shelling at home. The motors run on 220V.')
  })

  it('decodes the entities the importer wrote', () => {
    expect(htmlToPlainText('<p>Steel &amp; mesh&nbsp;panels</p>')).toBe('Steel & mesh panels')
  })
})

describe('summarizeCopy', () => {
  it('drops the leading label and keeps whole sentences', () => {
    const text =
      'Hot Dip Galvanized Surface Treatment For Long Lasting Durability: Each cage frame undergoes hot dip galvanizing with zinc coating above 60 microns. Extends service life to over 15-20 years.'
    const out = summarizeCopy(text)
    expect(out?.startsWith('Each cage frame undergoes')).toBe(true)
    expect(out?.endsWith('.')).toBe(true)
    expect(out).toBe(text.slice(text.indexOf(':') + 2))
  })

  it('stops after the last sentence that fits the window', () => {
    const first = `${'A'.repeat(200)}.`
    const second = `${'B'.repeat(200)}.`
    const out = summarizeCopy(`${first} ${second}`, 260)
    expect(out).toBe(first)
  })

  it('never cuts a word in half', () => {
    // Regression: this exact style of blurb used to be stored as "This 4."
    const out = summarizeCopy('This 4.8t multi-function chaff cutter handles fresh grass and hay with ease', 40)
    expect(out).not.toMatch(/This 4\.$/)
    expect(out?.endsWith('…')).toBe(true)
    expect(out?.trim().split(' ').pop()).not.toBe('')
    // the ellipsis branch must not end mid-word either
    expect(out).toBe('This 4.8t multi-function chaff cutter…')
  })

  it('returns short copy unchanged when it simply has no final punctuation', () => {
    expect(summarizeCopy('Compact frame')).toBe('Compact frame')
  })

  it('scans slightly past the limit so a sentence is not split needlessly', () => {
    const sentence = 'A'.repeat(250) + ' ' + 'B'.repeat(20) + '.'
    const out = summarizeCopy(sentence, 260)
    expect(out).toBe(sentence)
  })

  it('returns null for empty input', () => {
    expect(summarizeCopy('')).toBeNull()
    expect(summarizeCopy(null)).toBeNull()
  })
})

/**
 * Used only when a supplier page carries no description at all (8 of the 53
 * curated listings). Values below are copied from real stored rows.
 */
describe('describeFromSpecs', () => {
  it('describes a cage from its cage type, capacity and animal', () => {
    const out = describeFromSpecs([
      { label: 'animal cage type', value: 'H Type' },
      { label: 'Capacity', value: '96-160' },
      { label: 'use', value: 'Chicken' },
      { label: 'key selling points', value: 'Low cost' },
      { label: 'condition', value: 'New' },
      { label: 'warranty', value: '1 Year' },
    ])
    expect(out).toContain('96-160 H type chicken cage')
    expect(out).toContain('low cost')
    expect(out).toContain('supplied with a 1 year warranty')
    expect(out?.endsWith('.')).toBe(true)
  })

  it('falls back to the feature spec for incubators, whose `type` is generic', () => {
    const out = describeFromSpecs([
      { label: 'type', value: 'Automatic' },
      { label: 'Feature', value: 'Full-automatic Digital Eggs Incubator' },
      { label: 'Capacity', value: '4-500Pcs' },
      { label: 'hatching rate', value: '98%' },
      { label: 'condition', value: 'New' },
      { label: 'warranty', value: '1 Year' },
    ])
    expect(out).toContain('4-500Pcs')
    expect(out).toContain('incubator')
    expect(out).toContain('98% hatching rate')
  })

  it('returns null rather than inventing copy when there is nothing to say', () => {
    expect(describeFromSpecs([])).toBeNull()
    expect(describeFromSpecs([{ label: 'brand name', value: 'Agricon' }])).toBeNull()
    // generic `type` with no feature/capacity cannot name the product
    expect(describeFromSpecs([{ label: 'type', value: 'Home' }])).toBeNull()
  })

  it('keeps acronyms uppercase mid-sentence', () => {
    const out = describeFromSpecs([
      { label: 'type', value: 'PP PVC feeder' },
      { label: 'capacity', value: '10L' },
    ])
    expect(out).toContain('PP PVC feeder')
  })
})
