import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function TradeSupportPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tTrade = getTranslations(locale as Locale, 'trade-support')
  const tHome = getTranslations(locale as Locale, 'home')

  const services = [
    { icon: 'truck', title: 'Export Logistics', desc: 'Full export documentation, container loading supervision, and sea/air freight coordination to your port.', highlights: ['Bill of Lading', 'Certificate of Origin', 'Phytosanitary Cert', 'Fumigation Cert'] },
    { icon: 'tag', title: 'OEM & ODM', desc: 'Custom branding, logo, color, and specifications on standard and custom equipment models.', highlights: ['Private Labeling', 'Custom Colors', 'Custom Capacity', 'Logo Etching'] },
    { icon: 'credit-card', title: 'Flexible Payment', desc: 'Secure international payment methods with options suitable for new and repeat customers.', highlights: ['T/T Wire Transfer', 'L/C Letter of Credit', '30% Deposit', 'Milestone Payments'] },
    { icon: 'gear', title: 'Installation Support', desc: 'On-site technical support, installation drawings, video guidance, and training for your maintenance team.', highlights: ['Video Tutorials', 'On-site Training', 'Spare Parts Kit', '24/7 WhatsApp Support'] },
    { icon: 'box', title: 'Packaging', desc: 'Equipment is packed for ocean freight — moisture-resistant, properly labeled, and optimized for container efficiency.', highlights: ['Fumigated Wood', 'Moisture Barrier', 'Container Optimization', 'Custom Labeling'] },
    { icon: 'shield', title: 'After-sales Warranty', desc: 'Comprehensive warranty on all equipment with prompt replacement of any defective parts.', highlights: ['18-Month Warranty', 'Lifetime Spare Parts', 'Remote Diagnostics', 'Response in 24h'] },
  ]

  const steps = [
    { num: '01', title: 'Consultation', desc: 'Tell us your farm size, birds, and goals. We help you select the right equipment and layout.' },
    { num: '02', title: 'Design & Quote', desc: 'Receive a detailed quotation with equipment list, 3D layout, and shipping estimate.' },
    { num: '03', title: 'Order & Manufacture', desc: 'Upon confirmation, manufacturing begins with quality control checks at each stage.' },
    { num: '04', title: 'Inspection & Shipping', desc: 'Final inspection at our factory before loading. Full documentation provided for customs.' },
    { num: '05', title: 'Installation', desc: 'Our technical team guides installation remotely or on-site, and trains your staff.' },
    { num: '06', title: 'After-sales', desc: 'Lifetime spare parts supply and technical support. We stay with your farm as it grows.' },
  ]

  const incoterms = [
    { code: 'FOB', title: 'Free on Board', desc: 'Standard for most customers. We handle export; you handle shipping from our port.' },
    { code: 'CIF', title: 'Cost, Insurance, Freight', desc: 'We arrange shipping and insurance to your destination port.' },
    { code: 'CFR', title: 'Cost and Freight', desc: 'Similar to CIF but without cargo insurance coverage.' },
  ]

  return (
    <>
      <PageHero
        title={t.nav?.tradeSupport || 'Trade Support'}
        description={tTrade.hero?.description || 'Complete export support for global farm equipment buyers'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.tradeSupport || 'Trade Support'}`}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <Reveal>
          <SectionHeading eyebrow="What We Handle" title="End-to-end Trade Support" description="From manufacturing to your farm gate — we manage the logistics so you can focus on farming." />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 80} className="h-full">
              <div className="card card-hover p-6 md:p-8 h-full">
                <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5">
                  <Icon name={s.icon} size={22} />
                </div>
                <h3 className="text-[var(--color-text)]">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{s.desc}</p>
                <ul className="mt-4 space-y-1.5">
                  {s.highlights.map(h => (
                    <li key={h} className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                      <Icon name="check" size={12} className="text-[var(--color-primary)] flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <SectionHeading eyebrow="How It Works" title="From Inquiry to Installation" />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {steps.map((s, i) => (
              <Reveal key={s.num} delay={(i % 2) * 80} className="h-full">
                <div className="card card-hover flex gap-5 p-6 h-full">
                  <span className="text-2xl font-bold text-[var(--color-primary)]/25 flex-shrink-0 tabular-nums">{s.num}</span>
                  <div>
                    <h3 className="text-[var(--color-text)]">{s.title}</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <Reveal>
          <SectionHeading eyebrow="Incoterms" title="Shipping Terms We Offer" description="Choose the term that works best for your import arrangement." />
        </Reveal>
        <div className="space-y-4 mt-10">
          {incoterms.map((i, idx) => (
            <Reveal key={i.code} delay={idx * 80}>
              <div className="card card-hover flex items-start gap-5 p-6">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-bold text-sm flex-shrink-0">
                  {i.code}
                </span>
                <div>
                  <h3 className="text-[var(--color-text)]">{i.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">{i.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaSection locale={locale as Locale} />
    </>
  )
}
