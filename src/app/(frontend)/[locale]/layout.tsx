import type { Metadata, Viewport } from 'next'
import { getTranslations, locales, isRtl, type Locale } from '@/i18n/config'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Newsletter from '@/components/Newsletter'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')

  return {
    title: {
      default: 'Agricon - Poultry & Livestock Equipment Solutions',
      template: '%s | Agricon',
    },
    description: t.footer?.brandDescription || 'Poultry & Livestock Equipment Solutions',
    alternates: {
      languages: Object.fromEntries(
        locales.map(l => [l, l === 'en' ? '/' : `/${l}`])
      ),
    },
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : `${locale}_${(locale as string).toUpperCase()}`,
      siteName: 'Agricon',
      title: 'Agricon - Poultry & Livestock Equipment Solutions',
      description: t.footer?.brandDescription || 'Poultry & Livestock Equipment Solutions',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Agricon - Poultry & Livestock Equipment Solutions',
      description: t.footer?.brandDescription || 'Poultry & Livestock Equipment Solutions',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#1a5c38',
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  const dir = isRtl(locale as Locale) ? 'rtl' : 'ltr'

  return (
    <div lang={locale} dir={dir} className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] antialiased page-enter">
      <Header locale={locale as Locale} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Newsletter locale={locale as Locale} />
      <Footer locale={locale as Locale} />
    </div>
  )
}
