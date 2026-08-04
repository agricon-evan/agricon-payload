import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'

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

// ─────────────────────────────────────────────
// React `cache()` — deduplicates identical queries within ONE render pass.
// The homepage renders many section components that each fetch the same
// collections; cache() ensures a single DB round-trip per collection per request.
// ─────────────────────────────────────────────

export const getProducts = cache(async (locale: string = 'en') => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    locale: locale as any,
    depth: 1,
    sort: '-createdAt',
  })
  return docs as any[]
})

export const getCategories = cache(async (locale: string = 'en') => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    locale: locale as any,
    depth: 1,
    sort: 'sortOrder',
  })
  return docs as any[]
})

export const getSubcategories = cache(async (locale: string = 'en') => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'subcategories',
    locale: locale as any,
    depth: 1,
    sort: 'sortOrder',
  })
  return docs as any[]
})

export const getSolutions = cache(async (locale: string = 'en') => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'solutions',
    locale: locale as any,
    depth: 1,
    sort: 'sortOrder',
  })
  return docs as any[]
})

export const getBlogPosts = cache(async (locale: string = 'en') => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'blogPosts',
    locale: locale as any,
    depth: 1,
    sort: '-createdAt',
    where: { published: { equals: true } },
    limit: 10,
  })
  return docs as any[]
})

export const getCaseStudies = cache(async (locale: string = 'en') => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'caseStudies',
    locale: locale as any,
    depth: 1,
    sort: 'sortOrder',
    where: { published: { equals: true } },
  })
  return docs as any[]
})

export const getFAQs = cache(async (locale: string = 'en') => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'faqs',
    locale: locale as any,
    depth: 1,
    sort: 'sortOrder',
    where: { published: { equals: true } },
  })
  return docs as any[]
})

export const getSiteSettings = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'siteSettings',
    limit: 1,
  })
  return (docs[0] || null) as any
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
