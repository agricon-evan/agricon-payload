import type { Locale } from '@/i18n/config'
import { getSolutions, getProducts, getCaseStudies } from '@/lib/payload'
import CtaSection from '@/components/CtaSection'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'
import SectionHeading from '@/components/ui/SectionHeading'
import { caseStudyImages } from '@/lib/images'
import type { Product } from '@/payload-types'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

function getProductPath(locale: string, product: Product) {
  const subcategory = typeof product.subcategory === 'object' && product.subcategory ? product.subcategory : null
  const category = subcategory && typeof subcategory.category === 'object' && subcategory.category ? subcategory.category : null
  return `/${locale}/products/${category?.slug || ''}/${subcategory?.slug || ''}/${product.slug}`
}

// 画册方案覆盖范围（factual scope from catalog category pages）— fallback 仅当 CMS 未填 features
const SOLUTION_FEATURES: Record<string, string[]> = {
  'poultry-farming': [
    'Layer cage systems for commercial egg production',
    'Broiler cages for meat chicken farming',
    'Chick cages and floor-rearing equipment',
    'Automatic feeding, drinking and egg collection',
    'Hatching and brooding equipment',
    'Cage and breeding accessories',
  ],
  'livestock-farming': [
    'Farm fence and cattle panels for livestock control',
    'Farrowing pens and pig farm equipment',
    'Goat pens and rabbit cages',
    'Livestock scales for weighing and management',
    'Feeding, drinking and handling accessories',
  ],
  'aquaculture': [
    'Water pumps for circulation and pond supply',
    'Aerators for oxygen support and water movement',
    'Fish ponds and pond farming systems',
    'Floating cages for lake and open-water farming',
    'Fish nets and aquaculture accessories',
  ],
  'feed-processing': [
    'Pellet machines and extruders for feed production',
    'Grinding machines and hammer mills',
    'Mixing and drying equipment',
    'Rice mills and chaff cutters',
    'Complete feed production lines',
  ],
  'breeding-house': [
    'Metal structures and farm buildings',
    'Greenhouses for protected growing',
    'Exhaust fans and cooling pads for ventilation',
    'Slatted floors and manure scrapers',
    'Feed silos and environment controllers',
    'Disinfection and biosecurity equipment',
  ],
  'farm-machinery': [
    'Tractors and walking tractors for field work',
    'Harvesters and seasonal collection machines',
    'Planters, sprayers and weed cutters',
    'Mist makers and irrigation equipment',
    'Egg handling machines and brick making machines',
  ],
}

// 相关项目（画册分级：Poultry / Livestock / Feed / Aquaculture / Machinery / Infrastructure）
const SOLUTION_CASES: Record<string, string[]> = {
  'poultry-farming': ['kenya-layer-farm', 'tanzania-layer-farm', 'tanzania-ventilation'],
  'livestock-farming': ['indonesia-goat-pen', 'africa-cattle-fence'],
  'aquaculture': ['philippines-fish-cage'],
  'feed-processing': ['ghana-feed-mill', 'nigeria-feed-production'],
  'breeding-house': ['ecuador-greenhouse'],
  'farm-machinery': ['se-asia-farm-machines', 'sa-crop-farming'],
}

const SOLUTION_IMAGE: Record<string, string> = {
  'poultry-farming': '/images/heroes/farm-landscape.jpg',
  'livestock-farming': '/images/heroes/farm-crop.jpg',
  'aquaculture': '/images/heroes/farm-field.jpg',
  'feed-processing': '/images/heroes/farm-machinery.jpg',
  'breeding-house': '/images/heroes/greenhouse.jpg',
  'farm-machinery': '/images/heroes/farm-machinery.jpg',
}

export const dynamic = 'force-dynamic'

