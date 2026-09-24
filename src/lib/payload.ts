import { cache } from 'react'
import { unstable_cache } from 'next/cache'
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
  Video,
  Country,
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
    // A rejected init promise must NOT be cached for the lifetime of the
    // process. Previously it was: a single transient failure during the first
    // call (database unreachable during a cold start, bad DATABASE_URI at boot)
    // poisoned every later request on that instance even after the database
    // recovered, until the instance was recycled. Clearing the slot lets the
    // next caller retry. The `.catch` also marks the rejection as handled, so
    // it cannot surface as an unhandled rejection.
    payloadPromise.catch(() => {
      payloadPromise = null
    })
  }
  return payloadPromise
}

// Exact literal union matching Payload's expected locale type
type LocaleArg = 'en' | 'ru' | 'fr' | 'es' | 'sw' | 'ar' | 'all'

// ─────────────────────────────────────────────
// Caching strategy
// ─────────────────────────────────────────────
//
// Two layers, because they solve different problems:
//
//  1. `cachedQuery` (below) — `unstable_cache` keeps the query result in Next's
//     server data cache for `REVALIDATE_SECONDS`. Without this, every page view
//     hit SQLite/Postgres: the storefront pages are intentionally
//     `force-dynamic` (see src/app/(frontend)/[locale]/layout.tsx), so React's
//     `cache()` alone only dedupes within a single render pass and each new
//     request re-ran every query.
//
//  2. React `cache()` on the exported function — dedupes *within* one render
//     pass. The homepage renders many section components that each ask for the
//     same collection; this keeps that to one cache lookup per collection.
//
// Both layers are needed: (2) without (1) still costs a DB round-trip per
// request, and (1) without (2) makes each of the homepage's ~8 sections perform
// its own cache lookup.
//
// TTL rationale: content here is edited in the CMS, not by end users, so a
// couple of minutes of staleness is invisible to visitors while cutting
// database load to roughly one query per collection per window. Site settings
// use a shorter window because an admin changing a phone number expects it to
// appear promptly.
const REVALIDATE_SECONDS = 300
const SETTINGS_REVALIDATE_SECONDS = 60

/**
 * Wraps a query in Next's server data cache, keyed by its arguments and tagged
 * so future writes can invalidate it precisely (`revalidateTag('payload:products')`)
 * rather than flushing everything.
 *
 * Two failure modes must not break the page, because the query itself already
 * succeeded and the caller only asked for data:
 *
 *  1. `unstable_cache` requires Next's incremental cache, which only exists in a
 *     Next request/render context. Vitest specs and the standalone
 *     `scripts/*.ts` utilities import this module directly, where it throws
 *     `Invariant: incrementalCache missing`.
 *
 *  2. Next refuses to store an entry larger than 2MB. The products query is over
 *     that limit: with `depth: 2` every product embeds its full subcategory *and*
 *     category, plus the supplier `overviewHtml`, so the serialized result is
 *     ~9MB. Attempting to cache it raises "items over 2MB can not be cached" —
 *     and because it rejects asynchronously, an unhandled rejection was escaping
 *     and flooding the server log.
 *
 * In both cases caching is disabled for the process (case 1) or for that
 * namespace (case 2) and the data is returned to the caller. The value is
 * already computed at that point — `unstable_cache` resolves the callback before
 * it fails to store — so nothing is queried twice.
 */
let serverCacheAvailable = true
const uncacheableNamespaces = new Set<string>()

function cachedQuery<TArgs extends unknown[], TResult>(
  namespace: string,
  fn: (...args: TArgs) => Promise<TResult>,
  revalidate: number = REVALIDATE_SECONDS,
) {
  return async (...args: TArgs): Promise<TResult> => {
    if (!serverCacheAvailable || uncacheableNamespaces.has(namespace)) return fn(...args)
    const key = JSON.stringify(args)
    try {
      const cached = unstable_cache(() => fn(...args), [namespace, key], {
        revalidate,
        tags: [`payload:${namespace}`],
      })
      // NOTE: must be awaited. Both failure modes reject asynchronously, so a
      // synchronous try/catch would let them escape.
      return await cached()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('incrementalCache missing')) {
        serverCacheAvailable = false
        return fn(...args)
      }
      if (message.includes('can not be cached')) {
        uncacheableNamespaces.add(namespace)
        // Warn once per namespace, not once per request.
        if (uncacheableNamespaces.size <= 30) {
          console.warn(
            `[payload] result for "${namespace}" exceeds the 2MB Next data-cache limit; ` +
              `serving it uncached for this process.`,
          )
        }
        return fn(...args)
      }
      // Any other error is a real bug and must surface.
      throw err
    }
  }
}

