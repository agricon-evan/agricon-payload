'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { defaultLocale, locales, type Locale } from '@/i18n/config'
import Icon from '@/components/ui/Icon'

/**
 * Locale-scoped 404.
 *
 * `notFound()` thrown anywhere under `/[locale]/…` renders this file, which means
 * the visitor keeps the header, footer and language switcher instead of landing on
 * the bare `(frontend)/not-found.tsx` shell outside the locale layout.
 *
 * WHY IT IS A CLIENT COMPONENT WITH AN INLINE DICTIONARY
 * -----------------------------------------------------
 * `not-found.tsx` never receives route params, so the locale has to come from
 * somewhere. It used to come from the `x-pathname` request header that
 * `src/proxy.ts` injects, read with `headers()` — a dynamic API. Keeping that
 * would have left a dynamic API inside the statically generated route tree, where
 * a page that calls `notFound()` during static generation cannot render it.
 *
 * The obvious client-side fix — `usePathname()` plus `getTranslations()` — is much
 * worse than it looks: `src/i18n/config.ts` statically imports all six locales ×
 * fourteen namespaces of JSON, so importing it from a client component would ship
 * the entire translation corpus to every visitor to render four sentences.
 *
 * Hence: read the locale from the URL with `usePathname()`, and hold the four
 * strings inline. They are copied verbatim from `src/i18n/locales/<locale>/common.json`
 * (`notFound`), which remains the source of truth for the server-rendered pages.
 */
const COPY: Record<Locale, { title: string; description: string; backHome: string; browseProducts: string }> = {
  en: {
    title: 'Page not found',
    description: 'The page you are looking for may have been moved, renamed or is no longer available.',
    backHome: 'Back to Home',
    browseProducts: 'Browse Products',
  },
  ru: {
    title: 'Страница не найдена',
    description: 'Возможно, страница была перемещена, переименована или больше недоступна.',
    backHome: 'На главную',
    browseProducts: 'Смотреть продукцию',
  },
  fr: {
    title: 'Page introuvable',
    description: "La page recherchée a peut-être été déplacée, renommée ou n'est plus disponible.",
    backHome: "Retour à l'accueil",
    browseProducts: 'Voir les produits',
  },
  es: {
    title: 'Página no encontrada',
    description: 'Es posible que la página se haya movido, renombrado o ya no esté disponible.',
    backHome: 'Volver al inicio',
    browseProducts: 'Ver productos',
  },
  sw: {
    title: 'Ukurasa haupatikani',
    description: 'Huenda ukurasa ulihamishwa, ukabadilishwa jina au haupo tena.',
    backHome: 'Rudi mwanzo',
    browseProducts: 'Tazama bidhaa',
  },
  ar: {
    title: 'الصفحة غير موجودة',
    description: 'ربما نُقلت الصفحة أو تغيّر اسمها أو لم تعد متاحة.',
    backHome: 'العودة للرئيسية',
    browseProducts: 'تصفح المنتجات',
  },
}

export default function LocaleNotFound() {
  const pathname = usePathname() || ''
  const first = pathname.split('/').filter(Boolean)[0]
  const locale: Locale = locales.includes(first as Locale) ? (first as Locale) : defaultLocale
  const nf = COPY[locale] ?? COPY[defaultLocale]

  return (
    <section className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
      {/* The number is the h1 (matching Next's own 404 shape) so the page has a
          single, unambiguous heading; the human-readable title follows it. */}
      <h1 className="font-display text-5xl md:text-6xl font-bold tracking-[-0.02em] text-[var(--color-primary)]">404</h1>
      <span className="orange-underline mt-5" aria-hidden="true" />
      <p className="mt-6 text-2xl md:text-3xl font-bold text-[var(--color-text)]">
        {nf.title}
      </p>
      <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto">
        {nf.description}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] tap-target press transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          {nf.backHome}
        </Link>
        <Link
          href={`/${locale}/products`}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold rounded-md min-h-[48px] tap-target press transition-colors hover:bg-[var(--color-primary)]/6"
        >
          {nf.browseProducts}
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </section>
  )
}
