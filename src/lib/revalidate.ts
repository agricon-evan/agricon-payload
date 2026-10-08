import { revalidateTag } from 'next/cache'

/**
 * Every cache tag `cachedQuery` attaches in `src/lib/payload.ts`
 * (`tags: ['payload:' + namespace]`).
 *
 * WHY THIS EXISTS
 * ---------------
 * The production database is a Neon free-plan project whose binding limit is
 * **compute hours** (100 CU-hours per project per month). Neon suspends an idle
 * compute, but every query wakes it, so the quota is spent by wake-ups rather
 * than by result size. `lib/payload.ts` therefore holds content for six hours
 * instead of five minutes.
 *
 * A long window on its own would mean an admin edits a product and sees nothing
 * for six hours. `POST /api/revalidate` closes that gap on demand: it drops every
 * cached read, and the next request repopulates them from the database.
 *
 * WHY IT IS *NOT* WIRED INTO COLLECTION HOOKS
 * -------------------------------------------
 * The obvious design — an `afterChange` hook on every collection — was tried and
 * removed, because it breaks the admin panel. `payload.config.ts` is loaded
 * through more than one module graph (the Payload admin does not go through
 * Next's resolver), and a `next/cache` import reachable from the config fails
 * there at runtime with:
 *
 *     Error: Cannot find module '.../node_modules/next/cache'
 *            imported from .../src/lib/revalidate.ts
 *            Did you mean to import "next/cache.js"?
 *
 * which took down /admin entirely. This module is therefore only ever imported
 * from a Next route handler, where `next/cache` resolves normally. If you
 * reintroduce hooks, verify /admin still loads (the Playwright suite covers it).
 *
 * COARSE ON PURPOSE. A product write can affect `products`, `product-seo`,
 * `productOverviews`, `productsForSolution` and `caseStudiesForSolution`, and the
 * mapping is not worth maintaining by hand. Writes are rare while reads are
 * constant, so invalidating everything is the cheap, obviously-correct choice.
 */
export const PAYLOAD_TAGS = [
  'payload:products',
  'payload:product-seo',
  'payload:productOverviews',
  'payload:productsForSolution',
  'payload:categories',
  'payload:subcategories',
  'payload:solutions',
  'payload:blogPosts',
  'payload:caseStudies',
  'payload:caseStudiesForSolution',
  'payload:faqs',
  'payload:faqCategories',
  'payload:siteSettings',
  'payload:videos',
  'payload:countries',
] as const

/** Drops every cached Payload read. See the note above about where it may run. */
export function revalidatePayloadCaches(): void {
  for (const tag of PAYLOAD_TAGS) {
    // Next 16 requires the cache-life profile as a second argument; 'max' is the
    // "treat as stale immediately" profile, which is what publishing means.
    revalidateTag(tag, 'max')
  }
}
