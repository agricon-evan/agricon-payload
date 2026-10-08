'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { locales, defaultLocale, isRtl } from '@/i18n/config'

/**
 * Keeps `<html lang>` / `<html dir>` in sync with the locale in the URL.
 *
 * WHY THIS EXISTS
 * ---------------
 * `(frontend)/layout.tsx` is the ROOT layout, so it sits above `[locale]` and has
 * no access to the locale route parameter. It used to read it from a request
 * header injected by `src/proxy.ts` — a dynamic API, which forced every page in
 * the group to render on every request and reach the database.
 *
 * Dropping that makes the whole storefront statically generatable, at the cost of
 * `<html lang>` being a fixed `en` in the generated HTML. The language of the
 * actual content is still declared server-side and correctly: `[locale]/layout.tsx`
 * renders `<div lang={locale} dir={dir}>` around everything, and the nearest
 * `lang` ancestor is what crawlers and screen readers use.
 *
 * This component then corrects the `html` element itself after hydration, so the
 * document is accurate for assistive technology, browser translation prompts and
 * anything reading `document.documentElement.lang`.
 */
export default function HtmlLangSync() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    const seg = pathname.split('/').filter(Boolean)[0]
    const locale = locales.includes(seg as (typeof locales)[number]) ? seg : defaultLocale
    document.documentElement.lang = locale
    document.documentElement.dir = isRtl(locale as (typeof locales)[number]) ? 'rtl' : 'ltr'
  }, [pathname])

  return null
}
