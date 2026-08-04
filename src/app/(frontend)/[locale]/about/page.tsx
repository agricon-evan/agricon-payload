import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getSiteSettings } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const settings = await getSiteSettings()

  const milestones = [
    { year: '2010', title: 'Founded', desc: 'Agricon established as a poultry equipment manufacturer in China, focused on export markets.' },
    { year: '2013', title: 'First 100 Projects', desc: 'Reached 100 delivered projects across Africa and Southeast Asia.' },
    { year: '2016', title: 'Feed Machinery Line', desc: 'Expanded into complete feed processing lines — grinding, mixing, pelleting.' },
    { year: '2019', title: 'Global Expansion', desc: 'Entered South American and CIS markets with local technical partners.' },
    { year: '2023', title: '500+ Projects', desc: 'Delivered over 500 farm projects in 20+ countries worldwide.' },
    { year: '2026', title: 'Smart Farming', desc: 'Introducing automation and IoT-enabled equipment for modern farms.' },
  ]

  const values = [
    { icon: 'target', title: 'Customer First', desc: 'Every project starts with understanding your goals, building, and budget.' },
    { icon: 'gear', title: 'Engineering Excellence', desc: 'Robust designs that survive heat, dust, humidity, and years of daily use.' },
    { icon: 'handshake', title: 'Long-term Partnership', desc: "We measure success by your farm's output, not just the sale." },
    { icon: 'sprout', title: 'Sustainable Farming', desc: 'Energy-efficient equipment that lowers your operating costs.' },
  ]

  const certs = [
    { icon: 'award', title: 'ISO 9001', desc: 'Quality management system' },
    { icon: 'shield', title: 'CE Certified', desc: 'European safety standards' },
    { icon: 'ruler', title: 'Galvanized Steel', desc: '15-year corrosion resistance' },
    { icon: 'clipboard', title: 'Full Testing', desc: 'Load & durability tested' },
  ]

  const principles = [
    { icon: 'compass', title: 'Direction First', desc: 'We define who we serve and how we win before scaling — every project starts with understanding your farm, not selling a machine.' },
    { icon: 'target', title: 'Right Customers', desc: 'We invest deeply in serious commercial projects and are transparent when a solution does not fit — honesty over quick sales.' },
    { icon: 'chart', title: 'Value, Calculated', desc: 'We translate specifications into outcomes — expected hatch rate, labor savings, and payback — so you can compare on value, not price.' },
    { icon: 'shield', title: 'Evidence Over Adjectives', desc: 'No "high quality, best price" claims without proof. QC reports, test data, and references are available for every key advantage.' },
    { icon: 'users', title: 'Progress Your Decision', desc: 'Every interaction moves you forward — a clearer specification, a better quotation, or a faster delivery plan.' },
    { icon: 'refresh', title: 'Scale After Proof', desc: 'We grow partnerships after results are proven — repeat customers in 80% of our markets are our real scorecard.' },
  ]

  return (
    <>
      <PageHero
        title={t.nav?.about || 'About Agricon'}
        description="A manufacturing partner for poultry & livestock farms worldwide"
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.about || 'About'}`}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <Reveal>
            <SectionHeading align="left" eyebrow="Our Story" title="Building the Backbone of Modern Farms" />
            <div className="space-y-5 text-[var(--color-text-secondary)] leading-relaxed mt-6">
              <p>
                Agricon started in 2010 with a simple observation: commercial farms in emerging markets were growing fast, but reliable, durable equipment was hard to find. Imported machinery was expensive; local alternatives failed within months.
              </p>
              <p>
                We built our first production line in China with one goal — equipment designed for the realities of tropical and subtropical farming: high heat, dust, humidity, and long supply chains where spare parts must last.
              </p>
              <p>
                Today, Agricon manufactures egg incubators, layer cages, broiler systems, feed processing lines, and complete farm infrastructure. Our engineers work with every customer from initial layout design through installation and after-sales support.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 80} className="h-full">
                <div className="card card-hover p-6 h-full">
                  <div className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-4">
                    <Icon name={v.icon} size={20} />
                  </div>
                  <h3 className="text-[var(--color-text)]">{v.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Business principles — from company operating doctrine */}
      <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Our Operating Principles"
              title="How We Do Business"
              description="Six principles guide every project — from first inquiry to after-sales"
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 80} className="h-full">
                <div className="card card-hover p-6 h-full">
                  <div className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-4">
                    <Icon name={p.icon} size={20} />
                  </div>
                  <h3 className="text-[var(--color-text)]">{p.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[var(--color-primary-dark)] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '20+', label: 'Countries Served' },
            { num: '500+', label: 'Projects Delivered' },
            { num: '15+', label: 'Years in Business' },
            { num: '200+', label: 'Equipment Models' },
          ].map((s, i) => (
            <div key={s.label} className={`reveal reveal-fade-up stagger-${i + 1}`}>
              <div className="stat-num">{s.num}</div>
              <div className="mt-2 text-sm md:text-base opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <Reveal>
          <SectionHeading eyebrow="Milestones" title="15 Years of Growth" />
        </Reveal>
        <div className="relative border-l border-[var(--color-border)] ml-3 mt-10 space-y-10">
          {milestones.map((m, i) => (
            <Reveal key={m.year} delay={i * 60}>
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
                <div className="text-sm font-bold text-[var(--color-primary)]">{m.year}</div>
                <h3 className="mt-1 text-[var(--color-text)] text-lg">{m.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">{m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <SectionHeading eyebrow="Quality Assurance" title="Certified Manufacturing" description="Every product line is built under controlled quality systems and tested before shipment." />
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {certs.map((c, i) => (
              <Reveal key={c.title} delay={i * 80} className="h-full">
                <div className="card card-hover p-6 text-center h-full">
                  <div className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                    <Icon name={c.icon} size={20} />
                  </div>
                  <div className="font-semibold text-[var(--color-text)]">{c.title}</div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaSection locale={locale as Locale} />
    </>
  )
}
