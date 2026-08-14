import type { Locale } from '@/i18n/config'
import ProductCategories from '@/components/home/ProductCategories'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import SolutionsSection from '@/components/home/SolutionsSection'
import StatsSection from '@/components/home/StatsSection'
import WhyChooseUs from '@/components/home/WhyChooseUs'
import Testimonials from '@/components/home/Testimonials'
import LatestNews from '@/components/home/LatestNews'
import GlobalCoverage from '@/components/home/GlobalCoverage'
import HowWeWork from '@/components/home/HowWeWork'
import TrustEvidence from '@/components/home/TrustEvidence'
import ValueCalculated from '@/components/home/ValueCalculated'
import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import MediaImage from '@/components/ui/MediaImage'
import { getSiteSettings } from '@/lib/payload'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const settings = await getSiteSettings()
  const stats = (settings?.stats ?? {}) as { countriesServed?: string; farmProjects?: string; yearsInBusiness?: string; onTimeDelivery?: string; equipmentModels?: string }
  const hero = (settings?.hero ?? {}) as {
    eyebrow?: string | null
    title?: string | null
    titleAccent?: string | null
    description?: string | null
    image?: number | { url?: string | null } | null
    primaryButton?: string | null
    secondaryButton?: string | null
  }
  const heroStats = [
    `${stats.equipmentModels || '10+'} Product Categories`,
    `${stats.countriesServed || '30+'} Export Markets`,
    `${stats.farmProjects || '100+'} Farm Projects`,
  ]
  const heroImage = typeof hero.image === 'object' && hero.image?.url ? hero.image.url : '/images/home-hero-agricon.png'

  return (
    <>
      {/* ── HERO — {component.cover-hero}: full-bleed photo + brand-green overlay ── */}
      <section className="hero-standard relative overflow-hidden bg-[var(--color-surface-brand)] text-white">
        <div className="absolute inset-0">
          <MediaImage
            src={heroImage}
            alt="Commercial farm with modern agricultural equipment"
            width={1920}
            height={1080}
            priority
            className="w-full h-full object-cover object-bottom"
          />
          <div className="absolute inset-0 photo-overlay-green" />
        </div>
        <div className="hero-standard-content relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 lg:pt-36 lg:pb-32">
          <div className="max-w-3xl">
            <Reveal>
              <span className="eyebrow !text-[var(--color-accent-soft)] mb-5">{hero.eyebrow || 'Farm systems, engineered for growth'}</span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.02] tracking-[-0.02em] text-white">
                {hero.title || 'Farm Equipment Built'}
                <br />
                <span className="split-accent !text-[var(--color-accent)]">{hero.titleAccent || 'for Growth'}</span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <span className="block w-14 h-[3px] bg-[var(--color-accent)] mt-6" aria-hidden="true" />
              <p className="mt-6 text-base md:text-lg text-white/85 max-w-xl leading-relaxed">
                {hero.description || 'Practical equipment solutions for farms, importers, distributors and agricultural projects worldwide.'}
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 mt-9">
                <a
                  href={`/${locale}/products`}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-[var(--color-primary)] font-semibold rounded-sm min-h-[50px] press tap-target text-base transition-all hover:bg-white/90"
                >
                  {hero.primaryButton || 'Explore Products'}
                  <Icon name="arrow-right" size={18} className="text-[var(--color-accent)]" />
                </a>
                <a
                  href={`/${locale}/contact`}
                  className="inline-flex items-center justify-center px-7 py-4 border border-white/40 text-white font-semibold rounded-sm min-h-[50px] press tap-target text-base transition-all hover:bg-white/10"
                >
                  {hero.secondaryButton || 'Get a Free Quote'}
                </a>
              </div>
            </Reveal>
            {/* Bottom service labels separated by orange rules — {component.cover-hero} */}
            <Reveal delay={400}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-11 pt-5 border-t border-white/25">
                {heroStats.map((label, i) => (
                  <span key={label} className="flex items-center gap-5 text-xs md:text-sm font-medium text-white/90">
                    {i > 0 && <span className="w-px h-4 bg-[var(--color-accent)]" aria-hidden="true" />}
                    {label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <StatsSection locale={locale as Locale} />
      <ProductCategories locale={locale as Locale} />
      <FeaturedProducts locale={locale as Locale} />
      <ValueCalculated />
      <SolutionsSection locale={locale as Locale} />
      <HowWeWork />
      <WhyChooseUs />
      <TrustEvidence />
      <GlobalCoverage />
      <Testimonials />
      <LatestNews locale={locale as Locale} />

      {/* ── Final CTA — flat brand-green panel with orange rule ── */}
      <section className="relative bg-[var(--color-surface-brand)] text-white py-20 md:py-28 px-6">
        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="split-color-title text-3xl md:text-5xl font-bold tracking-[-0.015em] text-white">
              Ready to Build <span className="split-accent !text-[var(--color-accent)]">Your Farm?</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-5 text-base md:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
              Get a customized quotation with shipping to your port — our engineers will design the optimal layout for your facility.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-9">
              <a
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[var(--color-primary)] font-bold rounded-sm min-h-[52px] press tap-target text-lg transition-all hover:bg-white/90"
              >
                Request a Quote
                <Icon name="arrow-right" size={18} className="text-[var(--color-accent)]" />
              </a>
              <a
                href={`/${locale}/case-studies`}
                className="inline-flex items-center justify-center px-10 py-4 border border-white/30 text-white font-semibold rounded-sm min-h-[52px] press tap-target text-lg transition-all hover:bg-white/10"
              >
                See Case Studies
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