/**
 * Layered helper: cross-request cache (`unstable_cache`) inside an
 * intra-render dedupe (`React.cache`).
 */
function cachedList<TArgs extends unknown[], TResult>(
  namespace: string,
  fn: (...args: TArgs) => Promise<TResult>,
  revalidate?: number,
) {
  // The tagged/deduped function is created once per (namespace, args) pair by
  // cachedQuery; React.cache then memoizes that call for the render pass.
  return cache(cachedQuery(namespace, fn, revalidate))
}

export const getProducts = cachedList(
  'products',
  async (locale: string = 'en'): Promise<Product[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      locale: locale as LocaleArg,
      // depth 1: full subcategory object, media resolved for gallery images.
      // depth 2 would additionally expand `product.solutions`, whose bidirectional
      // relation blows the result up from 503KB to 8.1MB (see
      // resolveProductCategorySlug for the full explanation).
      depth: 1,
      sort: '-createdAt',
      limit: 100,
    })
    return docs as unknown as Product[]
  },
)

export interface ProductSeoFields {
  seoTitle: string | null
  seoDescription: string | null
  description: string | null
}

/**
 * Per-locale SEO fields for every product, read with **no** fallback locale.
 *
 * The site configures `fallback: true` so that a partially translated document
 * still renders. That is right for body copy, but wrong for metadata:
 * `getProducts()` returns a product whose Russian `seoTitle` was never
 * translated holding the *English* one, and nothing in the object distinguishes
 * "translated" from "borrowed from English". `generateMetadata` then emitted
 * `<title>192-Egg Incubator | Agricon</title>` plus an English meta description
 * on /ru, /ar, /fr, /es and /sw product pages — the wrong language in the
 * search result, and near-duplicate English snippets across six locales.
 *
 * `fallbackLocale: false` returns `null` for a field the requested locale has
 * no value for, which is exactly the signal needed to fall back to the
 * genuinely localized product name / short description instead of English copy.
 *
 * `select` keeps the read to a few columns; without it this would drag the
 * 690KB of `overviewHtml` through the cache for no reason.
 */
export const getProductSeoFields = cachedList(
  'product-seo',
  async (locale: string = 'en'): Promise<Record<string, ProductSeoFields>> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      locale: locale as LocaleArg,
      fallbackLocale: false,
      depth: 0,
      limit: 100,
      pagination: false,
      select: { slug: true, seoTitle: true, seoDescription: true, description: true },
    })
    const map: Record<string, ProductSeoFields> = {}
    for (const doc of docs as unknown as Array<{ slug?: string | null } & Partial<ProductSeoFields>>) {
      if (!doc.slug) continue
      map[doc.slug] = {
        seoTitle: doc.seoTitle ?? null,
        seoDescription: doc.seoDescription ?? null,
        description: doc.description ?? null,
      }
    }
    return map
  },
)

export const getCategories = cachedList(
  'categories',
  async (locale: string = 'en'): Promise<Category[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      locale: locale as LocaleArg,
      depth: 1,
      sort: 'sortOrder',
      limit: 100,
    })
    return docs as unknown as Category[]
  },
)

export const getSubcategories = cachedList(
  'subcategories',
  async (locale: string = 'en'): Promise<Subcategory[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'subcategories',
      locale: locale as LocaleArg,
      depth: 1,
      sort: 'sortOrder',
      limit: 100,
    })
    return docs as unknown as Subcategory[]
  },
)

export interface ProductPath {
  categorySlug: string
  categoryName: string
  subcategorySlug: string
  subcategoryName: string
}

/**
 * Resolves the full ancestor path for a product URL: both slugs and both
 * display names (the names feed breadcrumb structured data, which used to show
 * raw slugs such as "poultry-equipment / layer-cage" in Google results).
 *
 * `getProducts` runs at `depth: 1`, where `product.subcategory` is a full
 * subcategory object whose own `category` is still just an **id**. This looks
 * that id up in the (separately cached and tiny) category list.
 *
 * WHY depth 1 AND NOT 2: at depth 2 Payload also expands `product.solutions`,
 * and because the solution↔product relation is bidirectional every expanded
 * solution drags its own `products` array back in. That turned a 503KB result
 * into 8.1MB — per locale, on every request — which is both wasteful and above
 * Next's 2MB data-cache ceiling, so the products query could never be cached.
 *
 * Returns `null` — never a partial or empty segment — when the relations cannot
 * produce a complete path. Callers must then suppress the link entirely:
 * `/products//layer-cage/<slug>` is a 404, and a raw category **id** in that
 * position is a URL no page owns (the product route matches only the leaf slug,
 * so such a URL answered 200, which made the breakage invisible).
 */
