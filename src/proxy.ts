import { type NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n/config'

// Public paths that should not be redirected to /en
const publicPaths = ['/api', '/admin', '/_next', '/favicon', '/robots', '/sitemap', '/manifest', '/icon', '/catalog', '/images']

/**
 * Maintenance window, served as a real 503.
 *
 * WHY THIS IS MIDDLEWARE AND NOT AN ERROR BOUNDARY
 * -----------------------------------------------
 * A Next.js App Router page CANNOT choose its own status code: when a page
 * throws, `error.tsx` renders and the response is always 500. There is no
 * `maintenance()` equivalent of `notFound()`. Middleware is the only place in
 * this app that can emit an arbitrary status for a page route.
 *
 * WHY 503 AND NOT 500
 * -------------------
 * 500 tells a crawler the page is broken and, sustained, gets URLs dropped.
 * 503 + `Retry-After` says "temporarily unavailable, come back" — which is
 * accurate, keeps the URL indexed, and is what Google documents for planned and
 * unplanned downtime. With 1,068 sitemap URLs the distinction is worth having.
 *
 * HOW TO USE IT
 * -------------
 * Set `MAINTENANCE_MODE=true` in the Vercel project (Production) and redeploy;
 * unset it to come back. `/api/*` and `/admin` keep working deliberately: the
 * health probe must stay reachable and you need the admin to fix the data.
 *
 * WHEN NOT TO USE IT
 * ------------------
 * If the site can still render cached pages, DO NOT switch this on — serving the
 * last good page (200) is strictly better for visitors than a notice. This is
 * for when nothing can be rendered at all.
 *
 * An automatic version is not possible without cost: middleware runs on every
 * request and cannot see the database, so detecting an outage would mean polling
 * a health endpoint — and every poll wakes the Neon compute, the exact resource
 * whose exhaustion causes these outages. See docs/MAINTENANCE.md §13.
 */
const MAINTENANCE_COPY: Record<string, { title: string; body: string }> = {
  en: { title: 'We will be right back', body: 'Agricon is undergoing maintenance. Please try again in a few minutes.' },
  ru: { title: 'Мы скоро вернёмся', body: 'На сайте Agricon проводятся работы. Пожалуйста, попробуйте через несколько минут.' },
  fr: { title: 'Nous revenons très vite', body: 'Agricon est en maintenance. Merci de réessayer dans quelques minutes.' },
  es: { title: 'Volvemos enseguida', body: 'Agricon está en mantenimiento. Vuelva a intentarlo en unos minutos.' },
  sw: { title: 'Tunarudi hivi punde', body: 'Agricon inafanyiwa matengenezo. Tafadhali jaribu tena baada ya dakika chache.' },
  ar: { title: 'سنعود بعد قليل', body: 'يجري موقع Agricon أعمال صيانة. يرجى المحاولة مرة أخرى بعد بضع دقائق.' },
}

function maintenanceResponse(pathname: string): NextResponse {
  const seg = pathname.split('/').filter(Boolean)[0]
  const locale = locales.includes(seg as (typeof locales)[number]) ? seg : defaultLocale
  const t = MAINTENANCE_COPY[locale] ?? MAINTENANCE_COPY.en
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  // Self-contained on purpose: no stylesheet, font or JS from the app, so this
  // still renders when the application itself cannot boot.
  const html = `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t.title} | Agricon</title>
<meta name="robots" content="noindex">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:#fff;color:#1a1a1a;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:32rem;padding:2rem;text-align:center}
h1{font-size:1.55rem;margin:0}p{color:#556;margin:1rem 0 0}
.bar{width:56px;height:3px;background:#0c5d3f;margin:1.1rem auto;border-radius:2px}</style>
</head><body><main><h1>${t.title}</h1><div class="bar"></div><p>${t.body}</p></main></body></html>`
  return new NextResponse(html, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Tells crawlers this is temporary, and when to come back.
      'retry-after': '300',
      'cache-control': 'no-store',
    },
  })
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Assets, the API and the admin stay reachable during a maintenance window —
  // otherwise the health probe and the fix-it-yourself path both go dark.
  const isAssetOrBackend = publicPaths.some((p) => pathname.startsWith(p))

  if (process.env.MAINTENANCE_MODE === 'true' && !isAssetOrBackend) {
    return maintenanceResponse(pathname)
  }

  // Inject the current path so layouts/pages can generate correct hreflang & canonical
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  // Query string is passed separately so the language switchers (Header is a
  // client component reading useSearchParams; Footer is a server component and
  // only sees headers) both keep `?q=…` when the visitor changes language.
  requestHeaders.set('x-search', request.nextUrl.search)
  const passThrough = () => NextResponse.next({ request: { headers: requestHeaders } })

  // Skip middleware for public/asset paths and Payload admin
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return passThrough()
  }

  // Case-corrected locale prefix: `/EN/faq` used to fall through as "no locale"
  // and get rewritten to `/en/EN/faq`, which 404s. A wrong-case or wrong-format
  // locale segment is now redirected to the canonical lowercase form, so a
  // hand-typed or shared link still lands on the real page.
  const [firstSegment, ...rest] = pathname.split('/').filter(Boolean)
  const caseMatch = firstSegment
    ? locales.find((l) => l.toLowerCase() === firstSegment.toLowerCase() && l !== firstSegment)
    : undefined
  if (caseMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/${caseMatch}${rest.length ? `/${rest.join('/')}` : ''}`
    return NextResponse.redirect(url)
  }

  // Check if path already has a locale prefix
  const hasLocale = locales.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))

  if (!hasLocale) {
    // Redirect to default locale
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname}`
    return NextResponse.redirect(url)
  }

  return passThrough()
}

export const config = {
  matcher: [
    // Match all paths except API, admin, static files, and SEO files
    '/((?!api|_next|favicon|robots|sitemap|manifest|images|admin|icon|catalog|.*\\.(?:jpg|jpeg|png|webp|svg|gif|ico|avif|mp4|pdf|woff2?|css|js|json|txt)).*)',
  ],
}
// Note: /admin is intentionally excluded so the Payload admin auth/session flow
// (which depends on the route group) works without locale-prefix interference.