export default async function SolutionDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const solutions = await getSolutions(locale)
  const solution = solutions.find((s) => s.slug === slug)

  if (!solution) {
    notFound()
  }

  const s = solution
  const [products, cases] = await Promise.all([getProducts(locale), getCaseStudies(locale)])

  // 关联产品：产品 → solutions 关系（画册导入已按分类映射）
  const solutionId = s.id
  const relatedProducts = products.filter((p) =>
    (p.solutions || []).some((rel) => (typeof rel === 'object' && rel !== null ? rel.id === solutionId : rel === solutionId))
  )
  const relatedCases = cases.filter((c) => (SOLUTION_CASES[s.slug] || []).includes(c.slug))

  const features =
    s.features && s.features.length > 0
      ? s.features.map((f) => (typeof f === 'object' && f !== null ? (f.feature ?? '') : String(f))).filter(Boolean)
      : SOLUTION_FEATURES[s.slug] || []

  const heroImage = SOLUTION_IMAGE[s.slug] || null

  return (
    <>
      <PageHero
        title={s.name}
        description={s.description || 'A complete, practical system designed around your farm capacity and operating conditions.'}
        breadcrumb={`${locale.toUpperCase()} / Solutions / ${s.name}`}
        image={heroImage}
      />

      <section className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        {/* Scope — {component.info-card} + orange bullets */}
        {features.length > 0 && (
          <div>
            <Reveal>
              <SectionHeading
                align="left"
                eyebrow="Solution Scope"
                title={<>What This Solution <span className="split-accent">Covers</span></>}
              />
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
              {features.map((f, i) => (
                <Reveal key={i} delay={(i % 2) * 60}>
                  <div className="flex items-start gap-3 p-4 card h-full">
                    <span className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center flex-shrink-0 font-semibold text-xs tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* Related products — real catalog products via solutions relation */}
        {relatedProducts.length > 0 && (
          <div className="mt-14">
            <Reveal>
              <SectionHeading
                align="left"
                eyebrow="Equipment Lines"
                title={<>Products in This <span className="split-accent">Solution</span></>}
              />
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {relatedProducts.slice(0, 8).map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 60} className="h-full">
                  <a href={getProductPath(locale, p)} className="card card-hover h-full block group">
                    <div className="aspect-[4/3] bg-[var(--color-muted)] overflow-hidden flex items-center justify-center icon-zoom">
                      {p.images?.[0]?.image && typeof p.images[0].image === 'object' && p.images[0].image.url ? (
                        <MediaImage src={p.images[0].image.url} alt={p.name} width={400} height={300} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Icon name="box" size={30} className="text-[var(--color-text-secondary)]/25" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-sm font-medium text-[var(--color-text)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">{p.name}</div>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* Related projects — 画册案例分级 */}
        {relatedCases.length > 0 && (
          <div className="mt-14">
            <Reveal>
              <SectionHeading
                align="left"
                eyebrow="Project References"
                title={<>Related <span className="split-accent">Projects</span></>}
              />
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
              {relatedCases.map((c, i) => (
                <Reveal key={c.id} delay={(i % 3) * 80} className="h-full">
                  <a href={`/${locale}/case-studies/${c.slug}`} className="card card-hover h-full block overflow-hidden group">
                    {caseStudyImages[c.slug] && (
                      <div className="aspect-video bg-[var(--color-muted)] overflow-hidden icon-zoom">
                        <MediaImage src={caseStudyImages[c.slug]} alt={c.title} width={600} height={340} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wide">
                        {typeof c.country === 'object' && c.country ? c.country.name || '' : c.country || ''}
                      </div>
                      <h3 className="mt-1.5 font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{c.title}</h3>
                      <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{c.summary || c.subtitle}</p>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* 6-step process — {component.solution-process-step} */}
        <div className="mt-16">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="How We Deliver"
              title={<>From Inquiry to <span className="split-accent">Installation</span></>}
            />
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-8">
            {['Inquiry', 'Analysis', 'Matching', 'Confirmation', 'Delivery', 'Support'].map((step, i) => (
              <Reveal key={step} delay={i * 60} className="h-full">
                <div className="card p-4 h-full text-center relative">
                  <span className="mx-auto w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <div className="mt-3 text-sm font-semibold text-[var(--color-text)]">{step}</div>
                  {i < 5 && (
                    <Icon name="chevron-right" size={14} className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 text-[var(--color-accent)]" />
                  )}
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
