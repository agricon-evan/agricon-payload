import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getSolutions } from '@/lib/payload'
import { resolvePageHeroImage } from '@/lib/payload'
import { getSiteSettings } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'
import { categoryImages } from '@/lib/images'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

// 方案封面图（画册分类图）
const SOLUTION_IMAGE: Record<string, string> = {
  'poultry-farming': categoryImages['poultry-equipment'],
  'livestock-farming': categoryImages['livestock-equipment'],
  'aquaculture': categoryImages['aquaculture-equipment'],
  'feed-processing': categoryImages['agriculture-machinery'],
  'breeding-house': categoryImages['breeding-house-equipment'],
  'farm-machinery': categoryImages['farming-vehicles'],
}

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('solutions', '/images/heroes/greenhouse.jpg')
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const solutions = await getSolutions(locale)
  const lp = `/${locale}`
  const fallbackSolutions = [
    { id: 'poultry', slug: '', name: 'Poultry Farm Setup', description: 'Complete laying-hen and broiler house solutions — from cage systems to climate control and feeding lines.', icon: 'building', image: categoryImages['poultry-equipment'] },
    { id: 'livestock', slug: '', name: 'Livestock Farm Setup', description: 'Cattle, pig and sheep facilities engineered for productivity, hygiene and animal welfare.', icon: 'warehouse', image: categoryImages['livestock-equipment'] },
    { id: 'feed', slug: '', name: 'Feed Processing Line', description: 'Turnkey feed mills: grinding, mixing, pelleting and bagging — matched to your target capacity.', icon: 'layers', image: categoryImages['agriculture-machinery'] },
    { id: 'infrastructure', slug: '', name: 'Farm Infrastructure', description: 'Water systems, ventilation, lighting and power — the backbone of a modern commercial farm.', icon: 'droplet', image: categoryImages['breeding-house-equipment'] },
  ]
  const displaySolutions = solutions.length > 0
    ? solutions.map(solution => ({ ...solution, icon: undefined, image: SOLUTION_IMAGE[solution.slug] || null }))
    : fallbackSolutions

  return (
    <>
      <PageHero
        title={t.nav?.solutions || 'Solutions'}
        description="Complete farm solutions — from poultry houses to feed processing lines"
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.solutions || 'Solutions'}`}
        image={heroImage}
      />
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {displaySolutions.map((s, i) => (
            <Reveal key={s.id} delay={(i % 2) * 80} className="h-full">
              <a href={s.slug ? `${lp}/solutions/${s.slug}` : `/${locale}/contact`} className="card card-hover h-full block overflow-hidden group">
                <div className="relative aspect-[16/9] bg-[var(--color-muted)] overflow-hidden icon-zoom">
                  {s.image ? (
                    <MediaImage src={s.image} alt={s.name} width={800} height={450} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-primary)]/20">
                      <Icon name={s.icon || ['building', 'warehouse', 'layers', 'droplet'][i % 4]} size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  <span className="absolute bottom-4 left-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">One-stop solution</span>
                </div>
                <div className="p-6 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{s.name}</h2>
                      <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">{s.description}</p>
                    </div>
                    <span className="w-8 h-8 shrink-0 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">↗</span>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
