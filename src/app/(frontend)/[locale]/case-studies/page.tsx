import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getCaseStudies } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import { caseStudyImages, caseStudyGalleries } from '@/lib/images'
import MediaImage from '@/components/ui/MediaImage'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

// 画册案例分级：按应用领域组织项目证据，而不是把所有项目混成一个网格。
const CASE_GROUPS = [
  { key: 'poultry', label: 'Poultry Farm Cases', desc: 'Layer farms, broiler houses and ventilation systems' },
  { key: 'livestock', label: 'Livestock Farm Cases', desc: 'Goat pens, cattle yards and farm fencing' },
  { key: 'feed', label: 'Feed Mill Cases', desc: 'Feed processing lines and production support' },
  { key: 'aquaculture', label: 'Aquaculture Cases', desc: 'Fish cage and pond farming systems' },
  { key: 'machinery', label: 'Machinery & Infrastructure Cases', desc: 'Farm machines, greenhouses and crop support' },
] as const

function caseGroupKey(slug: string): string {
  if (/layer|broiler|chick|hatch|ventilat/i.test(slug)) return 'poultry'
  if (/goat|cattle|farrow|pig|rabbit|fence|pen/i.test(slug)) return 'livestock'
  if (/feed|mill|pellet|grind|mix/i.test(slug)) return 'feed'
  if (/fish|cage|aqua|pond/i.test(slug)) return 'aquaculture'
  return 'machinery'
}

function countryName(country: unknown, location?: string | null): string {
  if (country && typeof country === 'object' && 'name' in country) {
    return String(country.name || location || '')
  }
  return String(country || location || '')
}

export default async function CaseStudiesPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const cases = await getCaseStudies(locale)
  const lp = `/${locale}`

  const fallbackCases = [
    {
      id: 'kenya-layer', slug: 'kenya-layer-farm', title: 'Kenya Layer Farm', location: 'Kenya',
      farmName: 'Layer Poultry Farm', equipment: 'Layer cages, feeding and drinking systems',
      application: 'Commercial layer farm expansion', summary: 'A high-efficiency layer house planned around clean egg collection and reliable climate control.',
    },
    {
      id: 'ghana-feed', slug: 'ghana-feed-mill', title: 'Ghana Feed Mill', location: 'Ghana',
      farmName: 'Animal Feed Processing Project', equipment: 'Grinding, mixing, pelleting and packing support',
      application: 'Local poultry and livestock feed production', summary: 'A modular feed processing line designed around capacity, formulation control and delivery cost.',
    },
    {
      id: 'indonesia-livestock', slug: 'indonesia-goat-pen', title: 'Indonesia Livestock Project', location: 'Indonesia',
      farmName: 'Goat Farming Project', equipment: 'Goat pens, fencing, feeders and accessories',
      application: 'Organized goat housing and daily management', summary: 'A practical livestock setup balancing animal welfare, cleaning and durable infrastructure.',
    },
  ]

  const displayCases = cases.length > 0
    ? cases.map((cs) => ({
        id: cs.id,
        slug: cs.slug,
        title: cs.title,
        location: countryName(cs.country, cs.location),
        farmName: cs.farmName || 'Agricultural equipment project',
        equipment: cs.equipment || 'Integrated equipment package',
        application: cs.application || cs.summary || 'Project-based equipment supply',
        summary: cs.summary || cs.subtitle || '',
        image: caseStudyImages[cs.slug] || (typeof cs.image === 'object' && cs.image?.url ? cs.image.url : null),
        gallery: caseStudyGalleries[cs.slug] || (caseStudyImages[cs.slug] ? [caseStudyImages[cs.slug]] : []),
        group: caseGroupKey(cs.slug),
      }))
    : fallbackCases.map((cs) => ({
        ...cs,
        image: caseStudyImages[cs.slug] || null,
        gallery: caseStudyGalleries[cs.slug] || [],
        group: caseGroupKey(cs.slug),
      }))

  return (
    <>
      <PageHero
        title={t.nav?.caseStudies || 'Case Studies'}
        description="Real projects, real results — see how farms worldwide grow with Agricon"
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.caseStudies || 'Case Studies'}`}
        image="/images/heroes/farm-landscape.jpg"
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="eyebrow">Project Evidence</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-tight tracking-[-0.015em] text-[var(--color-text)]">
            Equipment matched to <span className="text-[var(--color-accent)]">real operations</span>
          </h2>
          <span className="orange-underline mt-4" aria-hidden="true" />
          <p className="mt-5 text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            Browse projects by application. Each story combines a project context, equipment package and practical delivery evidence.
          </p>
        </div>

        {CASE_GROUPS.map((group, groupIndex) => {
          const items = displayCases.filter((item) => item.group === group.key)
          if (!items.length) return null

          return (
            <section key={group.key} className={groupIndex > 0 ? 'mt-16 md:mt-24' : ''} aria-labelledby={`${group.key}-cases-title`}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
                <div>
                  <span className="section-ribbon">
                    {group.label}
                    <span className="chevron-trail" aria-hidden="true"><span /><span /><span /></span>
                  </span>
                  <h2 id={`${group.key}-cases-title`} className="mt-4 text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-[-0.01em]">
                    {group.label}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{group.desc}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-light)]">
                  {String(items.length).padStart(2, '0')} project{items.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {items.map((cs, index) => (
                  <Reveal key={cs.id} delay={(index % 2) * 80} className="h-full">
                    <article className="card card-hover h-full overflow-hidden grid grid-cols-1 md:grid-cols-[1.08fr_0.92fr] group">
                      <div className="min-w-0">
                        <a href={`${lp}/case-studies/${cs.slug}`} className="block relative aspect-[4/3] bg-[var(--color-muted)] overflow-hidden icon-zoom">
                          {cs.image ? (
                            <MediaImage src={cs.image} alt={cs.title} width={800} height={600} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Icon name="compass" size={34} className="text-[var(--color-text-secondary)]/30" /></div>
                          )}
                          <span className="absolute left-4 bottom-4 px-2.5 py-1 bg-[rgba(35,31,32,0.72)] text-[10px] font-semibold uppercase tracking-[0.12em] text-white rounded-xs">Project proof</span>
                        </a>
                        {cs.gallery.length > 1 && (
                          <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--color-canvas-soft)]">
                            {cs.gallery.slice(1, 4).map((src, imageIndex) => (
                              <MediaImage key={src} src={src} alt={`${cs.title} supporting photo ${imageIndex + 1}`} width={220} height={165} loading="lazy" className="w-full aspect-[4/3] object-cover rounded-xs" />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-5 md:p-6 flex flex-col min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)]">{cs.location || 'Global project'}</p>
                            <h3 className="mt-2 text-xl font-bold leading-tight text-[var(--color-text)]">{cs.title}</h3>
                          </div>
                          <span className="w-8 h-8 shrink-0 aspect-square rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">↗</span>
                        </div>
                        <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">{cs.summary}</p>
                        <dl className="metadata-pairs mt-5 text-left">
                          <div className="pair"><dt>Project Type</dt><dd>{cs.farmName}</dd></div>
                          <div className="pair"><dt>Equipment</dt><dd className="line-clamp-2">{cs.equipment}</dd></div>
                          <div className="pair"><dt>Application</dt><dd className="line-clamp-2">{cs.application}</dd></div>
                        </dl>
                        <a href={`${lp}/case-studies/${cs.slug}`} className="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                          View project story <Icon name="arrow-right" size={15} className="text-[var(--color-accent)]" />
                        </a>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>
          )
        })}
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
