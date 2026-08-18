import React from 'react'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Outfit, Noto_Sans } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { locales, isRtl } from '@/i18n/config'

// Display: Outfit (per system design). Body: Noto Sans (MiSans web substitute, covers latin/cyrillic/greek for all 6 locales)
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const noto = Noto_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  applicationName: 'Agricon',
  metadataBase: new URL('https://www.agricon.com'),
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#0C5D3F',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
}

export default async function FrontendRootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  // 从 proxy 注入的 x-pathname 提取 locale，设置 html lang/dir（RTL 支持）
  let locale = 'en'
  try {
    const h = await headers()
    const p = h.get('x-pathname') || ''
    const seg = p.split('/').filter(Boolean)[0]
    if (locales.includes(seg as (typeof locales)[number])) locale = seg
  } catch { /* headers 不可用时回退 en */ }
  return (
    <html lang={locale} dir={isRtl(locale as (typeof locales)[number]) ? 'rtl' : 'ltr'} className={`${outfit.variable} ${noto.variable}`} data-scroll-behavior="smooth">
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