export async function resolveProductPath(
  product: Product,
  locale: string = 'en',
): Promise<ProductPath | null> {
  const sub = product.subcategory
  if (!sub || typeof sub !== 'object') return null

  const subcategorySlug = (sub as { slug?: string }).slug || ''
  if (!subcategorySlug) return null
  const subcategoryName = (sub as { name?: string }).name || subcategorySlug

  const cat = (sub as { category?: unknown }).category
  let categorySlug = ''
  let categoryName = ''

  if (typeof cat === 'object' && cat) {
    categorySlug = (cat as { slug?: string }).slug || ''
    categoryName = (cat as { name?: string }).name || categorySlug
  } else if (typeof cat === 'number' || typeof cat === 'string') {
    // Not expanded — `cat` is the category id, so look the slug/name up.
    const categories = await getCategories(locale)
    const match = categories.find((c) => c.id === cat)
    if (match) {
      categorySlug = match.slug || ''
      categoryName = match.name || categorySlug
    }
  }

  if (!categorySlug) return null
  return { categorySlug, categoryName, subcategorySlug, subcategoryName }
}

/**
 * Canonical href for a product, or `null` when it cannot be built.
 * See resolveProductPath for why a partial path is never returned.
 */
export async function productHref(locale: string, product: Product): Promise<string | null> {
  const path = await resolveProductPath(product, locale)
  if (!path) return null
  return `/${locale}/products/${path.categorySlug}/${path.subcategorySlug}/${product.slug}`
}

/** Category slug only — thin wrapper around resolveProductPath. */
export async function resolveProductCategorySlug(
  product: Product,
  locale: string = 'en',
): Promise<string> {
  const path = await resolveProductPath(product, locale)
  return path?.categorySlug || ''
}

export const getSolutions = cachedList(
  'solutions',
  async (locale: string = 'en'): Promise<Solution[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'solutions',
      locale: locale as LocaleArg,
      depth: 1,
      sort: 'sortOrder',
      limit: 100,
    })
    return docs as unknown as Solution[]
  },
)

export const getBlogPosts = cachedList(
  'blogPosts',
  async (locale: string = 'en'): Promise<BlogPost[]> => {
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
  },
)

export const getCaseStudies = cachedList(
  'caseStudies',
  async (locale: string = 'en'): Promise<CaseStudy[]> => {
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
  },
)

export const getFAQs = cachedList(
  'faqs',
  async (locale: string = 'en'): Promise<Faq[]> => {
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
  },
)

export const getFaqCategories = cachedList(
  'faqCategories',
  async (locale: string = 'en'): Promise<{ id: number; name: string }[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'faqCategories',
      locale: locale as LocaleArg,
      sort: 'sortOrder',
      limit: 100,
    })
    return docs as unknown as { id: number; name: string }[]
  },
)

export const getSiteSettings = cachedList(
  'siteSettings',
  async (locale: string = 'en'): Promise<SiteSetting | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'siteSettings',
      locale: locale as LocaleArg,
      limit: 1,
    })
    return (docs[0] || null) as unknown as SiteSetting | null
  },
  SETTINGS_REVALIDATE_SECONDS,
)

export const getVideos = cachedList(
  'videos',
  async (locale: string = 'en'): Promise<Video[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'videos',
      locale: locale as LocaleArg,
      depth: 1,
      sort: 'sortOrder',
      where: { published: { equals: true } },
      limit: 100,
    })
    return docs as unknown as Video[]
  },
)

export const getCountries = cachedList('countries', async (): Promise<Country[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'countries',
    sort: 'name',
    limit: 500,
  })
  return docs as unknown as Country[]
})

/**
 * Resolves a page hero image from SiteSettings (admin-editable) with the
 * built-in default as fallback. Keys: about, blog, case-studies, contact,
 * distributors, faq, products, solutions, trade-support, videos.
 *
 * `locale` is required: this used to call `getSiteSettings()` with no argument,
 * which silently fell back to English AND produced a separate cache entry keyed
 * `["siteSettings","[]"]`. Harmless while `pageHeroImages` only holds uploads,
 * but wrong the moment that group gains a localized text field.
 */
export async function resolvePageHeroImage(
  page: string,
  fallback: string,
  locale: string = 'en',
): Promise<string> {
  const settings = await getSiteSettings(locale)
  const map = (settings as unknown as { pageHeroImages?: Record<string, string> | null }).pageHeroImages
  return (map && typeof map === 'object' && map[page]) || fallback
}

/**
 * Which product categories belong to each solution.
 *
 * Used ONLY as a last-resort fallback when a solution has no linked products at
 * all. `aquaculture` and `breeding-house` are in exactly that state: the catalog
 * importer never linked anything to them, and every subcategory behind them
 * (fish pond, aerator, greenhouse, exhaust fan, …) currently holds zero products.
 * Without this the page silently drops the entire "Products in This Solution"
 * block, which reads as "this solution includes nothing".
 *
 * Prefer editing the solution in the admin and linking products directly — this
 * map exists so the storefront degrades usefully, not to replace curation.
 */
