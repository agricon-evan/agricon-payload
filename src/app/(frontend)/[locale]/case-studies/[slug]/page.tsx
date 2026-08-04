import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getCaseStudies } from '@/lib/payload'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function CaseStudyDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const cases = await getCaseStudies(locale)
  const cs = cases.find((c) => c.slug === slug)

  if (!cs) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Case Study Not Found</h1>
        <a href={`/${locale}/case-studies`} className="inline-flex items-center gap-1.5 mt-4 text-[var(--color-primary)] font-semibold">
          <Icon name="arrow-right" size={15} className="rotate-180" />
          Back
        </a>
      </div>
    )
  }

  const facts = [
    ...(cs.location ? [{ icon: 'map-pin', label: 'Location', value: cs.location }] : []),
    ...(cs.farmName ? [{ icon: 'building', label: 'Farm', value: cs.farmName }] : []),
    ...(cs.keyResult ? [{ icon: 'trending-up', label: 'Key Result', value: cs.keyResult, highlight: true }] : []),
  ]

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 py-10 md:py-16">
        <nav className="text-sm text-[var(--color-text-secondary)] mb-4">
          <a href={`/${locale}/case-studies`} className="hover:text-[var(--color-primary)] transition-colors">Case Studies</a> / {cs.title}
        </nav>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">{cs.title}</h1>

        {facts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {facts.map((f, i) => (
              <Reveal key={f.label} delay={i * 80} className="h-full">
                <div className={`card card-hover p-5 h-full ${f.highlight ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/4' : ''}`}>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Icon name={f.icon} size={15} className={f.highlight ? 'text-[var(--color-primary)]' : ''} />
                    {f.label}
                  </div>
                  <div className={`font-semibold mt-1.5 ${f.highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>{f.value}</div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {cs.summary && (
          <p className="mt-8 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">{cs.summary}</p>
        )}
        {cs.content && (
          <div
            className="mt-6 prose prose-slate max-w-none dark:prose-invert leading-relaxed text-[var(--color-text)]"
            dangerouslySetInnerHTML={{ __html: typeof cs.content === 'string' ? cs.content : '' }}
          />
        )}
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
