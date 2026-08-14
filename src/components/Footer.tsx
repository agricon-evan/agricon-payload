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
  settings?: {
    siteTagline?: string | null
    address?: string | null
    socialLinks?: { linkedin?: string | null; facebook?: string | null; instagram?: string | null; youtube?: string | null } | null
    contactEmail?: string | null
    contactPhone?: string | null
  }
}

const SOCIAL_ICONS: Record<string, string> = {
  linkedin: 'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z',
  facebook: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z',
  instagram: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.35 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.35-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.35-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.35 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.48 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z',
  youtube: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.55 15.57V8.43L15.82 12z',
}

export default function Footer({ locale, currentPath = `/${locale}`, qrCodes, settings }: Props) {
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
              {settings?.siteTagline || ft.brandDescription || 'Poultry & Livestock Equipment Solutions'}
            </p>
            {(settings?.address || settings?.contactEmail || settings?.contactPhone) && (
              <div className="mt-4 space-y-1.5 text-[13px] text-white/60 leading-relaxed">
                {settings.address && <p>{settings.address}</p>}
                <div className="flex flex-wrap gap-x-5">
                  {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">{settings.contactEmail}</a>}
                  {settings.contactPhone && <a href={`tel:${settings.contactPhone.replace(/[^+\d]/g, '')}`} className="hover:text-white transition-colors">{settings.contactPhone}</a>}
                </div>
              </div>
            )}
            {settings?.socialLinks && (
              <div className="flex items-center gap-2.5 mt-4" aria-label="Social media">
                {(['linkedin', 'facebook', 'instagram', 'youtube'] as const).map((net) => {
                  const url = settings.socialLinks?.[net]
                  if (!url) return null
                  return (
                    <a
                      key={net}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={net}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-sm bg-white/10 text-white/75 hover:bg-[var(--color-accent)] hover:text-white transition-colors tap-target"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d={SOCIAL_ICONS[net]} />
                      </svg>
                    </a>
                  )
                })}
              </div>
            )}
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
