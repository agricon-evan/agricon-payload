import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { getTranslations, locales, isRtl, type Locale } from '@/i18n/config'
import { DEFAULT_OG_IMAGE, SITE_URL, localizedAlternates, ogLocale, stripLocaleFromPath } from '@/lib/seo'
import { graph, organizationSchema, webSiteSchema } from '@/lib/structured-data'
import JsonLd from '@/components/JsonLd'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Newsletter from '@/components/Newsletter'
import FloatingActions from '@/components/FloatingActions'
import { getSiteSettings } from '@/lib/payload'

// Skip-link label per locale. Kept here rather than in the i18n bundle: it is
// assistive-tech chrome and never appears in the visible UI.
const SKIP_TO_CONTENT: Record<string, string> = {
  en: 'Skip to content',
  ru: 'Перейти к содержимому',
  fr: 'Aller au contenu',
  es: 'Ir al contenido',
  sw: 'Nenda kwenye maudhui',
  ar: 'تخطَّ إلى المحتوى',
}

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

/**
 * Open Graph `og:locale` values live in `src/lib/seo.ts` (`OG_LOCALES`) so the
 * layout and `pageMetadata()` cannot drift apart. See that file for why the
 * naive `language_LANGUAGE` construction was wrong.
 */

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
    alternates: localizedAlternates(locale as Locale, rel),
    openGraph: {
      type: 'website',
      locale: ogLocale(locale),
      siteName: 'Agricon',
      title: siteTitle,
      description: siteDescription,
      // Without this every page except product details shared with no image at
      // all — `payload.config.ts`'s openGraph image only styles the admin panel.
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Agricon' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: [DEFAULT_OG_IMAGE],
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
  // Current request path, injected by proxy.ts as `x-pathname`. Read once and
  // reused for both the Footer language-switch target and nothing else — this
  // used to call `headers()` three times in the same render.
  const h = await headers()
  const currentPath = h.get('x-pathname') || `/${locale}`
  const currentSearch = h.get('x-search') || ''
  type SiteSettingsWithQr = NonNullable<typeof siteSettings> & {
    tiktokQrCode?: number | { url?: string | null } | null
    instagramQrCode?: number | { url?: string | null } | null
  }
  const settingsWithQr = siteSettings as SiteSettingsWithQr | null
  const qrCodes = {
    // Only real QR codes uploaded in the CMS are rendered. These previously
    // fell back to `/images/qr/*-preview.png`, which put placeholder QR images
    // (they do not resolve to the accounts) in the footer of the live site.
    // Footer omits the whole block when both are undefined.
    tiktok: typeof settingsWithQr?.tiktokQrCode === 'object' ? settingsWithQr.tiktokQrCode?.url || undefined : undefined,
    instagram: typeof settingsWithQr?.instagramQrCode === 'object' ? settingsWithQr.instagramQrCode?.url || undefined : undefined,
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

  return (
    <>
      {/* Site-wide structured data (schema.org). Products, FAQs and articles add
          their own nodes on top of this graph. See src/lib/structured-data.ts. */}
      <JsonLd
        data={graph([
          organizationSchema(settingsWithQr),
          webSiteSchema(locale, settingsWithQr),
        ])}
      />
      {/* Skip link (WCAG 2.4.1) — first focusable element, off-screen until focused.
          Deliberately OUTSIDE the .page-enter wrapper: that wrapper's entry animation
          sets a transform, which makes it a containing block and neutralises `fixed`.
          Parked above the viewport with a transform (not sr-only — its `position: static`
          would override `fixed`). */}
      <a
        href="#main-content"
        dir={dir}
        className="fixed top-4 start-4 z-[999] -translate-y-24 focus:translate-y-0 transition-transform bg-[var(--color-primary)] text-white font-semibold px-5 py-3 rounded-md"
      >
        {SKIP_TO_CONTENT[locale] || SKIP_TO_CONTENT.en}
      </a>
      <div lang={locale} dir={dir} className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] antialiased page-enter">
        <Header locale={locale as Locale} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Newsletter locale={locale as Locale} />
        <Footer locale={locale as Locale} currentPath={currentPath} currentSearch={currentSearch} qrCodes={qrCodes} settings={footerSettings} />
      </div>
      {/* Root page animation must not become the containing block for viewport-fixed actions. */}
      <FloatingActions locale={locale as Locale} whatsappNumber={siteSettings?.whatsappNumber} />
    </>
  )
}
