import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getTranslations, locales, localeNames } from '@/i18n/config'
import Icon from '@/components/ui/Icon'

interface Props {
  locale: Locale
}

export default function Footer({ locale }: Props) {
  const t = getTranslations(locale, 'common')
  const lp = locale === 'en' ? '' : `/${locale}`
  const ft = t.footer || {}
  const links = ft.links || {}
  const cols = ft.columns || {}

  const productLinks = [
    { label: links.poultrySolutions || 'Poultry Solutions', href: `${lp}/solutions` },
    { label: links.livestockSolutions || 'Livestock Solutions', href: `${lp}/solutions` },
    { label: links.feedProcessing || 'Feed Processing', href: `${lp}/solutions` },
    { label: links.farmInfrastructure || 'Farm Infrastructure', href: `${lp}/solutions` },
    { label: links.viewAllProducts || 'All Products', href: `${lp}/products` },
  ]
  const companyLinks = [
    { label: links.aboutAgricon || 'About Agricon', href: `${lp}/about` },
    { label: links.caseStudies || 'Case Studies', href: `${lp}/case-studies` },
    { label: links.blog || 'Blog', href: `${lp}/blog` },
    { label: links.distributors || 'Distributors', href: `${lp}/distributors` },
    { label: links.contact || 'Contact', href: `${lp}/contact` },
  ]
  const supportLinks = [
    { label: links.tradeSupport || 'Trade Support', href: `${lp}/trade-support` },
    { label: links.faq || 'FAQ', href: `${lp}/faq` },
    { label: links.technicalSupport || 'Technical Support', href: `${lp}/contact` },
    { label: links.privacyPolicy || 'Privacy Policy', href: `${lp}/privacy` },
    { label: links.termsOfService || 'Terms of Service', href: `${lp}/terms` },
  ]

  return (
    <footer className="bg-[var(--color-fg)] text-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-6 py-14 md:py-18">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href={lp || '/en'} className="flex items-center gap-2 text-xl font-bold mb-4">
              <Icon name="logo" size={22} strokeWidth={2} />
              Agricon
            </Link>
            <p className="text-sm opacity-60 leading-relaxed mt-3">
              {ft.brandDescription || 'Poultry & Livestock Equipment Solutions'}
            </p>
          </div>

          {/* Columns */}
          {[
            { title: cols.products || 'Products', items: productLinks },
            { title: cols.company || 'Company', items: companyLinks },
            { title: cols.support || 'Support', items: supportLinks },
          ].map(col => (
            <div key={col.title}>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-50">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.items.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm opacity-60 hover:opacity-100 transition-opacity tap-target inline-flex items-center">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm opacity-50">
          <p>{ft.copyright || '© 2026 Agricon. All rights reserved.'}</p>
          <div className="flex gap-4">
            {locales.map(loc => (
              <Link
                key={loc}
                href={loc === 'en' ? '/' : `/${loc}`}
                className={`tap-target inline-flex items-center ${loc === locale ? 'text-white font-semibold opacity-100' : ''}`}
              >
                {loc.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
