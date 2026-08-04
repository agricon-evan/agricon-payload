import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.agricon.com').replace(/\/$/, '')

const staticRoutes = [
  '/products', '/solutions', '/contact', '/about',
  '/case-studies', '/blog', '/faq', '/trade-support',
  '/distributors', '/privacy', '/terms', '/search',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const entries: MetadataRoute.Sitemap = []

  // Static routes × locales
  for (const route of staticRoutes) {
    for (const locale of locales) {
      const path = locale === 'en' ? route : `/${locale}${route}`
      entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 })
    }
  }

  // Products (dynamic)
  try {
    const { docs: products } = await payload.find({ collection: 'products', limit: 500 })
    for (const p of products) {
      const sub = p.subcategory
      const subObj = typeof sub === 'object' && sub !== null ? sub : null
      const cat = subObj?.category
      const catObj = typeof cat === 'object' && cat !== null ? cat : null
      const prodPath = `/products/${catObj?.slug || ''}/${subObj?.slug || ''}/${p.slug}`
      for (const locale of locales) {
        const path = locale === 'en' ? prodPath : `/${locale}${prodPath}`
        entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date((p).updatedAt), changeFrequency: 'monthly', priority: 0.6 })
      }
    }
  } catch { /* D1 may be empty */ }

  // Blog posts
  try {
    const { docs: posts } = await payload.find({ collection: 'blogPosts', limit: 500, where: { published: { equals: true } } })
    for (const p of posts) {
      for (const locale of locales) {
        const path = locale === 'en' ? `/blog/${(p).slug}` : `/${locale}/blog/${(p).slug}`
        entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date((p).updatedAt), changeFrequency: 'weekly', priority: 0.5 })
      }
    }
  } catch {}

  // Case studies
  try {
    const { docs: cases } = await payload.find({ collection: 'caseStudies', limit: 500, where: { published: { equals: true } } })
    for (const cs of cases) {
      for (const locale of locales) {
        const path = locale === 'en' ? `/case-studies/${(cs).slug}` : `/${locale}/case-studies/${(cs).slug}`
        entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date((cs).updatedAt), changeFrequency: 'monthly', priority: 0.5 })
      }
    }
  } catch {}

  // Solutions
  try {
    const { docs: sols } = await payload.find({ collection: 'solutions', limit: 500 })
    for (const s of sols) {
      for (const locale of locales) {
        const path = locale === 'en' ? `/solutions/${(s).slug}` : `/${locale}/solutions/${(s).slug}`
        entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date((s).updatedAt), changeFrequency: 'monthly', priority: 0.5 })
      }
    }
  } catch {}

  return entries
}
