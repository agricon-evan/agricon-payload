import React from 'react'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Outfit, Noto_Sans } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { SITE_URL } from '@/lib/seo'
import HtmlLangSync from '@/components/HtmlLangSync'

// Display: Outfit (per system design). Body: Noto Sans (MiSans web substitute, covers latin/cyrillic/greek for all 6 locales)
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const noto = Noto_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  applicationName: 'Agricon',
  // 跟随 NEXT_PUBLIC_SITE_URL（此前写死 https://www.agricon.com，与真实域名 .cn 不符）
  metadataBase: new URL(SITE_URL),
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#0C5D3F',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
}

export default function FrontendRootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  // NOTE: this layout is the ROOT layout, so it sits above `[locale]` and cannot
  // read the locale route parameter. It used to derive it from `x-pathname`,
  // injected by `src/proxy.ts`, via `headers()` — a dynamic API that forced every
  // storefront page to render per request and hit the database, which is how a
  // database outage became a site-wide 500 (docs/MAINTENANCE.md §13).
  //
  // The static default below is corrected on the client by <HtmlLangSync />, and
  // the language of the content itself is declared server-side by the
  // `<div lang={locale} dir={dir}>` that `[locale]/layout.tsx` renders.
  //
  // suppressHydrationWarning: 浏览器插件（如沉浸式翻译）会在 React 接管前往 <html>
  // 注入 data-* 属性，导致 hydration 属性不匹配警告。仅抑制该标签自身，不影响子元素。
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${outfit.variable} ${noto.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <HtmlLangSync />
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
