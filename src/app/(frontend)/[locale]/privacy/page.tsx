import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'privacy')
  const tHome = getTranslations(locale as Locale, 'home')

  const sections = [
    { title: '1. Information We Collect', body: 'We collect information you provide directly when you contact us or submit an inquiry — your name, email address, company name, country, phone number, and the details of your inquiry. We may also collect technical data automatically, including browser type, device information, and pages visited, to improve our website performance.' },
    { title: '2. How We Use Your Information', body: 'We use your information to respond to inquiries, provide product information and quotations, coordinate shipping and delivery, and improve our products and services. We may also use your contact details to send you updates about products you have expressed interest in, with the ability to opt out at any time.' },
    { title: '3. Legal Basis for Processing', body: 'We process personal data based on your consent, the performance of a contract with you, our legitimate business interests, and compliance with legal obligations, as applicable under applicable data protection laws including the GDPR where relevant.' },
    { title: '4. Information Sharing', body: 'We do not sell your personal information. We may share it with trusted service providers who assist us in operating our website and fulfilling orders — such as freight forwarders, payment processors, and IT service providers — under confidentiality obligations.' },
    { title: '5. Data Retention', body: 'We retain inquiry records for as long as needed to serve you and meet legal, accounting, or reporting requirements. When data is no longer needed, we delete or anonymize it.' },
    { title: '6. Your Rights', body: 'Depending on your jurisdiction, you may have the right to access, correct, delete, or restrict the processing of your personal data, and to object to processing or request data portability. To exercise these rights, contact us using the details on our Contact page.' },
    { title: '7. Cookies', body: 'Our website uses essential cookies to function properly. We do not use third-party advertising cookies. You can control cookie settings through your browser.' },
    { title: '8. Security', body: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.' },
    { title: '9. International Transfers', body: 'As an export-oriented manufacturer, your data may be processed in China and other countries where our service providers operate. We ensure appropriate safeguards are in place for international data transfers.' },
    { title: '10. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. The latest version will always be available on this page, with the date of the last update shown below.' },
  ]

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <nav className="text-sm text-[var(--color-text-secondary)] mb-6 flex items-center gap-2">
        <a href={`/${locale}`} className="hover:text-[var(--color-primary)] transition-colors">{tHome.breadcrumb?.home || 'Home'}</a>
        <Icon name="chevron-right" size={12} />
        <span>{t.hero?.title || 'Privacy Policy'}</span>
      </nav>
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">{t.hero?.title || 'Privacy Policy'}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{t.lastUpdated || 'Last updated: January 1, 2026'}</p>
      <div className="mt-8 space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
        <p className="text-base">
          This Privacy Policy explains how Agricon collects, uses, and protects your personal information when you use our website and services. By using our website, you agree to the practices described in this policy.
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
            If you have questions about this policy or wish to exercise your rights, please contact us through our{' '}
            <a href={`/${locale}/contact`} className="text-[var(--color-primary)] font-medium hover:underline">contact page</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
