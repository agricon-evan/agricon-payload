import { type NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n/config'

// Public paths that should not be redirected to /en
const publicPaths = ['/api', '/admin', '/_next', '/favicon', '/robots', '/sitemap', '/manifest', '/icon']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public/asset paths and Payload admin
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check if path already has a locale prefix
  const hasLocale = locales.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))

  if (!hasLocale) {
    // Redirect to default locale
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except API, admin, static files, and SEO files
    '/((?!api|_next|favicon|robots|sitemap|manifest|images|admin|icon).*)',
  ],
}