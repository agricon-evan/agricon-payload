import type { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.agricon.cn').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Admin panel and its API.
        '/admin',
        // Payload REST + GraphQL. Nothing here is meant to be indexed, and
        // crawling it wastes budget and can surface raw JSON in results.
        '/api/',
        // Internal search results: thin, infinitely variable, duplicate content.
        // `/*/search` covers the locale-prefixed form (/en/search, /ru/search, …).
        '/search',
        '/*/search',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
