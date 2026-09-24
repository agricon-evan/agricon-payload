import { type NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n/config'

// Public paths that should not be redirected to /en
const publicPaths = ['/api', '/admin', '/_next', '/favicon', '/robots', '/sitemap', '/manifest', '/icon', '/catalog', '/images']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
