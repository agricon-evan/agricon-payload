import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'terms')
  const tHome = getTranslations(locale as Locale, 'home')

  const sections = [
    { title: '1. Acceptance of Terms', body: 'By accessing or using the Agricon website, you agree to these Terms of Service. If you do not agree, please do not use this website.' },
    { title: '2. Product Information', body: 'Product specifications, images, and descriptions on this website are provided for general information. Actual specifications may vary and are confirmed in the formal quotation and contract for each order.' },
    { title: '3. Quotations and Orders', body: 'All quotations are valid for 30 days unless stated otherwise and are subject to confirmation. An order becomes binding only after written acceptance between both parties, including agreed pricing, specifications, delivery terms, and payment conditions.' },
    { title: '4. Pricing and Payment', body: 'Prices are quoted in the agreed currency and exclude taxes, duties, and shipping unless explicitly stated. Payment terms (deposit, balance, or letter of credit) are specified in the quotation and must be met before shipment.' },
    { title: '5. Shipping and Delivery', body: 'Delivery dates are estimates based on the production schedule and shipping availability. Agricon is not liable for delays caused by circumstances beyond our reasonable control, including customs, port congestion, or force majeure events.' },
    { title: '6. Warranty', body: 'Our equipment is covered by the warranty stated in the sales contract (typically 12–18 months from shipment). The warranty covers manufacturing defects and does not cover damage from misuse, improper installation, unauthorized modification, or normal wear and tear.' },
    { title: '7. Limitation of Liability', body: 'To the maximum extent permitted by law, Agricon shall not be liable for indirect, incidental, or consequential damages, including lost profits or production losses, arising from the use of our products or services.' },
    { title: '8. Intellectual Property', body: 'All content on this website — including text, graphics, logos, product images, and documentation — is the property of Agricon and may not be reproduced, distributed, or used without prior written permission.' },
    { title: '9. Third-Party Links', body: 'Our website may contain links to third-party websites for your convenience. We are not responsible for the content or privacy practices of these external sites.' },
    { title: '10. Governing Law', body: "These Terms are governed by the laws of the People's Republic of China. Any disputes shall be resolved through friendly negotiation, or if not resolved, through the competent courts of the parties' agreed jurisdiction." },
  ]

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <nav className="text-sm text-[var(--color-text-secondary)] mb-6 flex items-center gap-2">
        <a href={`/${locale}`} className="hover:text-[var(--color-primary)] transition-colors">{tHome.breadcrumb?.home || 'Home'}</a>
        <Icon name="chevron-right" size={12} />
        <span>{t.hero?.title || 'Terms of Service'}</span>
      </nav>
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">{t.hero?.title || 'Terms of Service'}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{t.lastUpdated || 'Last updated: January 1, 2026'}</p>
      <div className="mt-8 space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
        <p className="text-base">
          These Terms of Service govern your use of the Agricon website and the purchase of our products. Please read them carefully before using our services.
        </p>
        {sections.map(s => (
          <div key={s.title}>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">{s.title}</h2>
            <p className="text-sm">{s.body}</p>
          </div>
        ))}
        <div className="pt-6 border-t border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Contact</h2>
          <p className="text-sm">
            For questions about these Terms, contact us through our{' '}
            <a href={`/${locale}/contact`} className="text-[var(--color-primary)] font-medium hover:underline">contact page</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
