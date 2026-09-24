import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { pageMetadata } from '@/lib/seo'
import { getSiteSettings } from '@/lib/payload'
import { resolvePageHeroImage } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'
import StatsSection from '@/components/home/StatsSection'

// 画册公司照片（p8 Why AGRICON）
const COMPANY_PHOTOS = [
  '/catalog/pages/p8_1.jpg',
  '/catalog/pages/p8_2.jpg',
  '/catalog/pages/p8_3.jpg',
  '/catalog/pages/p8_4.jpg',
  '/catalog/pages/p8_5.jpg',
]
// 产品生态图带 — 10 大产品分类各一张（源画册 p9 中 p9_4/p9_7 为空白占位，弃用）
const ECOSYSTEM_PHOTOS = [
  '/catalog/categories/poultry-equipment.jpg',
  '/catalog/categories/livestock-equipment.jpg',
  '/catalog/categories/aquaculture-equipment.jpg',
  '/catalog/categories/agriculture-machinery.jpg',
  '/catalog/categories/breeding-house-equipment.jpg',
  '/catalog/categories/slaughter-equipment.jpg',
  '/catalog/categories/farming-tools.jpg',
  '/catalog/categories/farming-vehicles.jpg',
  '/catalog/categories/wire-mesh-fencing.jpg',
  '/catalog/categories/other-machines.jpg',
]

