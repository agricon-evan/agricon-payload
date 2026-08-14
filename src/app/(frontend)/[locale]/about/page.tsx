import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getSiteSettings } from '@/lib/payload'
import { resolvePageHeroImage } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'

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

interface Props {
  params: Promise<{ locale: string }>
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('about', '/images/heroes/farm-crop.jpg')
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const settings = await getSiteSettings()
  const stats = (settings?.stats ?? {}) as { countriesServed?: string; farmProjects?: string; yearsInBusiness?: string; onTimeDelivery?: string; equipmentModels?: string }
  const claims = settings?.claims as { iso9001?: boolean | null; ceMarked?: boolean | null; galvanizedLifespan?: string | null } | null | undefined

  // 认证与承诺 — 仅在后台配置了真实数据时展示
  const claimItems = [
    claims?.iso9001 ? { icon: 'award', title: 'ISO 9001 Certified', desc: 'Quality management system in place.' } : null,
    claims?.ceMarked ? { icon: 'shield', title: 'CE Marked', desc: 'Products meet EU safety requirements.' } : null,
    claims?.galvanizedLifespan ? { icon: 'factory', title: 'Hot-Dip Galvanized', desc: claims.galvanizedLifespan } : null,
  ].filter(Boolean) as Array<{ icon: string; title: string; desc: string }>

  const milestones = [
    { year: '01', title: 'Inquiry', desc: 'Understand farm type, capacity, product interest, application scenario and purchasing purpose.' },
    { year: '02', title: 'Analysis', desc: 'Review project conditions, operating goals, site requirements and budget expectations.' },
    { year: '03', title: 'Matching', desc: 'Select suitable equipment, product lines and accessory packages for the real project.' },
    { year: '04', title: 'Confirmation', desc: 'Finalize product models, quantities, specifications, packing and shipment planning.' },
    { year: '05', title: 'Delivery', desc: 'Coordinate export packing, loading plans, documents and international shipment support.' },
    { year: '06', title: 'Support', desc: 'Continue with product information, spare parts, repeat orders and project expansion.' },
  ]

  const values = [
    { icon: 'layers', title: 'Integrated Supply', desc: 'Multiple agricultural equipment categories coordinated through one supply window.' },
    { icon: 'target', title: 'Project Matching', desc: 'Equipment selection based on farm type, capacity, site conditions and application needs.' },
    { icon: 'truck', title: 'Export Support', desc: 'Packing, loading, documentation and shipment coordination for overseas buyers.' },
    { icon: 'handshake', title: 'Long-term Cooperation', desc: 'Repeat orders, expansion projects and coordinated supplier support for growing operations.' },
  ]

  const certs = [
    { icon: 'shield', title: 'Order Confirmation', desc: 'Specifications, quantities and shipping requirements reviewed.' },
    { icon: 'package', title: 'Export Packing', desc: 'Products packed and clearly labeled for international transportation.' },
    { icon: 'truck', title: 'Container Loading', desc: 'Loading plans organized for single or mixed equipment orders.' },
    { icon: 'file-text', title: 'Shipping Documents', desc: 'Commercial documents prepared according to order requirements.' },
  ]

  const principles = [
    { icon: 'layers', title: 'Coordinated Sourcing', desc: 'Poultry, livestock, feed processing, aquaculture, infrastructure and machinery through one supply window.' },
    { icon: 'shield', title: 'Quality & Order Control', desc: 'Product scope, specifications, quantities and key inspection points confirmed before shipment.' },
    { icon: 'target', title: 'Project-Based Selection', desc: 'Solutions matched to farm type, capacity, site conditions, operation requirements and budget.' },
    { icon: 'truck', title: 'Export-Ready Delivery', desc: 'Export packing, product identification, loading plans, container coordination and shipping documents.' },
    { icon: 'users', title: 'Distributor Support', desc: 'Flexible product combinations, repeat-order support and local market development assistance.' },
    { icon: 'handshake', title: 'Practical Partnership', desc: 'From individual equipment orders to complete project packages and future expansion support.' },
  ]

  return (
    <>
      <PageHero
        title={t.nav?.about || 'About Agricon'}
        description="Practical equipment, integrated supply and global export support for farms and agricultural projects."
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.about || 'About'}`}
        image={heroImage}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* 上方内容：左右等高；下方图片与整个内容容器同宽 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
          <Reveal className="h-full">
            <div className="h-full flex flex-col">
              <SectionHeading align="left" eyebrow="Our Story" title="Building the Backbone of Modern Farms" />
              <div className="space-y-5 text-[var(--color-text-secondary)] leading-relaxed mt-2 flex-1">
                <p>
                  AGRICON provides integrated agricultural equipment solutions for farms, importers, distributors and agricultural project buyers worldwide.
                </p>
                <p>
                  AGRICON works with specialized manufacturing partners to coordinate equipment sourcing, project matching, quality control and export preparation for overseas buyers.
                </p>
                <p>
                  From individual equipment orders to complete project packages, we connect practical products with real farm requirements across farming, processing, infrastructure and machinery applications.
                </p>
              </div>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-4 items-stretch">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 80} className="h-full">
                <div className="card card-hover p-6 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-4">
                    <Icon name={v.icon} size={20} />
                  </div>
                  <h3 className="text-[var(--color-text)]">{v.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">{v.desc}</p>
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

      {/* 产品生态照片带 — 画册 p9 */}
      <section className="bg-[var(--color-primary)] text-white py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Product Ecosystem"
              title={<>An Integrated <span className="split-accent !text-[var(--color-accent)]">Equipment Ecosystem</span></>}
              description="Breeding, feeding, housing, processing and daily farm operation — all through one coordinated supply window."
              dark
            />
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-10">
            {ECOSYSTEM_PHOTOS.map((src, i) => (
              <Reveal key={src} delay={(i % 5) * 60}>
                <div className="rounded-lg overflow-hidden aspect-square">
                  <MediaImage src={src} alt="AGRICON equipment ecosystem" width={320} height={320} loading="lazy" className="w-full h-full object-cover" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats — reads verified figures from SiteSettings */}
      <section className="bg-[var(--color-primary-dark)] text-white py-12 md:py-16">        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: stats.equipmentModels || '10+', label: 'Product Categories' },
            { num: stats.farmProjects || '100+', label: 'Farm Projects' },
            { num: stats.countriesServed || '30+', label: 'Export Markets' },
            { num: stats.yearsInBusiness || '15+', label: 'Years in Business' },
          ].map((s, i) => (
            <div key={s.label} className={`reveal reveal-fade-up stagger-${i + 1}`}>
              <div className="stat-num">{s.num}</div>
              <div className="mt-2 text-sm md:text-base opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications & commitments — only when configured in SiteSettings */}
      {claimItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Certifications & Standards"
              title={<>Verifiable <span className="split-accent">Standards</span></>}
              description="Manufacturing and quality commitments configured in Site Settings — shown only when the data is provided."
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10">
            {claimItems.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 80} className="h-full">
                <div className="card card-hover p-6 h-full flex flex-col items-start">
                  <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-4">
                    <Icon name={c.icon} size={22} />
                  </div>
                  <h3 className="text-[var(--color-text)]">{c.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <Reveal>
          <SectionHeading eyebrow="Our Process" title="From Inquiry to Long-term Support" />
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
            <SectionHeading eyebrow="Delivery Readiness" title="Prepared for International Orders" description="AGRICON coordinates the practical details that help overseas buyers move from confirmed order to shipment." />
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
