import type { Locale } from '@/i18n/config'
import ProductCategories from '@/components/home/ProductCategories'
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

interface Props {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params

  return (
    <>
      {/* ── HERO — flat, refined, mobile-first ── */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center bg-[var(--color-primary-dark)] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/home-hero.png" alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-dark)]/95 via-[var(--color-primary-dark)]/80 to-black/70" />
        </div>

        <div className="relative max-w-4xl px-6 py-24 md:py-32 text-center">
          <Reveal>
            <span className="inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-white/80 bg-white/10 px-4 py-2 rounded-full border border-white/15">
              Poultry &amp; Livestock Equipment Manufacturer
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
              Farm Equipment Built
              <br />
              <span className="text-[var(--color-primary-light)]">for Growth</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 text-base md:text-lg opacity-85 max-w-2xl mx-auto leading-relaxed">
              From egg incubation to feed processing — durable, export-ready equipment with full project support for commercial farms worldwide.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a
                href={`/${locale}/products`}
                className="inline-flex items-center justify-center gap-2 px-8 md:px-10 py-4 bg-[var(--color-accent)] text-white font-semibold rounded-md min-h-[48px] press tap-target text-base md:text-lg transition-colors hover:brightness-110"
              >
                Explore Products
                <Icon name="arrow-right" size={18} />
              </a>
              <a
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center px-8 md:px-10 py-4 border border-white/30 text-white font-semibold rounded-md min-h-[48px] press tap-target text-base md:text-lg transition-colors hover:bg-white/10"
              >
                Get a Free Quote
              </a>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <div className="flex flex-wrap justify-center gap-x-7 gap-y-2.5 mt-10 text-xs md:text-sm text-white/60">
              <span className="flex items-center gap-2">
                <Icon name="shield" size={15} /> ISO 9001 Certified
              </span>
              <span className="flex items-center gap-2">
                <Icon name="globe" size={15} /> 20+ Export Countries
              </span>
              <span className="flex items-center gap-2">
                <Icon name="award" size={15} /> 15-Year Durability
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <StatsSection locale={locale as Locale} />
      <ProductCategories locale={locale as Locale} />
      <ValueCalculated />
      <SolutionsSection locale={locale as Locale} />
      <HowWeWork />
      <WhyChooseUs />
      <TrustEvidence />
      <GlobalCoverage />
      <Testimonials />
      <LatestNews locale={locale as Locale} />

      {/* ── Final CTA ── */}
      <section className="bg-[var(--color-primary)] text-white py-16 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Ready to Build Your Farm?</h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-4 text-base md:text-lg opacity-85 max-w-xl mx-auto leading-relaxed">
              Get a customized quotation with shipping to your port — our engineers will design the optimal layout for your facility.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[var(--color-accent)] text-white font-bold rounded-md min-h-[52px] press tap-target text-lg transition-colors hover:brightness-110"
              >
                Request a Quote
                <Icon name="arrow-right" size={18} />
              </a>
              <a
                href={`/${locale}/case-studies`}
                className="inline-flex items-center justify-center px-10 py-4 border border-white/30 text-white font-semibold rounded-md min-h-[52px] press tap-target text-lg transition-colors hover:bg-white/10"
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
