import Link from 'next/link'
import { headers } from 'next/headers'
import { defaultLocale, getTranslations, locales, type Locale } from '@/i18n/config'
import Icon from '@/components/ui/Icon'

/**
 * Locale-scoped 404.
 *
 * `notFound()` thrown anywhere under `/[locale]/…` renders this file, which
 * means the visitor keeps the header, footer and language switcher instead of
 * landing on the bare `(frontend)/not-found.tsx` shell that sits outside the
 * locale layout.
 *
 * `not-found.tsx` never receives route params, so the locale is recovered from
 * the `x-pathname` header that `src/proxy.ts` injects on every request.
 */
export default async function LocaleNotFound() {
  const h = await headers()
  const pathname = h.get('x-pathname') || ''
  const first = pathname.split('/').filter(Boolean)[0]
  const locale: Locale = locales.includes(first as Locale) ? (first as Locale) : defaultLocale
  const t = getTranslations(locale, 'common')
  const nf = t.notFound ?? {}

  return (
    <section className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
      {/* The number is the h1 (matching Next's own 404 shape) so the page has a
          single, unambiguous heading; the human-readable title follows it. */}
      <h1 className="font-display text-5xl md:text-6xl font-bold tracking-[-0.02em] text-[var(--color-primary)]">404</h1>
      <span className="orange-underline mt-5" aria-hidden="true" />
      <p className="mt-6 text-2xl md:text-3xl font-bold text-[var(--color-text)]">
        {nf.title || 'Page not found'}
      </p>
      <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto">
        {nf.description || 'The page you are looking for may have been moved, renamed or is no longer available.'}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] tap-target press transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          {nf.backHome || 'Back to Home'}
        </Link>
        <Link
          href={`/${locale}/products`}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold rounded-md min-h-[48px] tap-target press transition-colors hover:bg-[var(--color-primary)]/6"
        >
          {nf.browseProducts || 'Browse Products'}
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </section>
  )
}
