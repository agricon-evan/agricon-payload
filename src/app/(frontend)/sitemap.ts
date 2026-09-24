import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.agricon.cn').replace(/\/$/, '')

/**
 * `/search` is deliberately NOT listed. It is a query-param-driven internal
 * search page: thin, infinitely variable and duplicate content. It was submitted
 * in all six locales, which invites index bloat. `robots.ts` disallows it too.
 */
const staticRoutes = [
  '/', '/products', '/solutions', '/contact', '/about',
  '/case-studies', '/blog', '/videos', '/faq', '/trade-support',
  '/distributors', '/privacy', '/terms',
]

/** Legal pages change rarely; content pages change with the catalog. */
const LEGAL_ROUTES = new Set(['/privacy', '/terms'])

/**
 * Builds a `lastModified` only when the stored timestamp is actually parseable.
 *
 * `new Date(undefined)` yields an Invalid Date, and Next's sitemap serializer
 * calls `.toISOString()` on it — which throws `RangeError: Invalid time value`
 * and takes down the **entire** `/sitemap.xml` response, not just that one URL.
 */
const lastModified = (value?: string | null): Date | undefined => {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/**
 * Render this route on a schedule instead of freezing it at build time.
 *
 * Without an explicit `dynamic`/`revalidate` export, a metadata route is
 * evaluated during `next build` and the resulting XML is cached — the
 * `force-dynamic` set on `[locale]/layout.tsx` does NOT apply here, because
 * `/sitemap.xml` is its own route, not a child of that layout. That had two
 * consequences:
 *
 *   1. Content added in the CMS never appeared in the sitemap until the next
 *      deploy.
 *   2. `next build` opened a database connection. On a platform where the
 *      database is not reachable at build time (Vercel/CI), the build failed.
 */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Static routes × locales
  for (const route of staticRoutes) {
    for (const locale of locales) {
      const path = route === '/' ? `/${locale}` : `/${locale}${route}`
      entries.push({
        url: `${SITE_URL}${path}`,
        changeFrequency: LEGAL_ROUTES.has(route) ? 'yearly' : 'weekly',
        priority: LEGAL_ROUTES.has(route) ? 0.3 : route === '/' ? 1 : 0.7,
      })
    }
  }

  /**
   * Resolving the Payload client is the single most likely thing to fail when
   * the database is unreachable — and it used to sit *outside* every guard, so
   * an outage threw straight out of this route (a 500 on `/sitemap.xml`, and a
   * hard build failure given the build-time evaluation described above).
   * Degrade to "static URLs only" and say why.
   */
  let payload: Awaited<ReturnType<typeof getPayloadClient>>
  try {
    payload = await getPayloadClient()
  } catch (err) {
    console.error(
      '[sitemap] Payload init failed — emitting static URLs only. Cause:',
      err instanceof Error ? err.message : String(err),
    )
    return entries
  }

  /**
   * Runs one CMS-backed section of the sitemap, isolating its failure.
   *
   * Previously each of these used a bare `catch {}`, so a database error would
   * silently truncate the sitemap — dropping hundreds of product URLs with no
   * trace anywhere. Failures are now logged, and the section still degrades to
   * "missing" rather than failing the whole route.
   */
  const section = async (name: string, build: () => Promise<void>): Promise<void> => {
    try {
      await build()
    } catch (err) {
      payload.logger.error(
        { err: err instanceof Error ? err.message : String(err), section: name },
        'Sitemap section failed — those URLs are missing from sitemap.xml',
      )
    }
  }

  /**
   * `depth: 1` everywhere. Payload's default is 2, and on `products` that
   * additionally expands the bidirectional `solutions` relation — turning a
   * ~500KB result into ~8MB per locale. Every other query in `lib/payload.ts`
   * pins depth 1 for exactly this reason.
   *
   * The one consequence to remember: at depth 1 a nested relationship
   * (`product.subcategory.category`) is still an id. The products section below
   * resolves it against the category list; `subcategories.category` is a
   * first-level relationship and is populated normally.
   */
  const CMS_DEPTH = 1

  /**
   * Category landing pages (`/products/<category>`). These were missing
   * entirely: the sitemap only ever listed product *detail* pages, so all ten
   * category pages — reachable, linked from the catalog and 200-responding —
   * were never submitted for indexing.
   */
  await section('categories', async () => {
    const { docs: categories } = await payload.find({
      collection: 'categories',
      depth: CMS_DEPTH,
      limit: 500,
    })
    for (const c of categories) {
      if (!c.slug) continue
      for (const locale of locales) {
        entries.push({
          url: `${SITE_URL}/${locale}/products/${c.slug}`,
          lastModified: lastModified(c.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  })

  /**
   * Subcategory listing pages (`/products/<category>/<subcategory>`). Same gap
   * as the category level: 69 subcategory pages were absent from the sitemap.
   */
  await section('subcategories', async () => {
    const { docs: subcategories } = await payload.find({
      collection: 'subcategories',
      depth: CMS_DEPTH,
      limit: 500,
    })
    for (const sub of subcategories) {
      const cat = sub.category
      const catObj = typeof cat === 'object' && cat !== null ? cat : null
      // Never publish a URL with an empty path segment — that path 404s.
      if (!catObj?.slug || !sub.slug) {
        payload.logger.warn(
          { subcategory: sub.slug, category: catObj?.slug ?? cat ?? null },
          'Sitemap: skipped a subcategory whose category cannot be resolved',
        )
        continue
      }
      for (const locale of locales) {
        entries.push({
          url: `${SITE_URL}/${locale}/products/${catObj.slug}/${sub.slug}`,
          lastModified: lastModified(sub.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      }
    }
  })

  await section('products', async () => {
    const { docs: products } = await payload.find({
      collection: 'products',
      depth: CMS_DEPTH,
      limit: 500,
    })

    /**
     * At `depth: 1` Payload populates `product.subcategory` but leaves
     * `subcategory.category` as a bare **id** — depth counts levels of the
     * populated tree, so the category sits at level 2. Resolving it here is
     * deliberate: raising this query to depth 2 also expands `product.solutions`,
     * and because that relation is bidirectional every expanded solution drags
     * its own `products` array back in (503KB → 8.1MB per locale). The category
     * list is small and separately cached, so look the slug up from it instead.
     *
     * This is the same resolution `resolveProductPath` performs in
     * `src/lib/payload.ts`; keep the two in step.
     */
    const { docs: categories } = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 500,
    })
    const categorySlugById = new Map<string, string>()
    for (const c of categories) {
      if (c.id && c.slug) categorySlugById.set(String(c.id), c.slug)
    }

    for (const p of products) {
      const sub = p.subcategory
      const subObj = typeof sub === 'object' && sub !== null ? sub : null
      const cat = subObj?.category
      // `cat` is either an expanded object (depth ≥ 2) or an id (depth 1).
      const categorySlug =
        typeof cat === 'object' && cat !== null
          ? (cat as { slug?: string }).slug || ''
          : cat != null
            ? categorySlugById.get(String(cat)) || ''
            : ''
      // Never publish a URL with an empty path segment. If the relation is not
      // expanded (query depth) or genuinely missing, the product page would be
      // unreachable at that path — skip it and say so instead of shipping a 404
      // to Google.
      if (!categorySlug || !subObj?.slug || !p.slug) {
        payload.logger.warn(
          { product: p.slug, category: categorySlug || cat || null, subcategory: subObj?.slug ?? sub ?? null },
          'Sitemap: skipped a product whose category/subcategory cannot be resolved',
        )
        continue
      }
      const prodPath = `/products/${categorySlug}/${subObj.slug}/${p.slug}`
      for (const locale of locales) {
        entries.push({
          url: `${SITE_URL}/${locale}${prodPath}`,
          lastModified: lastModified(p.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }
    }
  })

  await section('blogPosts', async () => {
    const { docs: posts } = await payload.find({
      collection: 'blogPosts',
      depth: CMS_DEPTH,
      limit: 500,
      where: { published: { equals: true } },
    })
    for (const p of posts) {
      if (!p.slug) continue
      for (const locale of locales) {
        entries.push({
          url: `${SITE_URL}/${locale}/blog/${p.slug}`,
          lastModified: lastModified(p.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.5,
        })
      }
    }
  })

  await section('caseStudies', async () => {
    const { docs: cases } = await payload.find({
      collection: 'caseStudies',
      depth: CMS_DEPTH,
      limit: 500,
      where: { published: { equals: true } },
    })
    for (const cs of cases) {
      if (!cs.slug) continue
      for (const locale of locales) {
        entries.push({
          url: `${SITE_URL}/${locale}/case-studies/${cs.slug}`,
          lastModified: lastModified(cs.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    }
  })

  await section('solutions', async () => {
    const { docs: sols } = await payload.find({
      collection: 'solutions',
      depth: CMS_DEPTH,
      limit: 500,
    })
    for (const s of sols) {
      if (!s.slug) continue
      for (const locale of locales) {
        entries.push({
          url: `${SITE_URL}/${locale}/solutions/${s.slug}`,
          lastModified: lastModified(s.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    }
  })

  return entries
}
