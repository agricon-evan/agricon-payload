import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'

const SITE_URL = 'https://www.agricon.com'

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
      const sub = (p as any).subcategory
      const cat = sub?.category
      const prodPath = `/products/${cat?.slug || ''}/${sub?.slug || ''}/${(p as any).slug}`
      for (const locale of locales) {
        const path = locale === 'en' ? prodPath : `/${locale}${prodPath}`
        entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date((p as any).updatedAt), changeFrequency: 'monthly', priority: 0.6 })
      }
    }
  } catch { /* D1 may be empty */ }

  // Blog posts
  try {
    const { docs: posts } = await payload.find({ collection: 'blogPosts', limit: 500, where: { published: { equals: true } } })
    for (const p of posts) {
      for (const locale of locales) {
        const path = locale === 'en' ? `/blog/${(p as any).slug}` : `/${locale}/blog/${(p as any).slug}`
        entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date((p as any).updatedAt), changeFrequency: 'weekly', priority: 0.5 })
      }
    }
  } catch {}

  // Case studies
  try {
    const { docs: cases } = await payload.find({ collection: 'caseStudies', limit: 500, where: { published: { equals: true } } })
    for (const cs of cases) {
      for (const locale of locales) {
        const path = locale === 'en' ? `/case-studies/${(cs as any).slug}` : `/${locale}/case-studies/${(cs as any).slug}`
        entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date((cs as any).updatedAt), changeFrequency: 'monthly', priority: 0.5 })
      }
    }
  } catch {}

  // Solutions
  try {
    const { docs: sols } = await payload.find({ collection: 'solutions', limit: 500 })
    for (const s of sols) {
      for (const locale of locales) {
        const path = locale === 'en' ? `/solutions/${(s as any).slug}` : `/${locale}/solutions/${(s as any).slug}`
        entries.push({ url: `${SITE_URL}${path}`, lastModified: new Date((s as any).updatedAt), changeFrequency: 'monthly', priority: 0.5 })
      }
    }
  } catch {}

  return entries
}
