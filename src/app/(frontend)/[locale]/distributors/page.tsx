import { resolvePageHeroImage } from '@/lib/payload'
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

export default async function DistributorsPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('distributors', '/images/heroes/farm-machinery.jpg')
  const tDist = getTranslations(locale as Locale, 'distributors')
  const tHome = getTranslations(locale as Locale, 'home')
  const lp = `/${locale}`

  const benefits = [
    { icon: 'trending-up', title: 'Attractive Margins', desc: 'Competitive distributor pricing with volume-based tiered discounts. Your margins grow with your sales.' },
    { icon: 'sparkle', title: 'Marketing Support', desc: 'Product catalogs, brochures, display samples, and co-branded marketing materials included.' },
    { icon: 'book', title: 'Technical Training', desc: 'Product knowledge training and installation basics for your sales team — on-site or online.' },
    { icon: 'handshake', title: 'Territory Protection', desc: 'Exclusive distribution rights within your agreed region. No cross-competition from us.' },
    { icon: 'box', title: 'Drop-ship & Stock', desc: 'We ship directly to your customers or keep safety stock at your warehouse.' },
    { icon: 'users', title: 'Local-language Support', desc: 'English, French, Russian, Spanish, Swahili and Arabic sales support for your team.' },
  ]

  const requirements = [
    { icon: 'building', title: 'Established Business', desc: 'Active business entity with a minimum of 2 years in agricultural or industrial equipment sales.' },
    { icon: 'warehouse', title: 'Showroom or Distribution Center', desc: 'Physical location to display equipment and handle local customer inquiries.' },
    { icon: 'chart', title: 'Sales Capability', desc: 'Demonstrated ability to sell and support equipment products in your target market.' },
    { icon: 'gear', title: 'Technical Interest', desc: 'Willingness to learn our products and provide basic technical guidance to customers.' },
  ]

  return (
    <>
      <PageHero
        title={tDist.hero?.title || 'Become a Distributor'}
        description={tDist.hero?.description || 'Grow your business with a proven agricultural equipment partner'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / Distributors`}
        image={heroImage}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Why Partner With Us"
            title="A Partnership That Scales"
            description="Agricon distributors enjoy competitive advantages designed for long-term growth."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={(i % 3) * 80} className="h-full">
              <div className="card card-hover p-6 md:p-8 h-full">
                <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5">
                  <Icon name={b.icon} size={22} />
                </div>
                <h3 className="text-[var(--color-text)]">{b.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <SectionHeading eyebrow="Ideal Partners" title="What We Look For" />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10">
            {requirements.map((r, i) => (
              <Reveal key={r.title} delay={(i % 2) * 80} className="h-full">
                <div className="card card-hover flex gap-4 p-6 h-full">
                  <span className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                    <Icon name={r.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="text-[var(--color-text)]">{r.title}</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <Reveal>
          <div className="p-8 md:p-12 bg-[var(--color-primary)] text-white rounded-lg text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{tDist.applicationForm?.title || 'Apply to Become a Distributor'}</h2>
            <p className="mt-3 opacity-85 max-w-xl mx-auto leading-relaxed">
              {tDist.applicationForm?.description || 'Contact our international sales team with your business profile and target market. We will review and respond within 48 hours.'}
            </p>
            <a
              href={`${lp}/contact`}
              className="inline-flex items-center justify-center gap-2 mt-6 px-10 py-4 bg-white text-[var(--color-primary)] font-semibold rounded-sm min-h-[48px] press tap-target text-lg transition-colors hover:bg-white/90"
            >
              {tDist.applicationForm?.submit || 'Apply Now'}
              <Icon name="arrow-right" size={18} />
            </a>
          </div>
        </Reveal>
      </section>

      <CtaSection locale={locale as Locale} />
    </>
  )
}
