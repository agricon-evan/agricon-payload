import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getCaseStudies, getSolutions } from '@/lib/payload'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import Link from 'next/link'
import { caseStudyImages } from '@/lib/images'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function CaseStudyDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const t = getTranslations(locale as Locale, 'common')
  const cases = await getCaseStudies(locale)
  const cs = cases.find((c) => c.slug === slug)
  const solutions = await getSolutions(locale)

  if (!cs) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Case Study Not Found</h1>
        <Link href={`/${locale}/case-studies`} className="inline-flex items-center gap-1.5 mt-4 text-[var(--color-primary)] font-semibold">
          <Icon name="arrow-right" size={15} className="rotate-180" />
          Back
        </Link>
      </div>
    )
  }

  // 相关解决方案（通过 relation 或 slug 匹配）
  const relatedSolution = cs.solution
    ? solutions.find((s: any) => s.id === (typeof cs.solution === 'object' ? (cs.solution as any)?.id : cs.solution))
    : undefined

  // 结构化 facts（含画册中的项目类型/设备/应用）
  const facts = [
    { icon: 'map-pin', label: 'Country', value: typeof cs.country === 'object' && cs.country ? (cs.country as any)?.name || cs.country : cs.country || '—' },
    ...(cs.farmName ? [{ icon: 'building', label: 'Project Type', value: cs.farmName }] : []),
    { icon: 'box', label: 'Equipment Supplied', value: (cs as any).equipment || 'Complete equipment package' },
    { icon: 'check-circle', label: 'Application', value: (cs as any).application || cs.summary || '—' },
    ...(cs.keyResult ? [{ icon: 'trending-up', label: 'Key Result', value: cs.keyResult, highlight: true }] : []),
  ]

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-primary-dark)] text-white py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="text-xs md:text-sm opacity-70 mb-3 flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:opacity-100 transition-opacity">Home</Link>
            <span>/</span>
            <Link href={`/${locale}/case-studies`} className="hover:opacity-100 transition-opacity">Case Studies</Link>
            <span>/</span>
            <span className="truncate max-w-[200px] md:max-w-none">{cs.title}</span>
          </nav>
          {caseStudyImages[cs.slug] && (
            <div className="mt-6 rounded-lg overflow-hidden max-w-3xl">
              <img src={caseStudyImages[cs.slug]} alt={cs.title} className="w-full h-48 md:h-64 object-cover" />
            </div>
          )}
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mt-6">{cs.title}</h1>
          <p className="mt-4 max-w-3xl opacity-85 text-sm md:text-base leading-relaxed">
            {cs.subtitle || cs.summary || 'Real project, real results.'}
          </p>
        </div>
      </section>

      {/* Facts grid */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {facts.map((f, i) => (
            <Reveal key={f.label} delay={i * 70} className="h-full">
              <div className={`card card-hover p-6 h-full ${f.highlight ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/4' : ''}`}>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Icon name={f.icon} size={16} className={f.highlight ? 'text-[var(--color-primary)]' : ''} />
                  {f.label}
                </div>
                <div className={`mt-2 font-semibold leading-snug ${f.highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>{f.value}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Project overview */}
        {(cs.summary || cs.content) && (
          <div className="mt-12 max-w-3xl">
            <Reveal>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Project Overview</h2>
              <p className="mt-4 text-base text-[var(--color-text-secondary)] leading-relaxed">{cs.summary || cs.subtitle}</p>
            </Reveal>
            {cs.content && (
              <Reveal>
                <div
                  className="mt-6 prose prose-slate max-w-none leading-relaxed text-[var(--color-text)]"
                  dangerouslySetInnerHTML={{ __html: typeof cs.content === 'string' ? cs.content : '' }}
                />
              </Reveal>
            )}
          </div>
        )}

        {/* Equipment package — from company catalog */}
        {(cs as any).equipment && (
          <Reveal>
            <div className="mt-12">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Equipment Package</h2>
              <p className="mt-4 text-base text-[var(--color-text-secondary)] leading-relaxed">{(cs as any).equipment}</p>
            </div>
          </Reveal>
        )}

        {/* Related solution */}
        {relatedSolution && (
          <Reveal>
            <div className="mt-12 p-6 md:p-8 bg-[var(--color-surface-alt)] rounded-lg border border-[var(--color-border)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wider">Related Solution</div>
                  <h3 className="mt-1 text-lg font-bold text-[var(--color-text)]">{(relatedSolution as any).name}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">{(relatedSolution as any).description}</p>
                </div>
                <Link
                  href={`/${locale}/solutions/${(relatedSolution as any).slug}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[44px] tap-target shrink-0 transition-colors hover:bg-[var(--color-primary-dark)]"
                >
                  View Solution
                  <Icon name="arrow-right" size={15} />
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {/* More case studies */}
        <div className="mt-16">
          <Reveal>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">More Case Studies</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {cases.filter((c) => c.slug !== slug).slice(0, 3).map((c, i) => (
              <Reveal key={c.id} delay={i * 80} className="h-full">
                <Link href={`/${locale}/case-studies/${c.slug}`} className="card card-hover h-full block p-6">
                  <div className="text-sm font-semibold text-[var(--color-primary)]">{typeof c.country === 'object' && c.country ? (c.country as any)?.name || '' : c.country || ''}</div>
                  <h3 className="mt-1.5 font-semibold text-[var(--color-text)]">{c.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{c.summary || c.subtitle}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
