import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const securityHeaders = [
  // HSTS — force HTTPS (production only, 1 year)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // XSS protection
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Frame protection — block clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Referrer policy — no referrer leakage
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions policy — restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  // Content-Security-Policy
  // NOTE: 'unsafe-inline' / 'unsafe-eval' are required because the Payload
  // admin panel relies on inline scripts. Tighten (e.g. add nonces) only after
  // verifying the admin UI still works with a stricter policy.
  //
  // va.vercel-scripts.com / vitals.vercel-insights.com are required by
  // @vercel/analytics and @vercel/speed-insights — without them the CSP blocks
  // the scripts and no analytics is ever reported.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // `X-Powered-By: Next.js, Payload` advertises the exact stack to anyone
  // probing the site. Nothing in the app depends on it.
  poweredByHeader: false,
  // The Dockerfile copies `.next/standalone`, which Next only emits when
  // `output: 'standalone'` is set — without it `docker build` fails at the
  // `COPY --from=builder /app/.next/standalone` step. It is opt-in through
  // `NEXT_OUTPUT=standalone` (set in the Dockerfile builder stage) rather than
  // unconditional, because production deploys to Vercel, which runs its own
  // build and does not consume a standalone bundle.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  async redirects() {
    return [
      // Taxonomy change (2026-09-18): "Transport Crate" was a subcategory of its
      // own, but a transport crate is a breeding/handling accessory, so its one
      // product moved into "Breeding Accessories"
      // (`scripts/move-subcategory.ts --from=transport-crate --to=breeding-accessories`).
      // Product URLs embed the subcategory, so the old paths are kept alive here —
      // otherwise every inbound link and indexed page would 404.
      {
        source: '/:locale/products/poultry-equipment/transport-crate/plastic-poultry-transport-crate',
        destination:
          '/:locale/products/poultry-equipment/breeding-accessories/plastic-poultry-transport-crate',
        permanent: true,
      },
      {
        source: '/:locale/products/poultry-equipment/transport-crate',
        destination: '/:locale/products/poultry-equipment',
        permanent: true,
      },
      // Duplicate listing (2026-09-18): the Alibaba scrape produced two rows for
      // the same feeder/drinker product — `poultry-feeding-and-watering-set` and
      // `poultry-feeder-and-drinker-set` — with identical specs and price. The
      // second one was kept (better gallery, longer copy):
      // (`scripts/delete-product.ts --slug=poultry-feeding-and-watering-set --redirect-to=poultry-feeder-and-drinker-set`).
      {
        source:
          '/:locale/products/poultry-equipment/breeding-accessories/poultry-feeding-and-watering-set',
        destination:
          '/:locale/products/poultry-equipment/breeding-accessories/poultry-feeder-and-drinker-set',
        permanent: true,
      },
      // Taxonomy alignment (2026-09-18): the client's own group list puts the
      // drinking cup / nipple / pressure regulator under "Breeding Accessory",
      // so they moved from cage-accessories (their URL changed with it).
      // See scripts/import-links.ts + docs/scrape/import-names-2026-09-18.json.
      ...['chicken-drinking-bowl', 'poultry-nipple-drinking-cup', 'poultry-water-pressure-regulator'].map(
        (slug) => ({
          source: `/:locale/products/poultry-equipment/cage-accessories/${slug}`,
          destination: `/:locale/products/poultry-equipment/breeding-accessories/${slug}`,
          permanent: true,
        }),
      ),
      // Removed duplicates (2026-09-21): after the import the client reviewed
      // `/products/poultry-equipment/layer-cage` and dropped these four listings
      // (`scripts/delete-product.ts --slug=… --apply`, DB backed up first).
      // They point at the subcategory rather than at a guessed replacement.
      ...[
        'h-type-layer-cage-battery-system',
        'h-type-layer-cage-96-160-birds',
        'half-set-layer-cage-48-160-birds',
        'a-type-layer-cage-120-birds',
      ].map((slug) => ({
        source: `/:locale/products/poultry-equipment/layer-cage/${slug}`,
        destination: '/:locale/products/poultry-equipment/layer-cage',
        permanent: true,
      })),
      // Livestock reorganisation (2026-09-21): "Gestation Crate" was folded into
      // "Farrow Pen" (the client's list treats a gestation crate as a farrowing
      // pen) and "Adjustable Farrowing Crate" was dropped.
      // (`scripts/move-subcategory.ts --from=gestation-crate --to=farrow-pen --apply`
      //  + `scripts/delete-product.ts --slug=adjustable-farrowing-crate --apply`)
      {
        source:
          '/:locale/products/livestock-equipment/gestation-crate/pig-gestation-crate',
        destination:
          '/:locale/products/livestock-equipment/farrow-pen/pig-gestation-crate',
        permanent: true,
      },
      {
        source: '/:locale/products/livestock-equipment/gestation-crate',
        destination: '/:locale/products/livestock-equipment',
        permanent: true,
      },
      {
        source:
          '/:locale/products/livestock-equipment/farrow-pen/adjustable-farrowing-crate',
        destination: '/:locale/products/livestock-equipment/farrow-pen',
        permanent: true,
      },
      // Same pass (2026-09-22): "H-Type Rabbit Cage" was dropped from Rabbit Cage;
      // the two model-level listings that remain are kept, so the dead URL lands
      // on the subcategory rather than on one of them.
      {
        source:
          '/:locale/products/livestock-equipment/rabbit-cage/h-type-rabbit-cage',
        destination: '/:locale/products/livestock-equipment/rabbit-cage',
        permanent: true,
      },
      // Agriculture-machinery cull (2026-09-23): the client picked one listing
      // per model across seven subcategories and renamed two survivors. All ten
      // dead URLs land on their subcategory — except the Diesel/Gasoline Feed
      // Pellet Mill, which was the same machine as the kept AGP-160 listing, so
      // it points at that surviving product page.
      // (`scripts/tmp-bulk-changes-20260922.ts --apply`, DB backed up first.)
      {
        source:
          '/:locale/products/agriculture-machinery/grinding-machine/diesel-disk-mill-grinder-800kg-h',
        destination: '/:locale/products/agriculture-machinery/grinding-machine',
        permanent: true,
      },
      ...['large-chaff-cutter-5t-h', '4-8t-multi-function-chaff-cutter', 'small-chaff-cutter-400kg-h'].map(
        (slug) => ({
          source: `/:locale/products/agriculture-machinery/grass-chaff-machine/${slug}`,
          destination: '/:locale/products/agriculture-machinery/grass-chaff-machine',
          permanent: true,
        }),
      ),
      {
        source: '/:locale/products/agriculture-machinery/mixing-machine/feed-mixing-and-grinding-machine',
        destination: '/:locale/products/agriculture-machinery/mixing-machine',
        permanent: true,
      },
      ...['diesel-corn-thresher-8hp', 'corn-peeling-and-shelling-machine', 'bean-thresher-200kg-h'].map(
        (slug) => ({
          source: `/:locale/products/agriculture-machinery/threshing-machine/${slug}`,
          destination: '/:locale/products/agriculture-machinery/threshing-machine',
          permanent: true,
        }),
      ),
      {
        source: '/:locale/products/agriculture-machinery/peanut-sheller/electric-peanut-sheller',
        destination: '/:locale/products/agriculture-machinery/peanut-sheller',
        permanent: true,
      },
      {
        source:
          '/:locale/products/agriculture-machinery/pellet-machine/diesel-gasoline-feed-pellet-mill',
        destination:
          '/:locale/products/agriculture-machinery/pellet-machine/agp-160-flat-die-pellet-machine',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/catalog/**',
      },
      {
        pathname: '/images/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