const SOLUTION_FALLBACK_CATEGORIES: Record<string, string[]> = {
  'aquaculture': ['aquaculture-equipment'],
  'breeding-house': ['breeding-house-equipment'],
  'poultry-farming': ['poultry-equipment'],
  'livestock-farming': ['livestock-equipment'],
  'feed-processing': ['agriculture-machinery'],
  'farm-machinery': ['agriculture-machinery', 'farming-tools', 'farming-vehicles'],
}

/**
 * Products belonging to a solution, resolved in three steps:
 *
 *  1. `solutions.products` — the field declared on the Solutions collection.
 *  2. the reverse `products.solutions` relation — for content created before
 *     scripts/sync-solution-products.ts ran, when only the reverse side was set.
 *  3. products whose subcategory belongs to one of the solution's categories —
 *     so a solution with no curation at all still shows relevant equipment.
 *
 * Step 3 returns only products that are actually purchasable; empty categories
 * are filtered out rather than filling the grid with dead cards.
 */
export const getProductsForSolution = cachedList(
  'productsForSolution',
  async (
    solutionId: number | string,
    locale: string = 'en',
    solutionSlug: string = '',
  ): Promise<Product[]> => {
    const payload = await getPayloadClient()

    const forward = await payload.find({
      collection: 'products',
      locale: locale as LocaleArg,
      // depth 1 is enough: the card renders the product name and its first gallery
      // image, both of which resolve at depth 1. See resolveProductCategorySlug.
      depth: 1,
      limit: 100,
      where: { solutions: { contains: solutionId } },
    })
    if (forward.docs.length > 0) return forward.docs as unknown as Product[]

    // Step 2 — reverse relation.
    const all = await getProducts(locale)
    const viaReverse = all.filter((p) =>
      (p.solutions || []).some((rel) =>
        typeof rel === 'object' && rel !== null ? rel.id === solutionId : rel === solutionId,
      ),
    )
    if (viaReverse.length > 0) return viaReverse

    // Step 3 — category fallback.
    const categorySlugs = SOLUTION_FALLBACK_CATEGORIES[solutionSlug]
    if (!categorySlugs || categorySlugs.length === 0) return []

    const [categories, subcategories] = await Promise.all([getCategories(locale), getSubcategories(locale)])
    const categoryIds = new Set(
      categories.filter((c) => categorySlugs.includes(c.slug)).map((c) => c.id),
    )
    if (categoryIds.size === 0) return []

    const subIds = new Set(
      subcategories
        .filter((s) => {
          const cat = (s as unknown as { category?: unknown }).category
          const catId = typeof cat === 'object' && cat ? (cat as { id: number }).id : cat
          return catId !== undefined && categoryIds.has(catId as number)
        })
        .map((s) => s.id),
    )
    if (subIds.size === 0) return []

    const fromCategories = all.filter((p) => {
      const sub = p.subcategory
      const subId = typeof sub === 'object' && sub ? sub.id : sub
      return subId !== undefined && subIds.has(subId as number)
    })
    return fromCategories
  },
)

/**
 * Case studies belonging to a solution, using the same forward-then-reverse
 * strategy as getProductsForSolution.
 */
export const getCaseStudiesForSolution = cachedList(
  'caseStudiesForSolution',
  async (solutionId: number | string, locale: string = 'en'): Promise<CaseStudy[]> => {
    const payload = await getPayloadClient()

    const forward = await payload.find({
      collection: 'caseStudies',
      locale: locale as LocaleArg,
      depth: 1,
      limit: 100,
      where: { solution: { equals: solutionId } },
    })
    if (forward.docs.length > 0) return forward.docs as unknown as CaseStudy[]

    const all = await getCaseStudies(locale)
    return all.filter((c) => {
      const sol = (c as { solution?: number | { id: number } | null }).solution
      return typeof sol === 'object' && sol !== null ? sol.id === solutionId : sol === solutionId
    })
  },
)

// ─────────────────────────────────────────────
// Homepage aggregate — one call, all sections' data.
// Used by the homepage to avoid N parallel queries.
// ─────────────────────────────────────────────
export async function getHomepageData(locale: string = 'en') {
  const [categories, solutions, posts, settings] = await Promise.all([
    getCategories(locale),
    getSolutions(locale),
    getBlogPosts(locale),
    // Must receive the locale: without it the settings come back in English on
    // every localized homepage. See resolvePageHeroImage.
    getSiteSettings(locale),
  ])
  return { categories, solutions, posts, settings }
}
