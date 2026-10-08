'use client'

import { useEffect } from 'react'

/**
 * Route-level error boundary for every localized storefront page.
 *
 * WHY: on 2026-10-08 the production database's plan quota ran out and Neon
 * refused every connection. Every storefront page is `force-dynamic`, so every
 * request threw, and visitors got Next's bare "This page couldn't load — a
 * server error occurred. Reload to try again." with no branding, no explanation
 * and no way back.
 *
 * `src/lib/payload.ts` now serves its last good cached value when the database is
 * unreachable, which covers warm instances. This boundary covers the rest: a cold
 * instance, or a genuine bug, still renders something a visitor can act on — in
 * their own language, because this is the `[locale]` segment.
 *
 * The status code is still 500 (an error boundary cannot change it). That is
 * undesirable for search engines but far better than the current situation, and
 * fixing it properly needs a 503 rewrite from middleware. Recorded in
 * docs/MAINTENANCE.md §13 so it is not forgotten.
 */
const COPY: Record<string, { title: string; body: string; retry: string; home: string }> = {
  en: {
    title: 'This page is temporarily unavailable',
    body: 'We are having trouble loading our catalogue right now. Your request was not lost — please try again in a moment.',
    retry: 'Try again',
    home: 'Back to home',
  },
  ru: {
    title: 'Страница временно недоступна',
    body: 'Сейчас не удаётся загрузить каталог. Ваш запрос не потерян — попробуйте, пожалуйста, ещё раз через минуту.',
    retry: 'Повторить',
    home: 'На главную',
  },
  fr: {
    title: 'Cette page est temporairement indisponible',
    body: 'Nous ne parvenons pas à charger le catalogue pour le moment. Votre demande n’est pas perdue — merci de réessayer dans un instant.',
    retry: 'Réessayer',
    home: 'Retour à l’accueil',
  },
  es: {
    title: 'Esta página no está disponible temporalmente',
    body: 'Ahora mismo no podemos cargar el catálogo. Su solicitud no se ha perdido: vuelva a intentarlo en un momento.',
    retry: 'Reintentar',
    home: 'Volver al inicio',
  },
  sw: {
    title: 'Ukurasa haupatikani kwa sasa',
    body: 'Kwa sasa hatuwezi kupakia orodha yetu. Ombi lako halijapotea — tafadhali jaribu tena baada ya muda mfupi.',
    retry: 'Jaribu tena',
    home: 'Rudi mwanzo',
  },
  ar: {
    title: 'هذه الصفحة غير متاحة مؤقتًا',
    body: 'نواجه مشكلة في تحميل الكتالوج الآن. لم يُفقد طلبك — يرجى المحاولة مرة أخرى بعد قليل.',
    retry: 'إعادة المحاولة',
    home: 'العودة إلى الصفحة الرئيسية',
  },
}

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  // `reset` re-renders the segment; if the database is back, the page succeeds.
  reset: () => void
}) {
  // The locale is not passed to error boundaries, so read it from the URL. It is
  // always the first path segment (see src/i18n/config.ts).
  const locale =
    typeof window === 'undefined'
      ? 'en'
      : (window.location.pathname.split('/').filter(Boolean)[0] ?? 'en')

  useEffect(() => {
    // Surfaces in the Vercel runtime logs with the digest Next also prints.
    console.error('[storefront] render failed', error.digest ?? '', error.message)
  }, [error])

  const t = COPY[locale] ?? COPY.en
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <main
      dir={dir}
      className="min-h-[70vh] flex items-center justify-center px-6 py-24"
    >
      <div className="max-w-xl text-center">
        <p className="eyebrow">Agricon</p>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-[var(--color-text)]">
          {t.title}
        </h1>
        <span className="orange-underline mt-4 inline-block" aria-hidden="true" />
        <p className="mt-6 text-base leading-relaxed text-[var(--color-text-secondary)]">
          {t.body}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t.retry}
          </button>
          <a
            href={`/${locale}`}
            className="rounded-full border border-[var(--color-border)] px-7 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface)]"
          >
            {t.home}
          </a>
        </div>
        {error.digest ? (
          <p className="mt-8 text-xs text-[var(--color-text-secondary)] opacity-70">
            ref: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  )
}
