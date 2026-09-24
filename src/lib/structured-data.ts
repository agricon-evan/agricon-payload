/**
 * JSON-LD structured data (schema.org).
 *
 * The site previously shipped **no** structured data at all, which cost it the
 * rich results that matter most for an equipment exporter: the product card in
 * Google Shopping-style results, the FAQ accordion, and the breadcrumb trail.
 * The README claimed "JSON-LD" was done; nothing referenced `application/ld+json`.
 *
 * Everything here is a pure builder returning plain objects — rendering is the
 * job of `<JsonLd>` (`src/components/JsonLd.tsx`), so the shapes can be unit
 * tested without a browser.
 *
 * Rules kept deliberately:
 *   - Absolute URLs only (`SITE_URL`), because crawlers do not resolve relative
 *     ones reliably across the locale sub-paths.
 *   - Never invent data. A field is omitted when the underlying CMS value is
 *     missing, rather than emitted empty — invalid markup is worse than absent
 *     markup.
 */

import { SITE_URL } from '@/lib/seo'

export type JsonLdObject = Record<string, unknown>

/** Organization node id, so other nodes can reference it with `@id`. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

export interface SiteSettingsLike {
  siteName?: string | null
  siteTagline?: string | null
  address?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  socialLinks?: {
    linkedin?: string | null
    facebook?: string | null
    instagram?: string | null
    youtube?: string | null
  } | null
  seo?: { siteDescription?: string | null } | null
}

const clean = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || undefined
}

/** Drops undefined/null/empty entries so no empty node keys are emitted. */
const compact = (obj: JsonLdObject): JsonLdObject =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === undefined || v === null) return false
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'string') return v.trim() !== ''
      return true
    }),
  )

/** `https://schema.org` wrapper for a single page graph. */
export const graph = (nodes: JsonLdObject[]): JsonLdObject => ({
  '@context': 'https://schema.org',
  // A node whose every value is undefined/null/empty carries no information and
  // would only add noise for crawlers.
  '@graph': nodes.filter((node) =>
    Object.values(node).some((v) => {
      if (v === undefined || v === null) return false
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'string') return v.trim() !== ''
      return true
    }),
  ),
})

export function organizationSchema(settings: SiteSettingsLike | null | undefined): JsonLdObject {
  const name = clean(settings?.siteName) || 'Agricon'
  const sameAs = [
    clean(settings?.socialLinks?.linkedin),
    clean(settings?.socialLinks?.facebook),
    clean(settings?.socialLinks?.instagram),
    clean(settings?.socialLinks?.youtube),
  ].filter(Boolean)

  return compact({
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name,
    url: SITE_URL,
    logo: `${SITE_URL}/images/og-default.jpg`,
    description: clean(settings?.seo?.siteDescription) || clean(settings?.siteTagline),
    email: clean(settings?.contactEmail),
    telephone: clean(settings?.contactPhone),
    address: settings?.address
      ? { '@type': 'PostalAddress', streetAddress: clean(settings.address), addressCountry: 'CN' }
      : undefined,
    sameAs,
  })
}

export function webSiteSchema(locale: string, settings: SiteSettingsLike | null | undefined): JsonLdObject {
  return compact({
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: clean(settings?.siteName) || 'Agricon',
    inLanguage: locale,
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  })
}

/**
 * Parses the free-text price we store ("US$52.3", "US$0.05") into an Offer.
 * Returns undefined when there is no usable amount — an Offer without a price is
 * invalid and Google rejects the whole Product node because of it.
 */
export function offerFromPrice(price: unknown, url: string): JsonLdObject | undefined {
  const text = clean(price)
  if (!text) return undefined
  const amount = text.match(/([0-9]+(?:[.,][0-9]+)?)/)
  if (!amount) return undefined
  const currency = /US\$|\$|USD/i.test(text) ? 'USD' : /€|EUR/i.test(text) ? 'EUR' : /¥|CNY|RMB/i.test(text) ? 'CNY' : undefined
  if (!currency) return undefined
  return compact({
    '@type': 'Offer',
    url,
    price: amount[1].replace(',', '.'),
    priceCurrency: currency,
    availability: 'https://schema.org/InStock',
    seller: { '@id': ORGANIZATION_ID },
  })
}

export function productSchema({
  name,
  description,
  image,
  url,
  sku,
  price,
}: {
  name: string
  description?: string | null
  image?: string | null
  url: string
  sku?: string | null
  price?: string | null
}): JsonLdObject {
  const offer = offerFromPrice(price, url)
  return compact({
    '@type': 'Product',
    name: clean(name),
    description: clean(description),
    image: image ? [image] : undefined,
    url,
    sku: clean(sku) || undefined,
    brand: { '@type': 'Brand', name: 'Agricon' },
    manufacturer: { '@id': ORGANIZATION_ID },
    offers: offer,
  })
}

export function faqPageSchema(items: Array<{ question: string; answer: string }>): JsonLdObject {
  return compact({
    '@type': 'FAQPage',
    mainEntity: items
      .filter((item) => item.question?.trim() && item.answer?.trim())
      .map((item) => ({
        '@type': 'Question',
        name: item.question.trim(),
        acceptedAnswer: { '@type': 'Answer', text: item.answer.trim() },
      })),
  })
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLdObject {
  return compact({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  })
}

export function articleSchema({
  headline,
  description,
  image,
  url,
  datePublished,
  locale,
}: {
  headline: string
  description?: string | null
  image?: string | null
  url: string
  datePublished?: string | null
  locale: string
}): JsonLdObject {
  return compact({
    '@type': 'BlogPosting',
    headline: clean(headline),
    description: clean(description),
    image: image ? [image] : undefined,
    url,
    inLanguage: locale,
    datePublished: clean(datePublished),
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
  })
}

/**
 * Converts a Lexical rich-text document to plain text.
 *
 * Lexical wraps everything in `{ root: { children: [...] } }`; an earlier version
 * only looked at `text`/`children` on the node it was given, so feeding it a
 * whole document returned an empty string — which silently produced empty FAQ
 * answers in the translation work lists and would have produced empty
 * `acceptedAnswer` fields in the FAQPage schema.
 */
export function richTextToPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const record = node as { text?: unknown; children?: unknown[]; root?: unknown }
  if (typeof record.text === 'string') return record.text
  if (record.root) return richTextToPlainText(record.root)
  if (Array.isArray(record.children)) {
    return record.children
      .map(richTextToPlainText)
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  return ''
}
