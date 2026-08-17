import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { getTranslations, locales, isRtl, type Locale } from '@/i18n/config'
import { SITE_URL, localizedAlternates, stripLocaleFromPath } from '@/lib/seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Newsletter from '@/components/Newsletter'
import FloatingActions from '@/components/FloatingActions'
import { getSiteSettings } from '@/lib/payload'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Render dynamically: DB-backed pages (products, blog, site settings, …) are
// fetched at request time. This keeps `next build` from requiring a live
// database at build time, so the app deploys cleanly to Vercel (and other
// serverless platforms) where Payload pushes the schema to Postgres on first run.
export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')

  // 当前请求路径（由 proxy.ts 注入），用于生成正确的 hreflang / canonical
  const h = await headers()
  const pathname = h.get('x-pathname') || ''
  const rel = stripLocaleFromPath(pathname, locale)

  // SEO defaults from SiteSettings (admin-editable) with i18n fallback
  const settings = await getSiteSettings(locale)
  const seo = (settings?.seo ?? {}) as { siteTitle?: string | null; siteDescription?: string | null }
  const siteTitle = seo.siteTitle || (t.meta?.siteTitle as string) || 'Agricon'
  const siteDescription = seo.siteDescription || (t.meta?.siteDescription as string) || (t.footer?.brandDescription as string) || ''

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template: `%s | Agricon`,
    },
    description: siteDescription,
    alternates: localizedAlternates(locale as Locale, rel),    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : `${locale}_${(locale as string).toUpperCase()}`,
      siteName: 'Agricon',
      title: siteTitle,
      description: siteDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0c5d3f',
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  const dir = isRtl(locale as Locale) ? 'rtl' : 'ltr'
  const siteSettings = await getSiteSettings(locale)
  // 当前请求路径（由 proxy.ts 注入），用于生成正确的 hreflang / canonical
  const h = await headers()
  const _pathname = h.get('x-pathname') || ''
  type SiteSettingsWithQr = NonNullable<typeof siteSettings> & {
    tiktokQrCode?: number | { url?: string | null } | null
    instagramQrCode?: number | { url?: string | null } | null
  }
  const settingsWithQr = siteSettings as SiteSettingsWithQr | null
  const qrCodes = {
    // 临时预览二维码：后台上传真实二维码后会自动覆盖
    tiktok: (typeof settingsWithQr?.tiktokQrCode === 'object' ? settingsWithQr.tiktokQrCode?.url || undefined : undefined) || '/images/qr/tiktok-preview.png',
    instagram: (typeof settingsWithQr?.instagramQrCode === 'object' ? settingsWithQr.instagramQrCode?.url || undefined : undefined) || '/images/qr/instagram-preview.png',
  }
  const footerSettings = {
    siteTagline: settingsWithQr?.siteTagline,
    address: settingsWithQr?.address,
    socialLinks: settingsWithQr?.socialLinks as
      | { linkedin?: string | null; facebook?: string | null; instagram?: string | null; youtube?: string | null }
      | null
      | undefined,
    contactEmail: settingsWithQr?.contactEmail,
    contactPhone: settingsWithQr?.contactPhone,
  }

  // 当前路径（由 proxy.ts 注入），传递给 Footer 以保持语言切换位置
  const h2 = await headers()
  const currentPath = h2.get('x-pathname') || `/${locale}`

  return (
    <>
      <div lang={locale} dir={dir} className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] antialiased page-enter">
        <Header locale={locale as Locale} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Newsletter locale={locale as Locale} />
        <Footer locale={locale as Locale} currentPath={currentPath} qrCodes={qrCodes} settings={footerSettings} />
      </div>
      {/* Root page animation must not become the containing block for viewport-fixed actions. */}
      <FloatingActions locale={locale as Locale} whatsappNumber={siteSettings?.whatsappNumber} />
    </>
  )
}