// Bento spans for the ecosystem band (applied from `sm` up, where the grid is 5 wide).
// Traced through CSS grid auto-placement so the mosaic packs exactly with no holes:
//   row 1: [ A A ][ B B ][ C ]
//   row 2: [ A A ][ D ][ E ][ F ]
//   row 3: [ G G ][ H ][ I ][ J ]
const ECOSYSTEM_SPANS: string[] = [
  'sm:col-span-2 sm:row-span-2', // A — 2×2 lead tile
  'sm:col-span-2',               // B — wide
  '',                            // C
  '',                            // D
  '',                            // E
  '',                            // F
  'sm:col-span-2',               // G — wide
  '',                            // H
  '',                            // I
  '',                            // J
]

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return pageMetadata(locale as Locale, {
    path: '/about',
    namespace: 'pages',
    key: 'about',
    title: 'About Us',
    description:
      'Agricon supplies poultry, livestock and farm machinery to commercial farms worldwide. See how we work, what we build and who you deal with.',
  })
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('about', '/images/heroes/farm-crop.jpg', locale)
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const tPages = getTranslations(locale as Locale, 'pages')
  const settings = await getSiteSettings(locale)
  // NOTE: `settings.stats` is intentionally not read here. `<StatsSection>`
  // below owns that data and reads SiteSettings itself; a local copy was left
  // behind when the block moved to this page and only ever produced an unused
  // variable.
  const claims = settings?.claims as { iso9001?: boolean | null; ceMarked?: boolean | null; galvanizedLifespan?: string | null } | null | undefined

  // Commitments — non-certification promises drawn from the company's operating
  // model (not third-party certifications). Galvanized lifespan reads from SiteSettings.
  const claimItems = [
    { key: 'integratedSupply', icon: 'layers', title: 'Integrated Equipment Supply', desc: 'Poultry, livestock, feed processing, aquaculture, infrastructure and machinery coordinated through one supply window.' },
    { key: 'exportReadyDelivery', icon: 'truck', title: 'Export-Ready Delivery', desc: 'Export packing, product identification, loading plans, container coordination and shipping documents for overseas buyers.' },
    // SiteSettings wins when set; otherwise the localized copy, then the English fallback.
    { key: 'galvanized', icon: 'factory', title: 'Hot-Dip Galvanized', desc: claims?.galvanizedLifespan || tPages.about?.commitments?.items?.galvanized?.description || '15–20 years service life (hot-dip galvanized steel).' },
  ]

  const milestones = [
    { key: 'inquiry', year: '01', title: 'Inquiry', desc: 'Understand farm type, capacity, product interest, application scenario and purchasing purpose.' },
    { key: 'analysis', year: '02', title: 'Analysis', desc: 'Review project conditions, operating goals, site requirements and budget expectations.' },
    { key: 'matching', year: '03', title: 'Matching', desc: 'Select suitable equipment, product lines and accessory packages for the real project.' },
    { key: 'confirmation', year: '04', title: 'Confirmation', desc: 'Finalize product models, quantities, specifications, packing and shipment planning.' },
    { key: 'delivery', year: '05', title: 'Delivery', desc: 'Coordinate export packing, loading plans, documents and international shipment support.' },
    { key: 'support', year: '06', title: 'Support', desc: 'Continue with product information, spare parts, repeat orders and project expansion.' },
  ]

  const values = [
    { key: 'integratedSupply', icon: 'layers', title: 'Integrated Supply', desc: 'Multiple agricultural equipment categories coordinated through one supply window.' },
    { key: 'projectMatching', icon: 'target', title: 'Project Matching', desc: 'Equipment selection based on farm type, capacity, site conditions and application needs.' },
    { key: 'exportSupport', icon: 'truck', title: 'Export Support', desc: 'Packing, loading, documentation and shipment coordination for overseas buyers.' },
    { key: 'longTermCooperation', icon: 'handshake', title: 'Long-term Cooperation', desc: 'Repeat orders, expansion projects and coordinated supplier support for growing operations.' },
  ]

  const certs = [
    { key: 'orderConfirmation', icon: 'shield', title: 'Order Confirmation', desc: 'Specifications, quantities and shipping requirements reviewed.' },
    { key: 'exportPacking', icon: 'package', title: 'Export Packing', desc: 'Products packed and clearly labeled for international transportation.' },
    { key: 'containerLoading', icon: 'truck', title: 'Container Loading', desc: 'Loading plans organized for single or mixed equipment orders.' },
    { key: 'shippingDocuments', icon: 'file-text', title: 'Shipping Documents', desc: 'Commercial documents prepared according to order requirements.' },
  ]

  const principles = [
    { key: 'coordinatedSourcing', icon: 'layers', title: 'Coordinated Sourcing', desc: 'Poultry, livestock, feed processing, aquaculture, infrastructure and machinery through one supply window.' },
    { key: 'qualityControl', icon: 'shield', title: 'Quality & Order Control', desc: 'Product scope, specifications, quantities and key inspection points confirmed before shipment.' },
    { key: 'projectSelection', icon: 'target', title: 'Project-Based Selection', desc: 'Solutions matched to farm type, capacity, site conditions, operation requirements and budget.' },
    { key: 'exportDelivery', icon: 'truck', title: 'Export-Ready Delivery', desc: 'Export packing, product identification, loading plans, container coordination and shipping documents.' },
    { key: 'distributorSupport', icon: 'users', title: 'Distributor Support', desc: 'Flexible product combinations, repeat-order support and local market development assistance.' },
    { key: 'partnership', icon: 'handshake', title: 'Practical Partnership', desc: 'From individual equipment orders to complete project packages and future expansion support.' },
  ]

  return (
    <>
      <PageHero
        locale={locale as Locale}
        title={t.nav?.about || 'About Agricon'}
        description={tPages.about?.hero?.description || 'Practical equipment, integrated supply and global export support for farms and agricultural projects.'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.about || 'About'}`}
        image={heroImage}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* 上方内容：左右等高；下方图片与整个内容容器同宽 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
          <Reveal className="h-full">
            <div className="h-full flex flex-col">
              <SectionHeading align="left" eyebrow={tPages.about?.sections?.story?.eyebrow || 'Our Story'} title={tPages.about?.sections?.story?.title || 'Building the Backbone of Modern Farms'} />
              <div className="space-y-5 text-[var(--color-text-secondary)] leading-relaxed mt-2 flex-1">
                <p>
                  {tPages.about?.sections?.story?.p1 || 'AGRICON provides integrated agricultural equipment solutions for farms, importers, distributors and agricultural project buyers worldwide.'}
                </p>
                <p>
                  {tPages.about?.sections?.story?.p2 || 'AGRICON works with specialized manufacturing partners to coordinate equipment sourcing, project matching, quality control and export preparation for overseas buyers.'}
                </p>
                <p>
                  {tPages.about?.sections?.story?.p3 || 'From individual equipment orders to complete project packages, we connect practical products with real farm requirements across farming, processing, infrastructure and machinery applications.'}
                </p>
              </div>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-4 items-stretch">
            {values.map((v, i) => (
              <Reveal key={v.key} delay={i * 80} className="h-full">
                <div className="card card-hover p-6 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-4">
                    <Icon name={v.icon} size={20} />
                  </div>
                  <h3 className="text-[var(--color-text)]">{tPages.about?.values?.items?.[v.key]?.title || v.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">{tPages.about?.values?.items?.[v.key]?.description || v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* 3 张图片横跨整个内容宽度，与上方左右内容对齐 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-10">
          {COMPANY_PHOTOS.slice(0, 3).map((src) => (
            <MediaImage key={src} src={src} alt="AGRICON farm equipment and factory" width={640} height={420} loading="lazy" className="w-full aspect-[3/2] object-cover rounded-lg" />
          ))}
        </div>
      </section>

      {/* Business principles — from company operating doctrine */}
      <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <SectionHeading
              eyebrow={tPages.about?.sections?.principles?.eyebrow || 'Our Operating Principles'}
              title={tPages.about?.sections?.principles?.title || 'How We Do Business'}
              description={tPages.about?.sections?.principles?.description || 'Six principles guide every project — from first inquiry to after-sales'}
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10">
            {principles.map((p, i) => (
              <Reveal key={p.key} delay={(i % 3) * 80} className="h-full">
                <div className="card card-hover p-6 h-full">
                  <div className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-4">
                    <Icon name={p.icon} size={20} />
                  </div>
                  <h3 className="text-[var(--color-text)]">{tPages.about?.principles?.items?.[p.key]?.title || p.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{tPages.about?.principles?.items?.[p.key]?.description || p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 产品生态照片带 — 画册 p9. Deliberately uneven: one 2×2 lead tile, three 2×1
          wide tiles and six squares, so the band reads as a mosaic rather than a
          uniform contact sheet. Span classes only apply from `sm` up (5 columns);
          below that everything is a single square for a predictable mobile layout. */}
      <section className="bg-[var(--color-primary)] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <SectionHeading
              eyebrow={tPages.about?.sections?.ecosystem?.eyebrow || 'Product Ecosystem'}
              title={<>{tPages.about?.sections?.ecosystem?.titleLead || 'An Integrated'} <span className="split-accent !text-[var(--color-accent)]">{tPages.about?.sections?.ecosystem?.titleAccent || 'Equipment Ecosystem'}</span></>}
              description={tPages.about?.sections?.ecosystem?.description || 'Breeding, feeding, housing, processing and daily farm operation — all through one coordinated supply window.'}
              dark
            />
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4 mt-10">
            {ECOSYSTEM_PHOTOS.map((src, i) => {
              const span = ECOSYSTEM_SPANS[i]
              return (
                <Reveal key={src} delay={(i % 5) * 60} className={span || undefined}>
                  {/* The photo is absolutely positioned so it contributes no intrinsic
                      height — the square tiles alone drive the row heights, and the
                      spanning tiles simply stretch into them. */}
                  <div className={`relative rounded-lg overflow-hidden bg-[var(--color-primary-dark)]/40 ${span ? 'h-full' : 'aspect-square'}`}>
                    <MediaImage src={src} alt="AGRICON equipment ecosystem" width={640} height={640} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats — full "Numbers That Speak for Themselves" block (moved here from homepage) */}
      <StatsSection locale={locale as Locale} />

      {/* Commitments — fixed three-card block (no third-party certifications) */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <Reveal>
            <SectionHeading
              eyebrow={tPages.about?.sections?.commitments?.eyebrow || 'Our Commitments'}
              title={<>{tPages.about?.sections?.commitments?.titleLead || 'Practical'} <span className="split-accent">{tPages.about?.sections?.commitments?.titleAccent || 'Commitments'}</span></>}
              description={tPages.about?.sections?.commitments?.description || 'How AGRICON supports equipment supply and delivery for farms and agricultural projects worldwide.'}
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10">
            {claimItems.map((c, i) => (
              <Reveal key={c.key} delay={(i % 3) * 80} className="h-full">
                <div className="card card-hover p-6 h-full flex flex-col items-start">
                  <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-4">
                    <Icon name={c.icon} size={22} />
                  </div>
                  <h3 className="text-[var(--color-text)]">{tPages.about?.commitments?.items?.[c.key]?.title || c.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{tPages.about?.commitments?.items?.[c.key]?.description || c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <Reveal>
          <SectionHeading eyebrow={tPages.about?.sections?.process?.eyebrow || 'Our Process'} title={tPages.about?.sections?.process?.title || 'From Inquiry to Long-term Support'} />
        </Reveal>
        <div className="relative border-l border-[var(--color-border)] ml-3 mt-10 space-y-10">
          {milestones.map((m, i) => (
            <Reveal key={m.key} delay={i * 60}>
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
                <div className="text-sm font-bold text-[var(--color-primary)]">{m.year}</div>
                <h3 className="mt-1 text-[var(--color-text)] text-lg">{tPages.about?.process?.items?.[m.key]?.title || m.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">{tPages.about?.process?.items?.[m.key]?.description || m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <SectionHeading eyebrow={tPages.about?.sections?.delivery?.eyebrow || 'Delivery Readiness'} title={tPages.about?.sections?.delivery?.title || 'Prepared for International Orders'} description={tPages.about?.sections?.delivery?.description || 'AGRICON coordinates the practical details that help overseas buyers move from confirmed order to shipment.'} />
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {certs.map((c, i) => (
              <Reveal key={c.key} delay={i * 80} className="h-full">
                <div className="card card-hover p-6 text-center h-full">
                  <div className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                    <Icon name={c.icon} size={20} />
                  </div>
                  <div className="font-semibold text-[var(--color-text)]">{tPages.about?.delivery?.items?.[c.key]?.title || c.title}</div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{tPages.about?.delivery?.items?.[c.key]?.description || c.desc}</p>
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
