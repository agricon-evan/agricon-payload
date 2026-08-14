import Link from 'next/link'
import Image from 'next/image'
import type { Locale } from '@/i18n/config'
import { getTranslations, locales } from '@/i18n/config'

interface Props {
  locale: Locale
  /** 当前路径（含 locale 前缀），用于语言切换保持页面位置 */
  currentPath?: string
  qrCodes?: {
    tiktok?: string
    instagram?: string
  }
}

export default function Footer({ locale, currentPath = `/${locale}`, qrCodes }: Props) {
  const t = getTranslations(locale, 'common')
  const lp = `/${locale}`
  const ft = t.footer || {}
  const links = ft.links || {}
  const cols = ft.columns || {}

  // 语言切换时保留当前页面路径（/en/about → /ru/about）
  const localizedHref = (target: string): string => {
    let rest = currentPath
    for (const l of locales) {
      if (currentPath === `/${l}`) { rest = ''; break }
      if (currentPath.startsWith(`/${l}/`)) { rest = currentPath.slice(l.length + 1); break }
    }
    return `/${target}${rest}`
  }

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
    { label: links.videos || 'Videos', href: `${lp}/videos` },
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
    <footer className="bg-[var(--color-surface-brand)] text-white">
      {/* Orange rule — {component.footer-standard} grammar */}
      <div className="h-1 w-full bg-[var(--color-rule-orange)]" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.1fr_1.9fr] gap-10 md:gap-20 lg:gap-28">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href={lp || '/en'} className="inline-flex items-center gap-3 mb-4" aria-label="Agricon Home">
              <Image
                src="/company-logo.svg"
                alt="Agricon symbol"
                width={78}
                height={45}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
              <span className="font-display text-base font-bold tracking-[0.16em] text-white">AGRICON</span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed mt-3">
              {ft.brandDescription || 'Poultry & Livestock Equipment Solutions'}
            </p>
            {(qrCodes?.tiktok || qrCodes?.instagram) && (
              <div className="flex items-start gap-6 w-fit mt-6" aria-label="Social media QR codes">
                {qrCodes.tiktok && (
                  <div className="w-24 shrink-0 text-center">
                    <div className="w-24 h-24 bg-white p-1.5 rounded-sm">
                      <Image src={qrCodes.tiktok} alt="TikTok QR code" width={96} height={96} className="w-full h-full object-contain" />
                    </div>
                    <span className="block mt-2 text-[10px] uppercase tracking-[0.12em] text-white/65">TikTok</span>
                  </div>
                )}
                {qrCodes.instagram && (
                  <div className="w-24 shrink-0 text-center">
                    <div className="w-24 h-24 bg-white p-1.5 rounded-sm">
                      <Image src={qrCodes.instagram} alt="Instagram QR code" width={96} height={96} className="w-full h-full object-contain" />
                    </div>
                    <span className="block mt-2 text-[10px] uppercase tracking-[0.12em] text-white/65">Instagram</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Site map — visually separated from the brand/contact column */}
          <div className="sm:col-span-2 md:col-span-1 grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-8 lg:gap-12 md:border-l md:border-white/15 md:pl-16 lg:pl-20">
            {[
              { title: cols.products || 'Products', items: productLinks },
              { title: cols.company || 'Company', items: companyLinks },
              { title: cols.support || 'Support', items: supportLinks },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-white/55">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.items.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors tap-target inline-flex items-center">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/65">
          <p>{ft.copyright || '© 2026 Agricon. All rights reserved.'}</p>
          <div className="flex gap-4">
            {locales.map(loc => (
              <Link
                key={loc}
                href={localizedHref(loc)}
                className={`tap-target inline-flex items-center uppercase tracking-wide text-xs ${loc === locale ? 'text-[var(--color-accent-soft)] font-semibold' : 'text-white/65 hover:text-white'}`}
              >
                {loc}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
