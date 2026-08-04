import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type {
  Product,
  Category,
  Subcategory,
  Solution,
  BlogPost,
  CaseStudy,
  Faq,
  SiteSetting,
} from '@/payload-types'

// Cache the payload initialization PROMISE (not just the instance)
// This prevents duplicate concurrent initialization across parallel page renders
let payloadPromise: Promise<Awaited<ReturnType<typeof getPayload>>> | null = null

export function getPayloadClient() {
  if (!payloadPromise) {
    payloadPromise = (async () => {
      const payloadConfig = await config
      return getPayload({ config: payloadConfig })
    })()
  }
  return payloadPromise
}

// Exact literal union matching Payload's expected locale type
type LocaleArg = 'en' | 'ru' | 'fr' | 'es' | 'sw' | 'ar' | 'all'

// ─────────────────────────────────────────────
// React `cache()` — deduplicates identical queries within ONE render pass.
// The homepage renders many section components that each fetch the same
// collections; cache() ensures a single DB round-trip per collection per request.
// ─────────────────────────────────────────────

export const getProducts = cache(async (locale: string = 'en'): Promise<Product[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    locale: locale as LocaleArg,
    depth: 1,
    sort: '-createdAt',
    limit: 100,
  })
  return docs as unknown as Product[]
})

export const getCategories = cache(async (locale: string = 'en'): Promise<Category[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    locale: locale as LocaleArg,
    depth: 1,
    sort: 'sortOrder',
    limit: 100,
  })
  return docs as unknown as Category[]
})

export const getSubcategories = cache(async (locale: string = 'en'): Promise<Subcategory[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'subcategories',
    locale: locale as LocaleArg,
    depth: 1,
    sort: 'sortOrder',
    limit: 100,
  })
  return docs as unknown as Subcategory[]
})

export const getSolutions = cache(async (locale: string = 'en'): Promise<Solution[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'solutions',
    locale: locale as LocaleArg,
    depth: 1,
    sort: 'sortOrder',
    limit: 100,
  })
  return docs as unknown as Solution[]
})

export const getBlogPosts = cache(async (locale: string = 'en'): Promise<BlogPost[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'blogPosts',
    locale: locale as LocaleArg,
    depth: 1,
    sort: '-createdAt',
    where: { published: { equals: true } },
    limit: 10,
  })
  return docs as unknown as BlogPost[]
})

export const getCaseStudies = cache(async (locale: string = 'en'): Promise<CaseStudy[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'caseStudies',
    locale: locale as LocaleArg,
    depth: 1,
    sort: 'sortOrder',
    where: { published: { equals: true } },
    limit: 100,
  })
  return docs as unknown as CaseStudy[]
})

export const getFAQs = cache(async (locale: string = 'en'): Promise<Faq[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'faqs',
    locale: locale as LocaleArg,
    depth: 1,
    sort: 'sortOrder',
    where: { published: { equals: true } },
    limit: 100,
  })
  return docs as unknown as Faq[]
})

export const getSiteSettings = cache(async (): Promise<SiteSetting | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'siteSettings',
    limit: 1,
  })
  return (docs[0] || null) as unknown as SiteSetting | null
})

// ─────────────────────────────────────────────
// Homepage aggregate — one call, all sections' data.
// Used by the homepage to avoid N parallel queries.
// ─────────────────────────────────────────────
export async function getHomepageData(locale: string = 'en') {
  const [categories, solutions, posts, settings] = await Promise.all([
    getCategories(locale),
    getSolutions(locale),
    getBlogPosts(locale),
    getSiteSettings(),
  ])
  return { categories, solutions, posts, settings }
}
