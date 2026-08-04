import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getCaseStudies } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export default async function CaseStudiesPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const cases = await getCaseStudies(locale)
  const lp = locale === 'en' ? '' : `/${locale}`

  return (
    <>
      <PageHero
        title={t.nav?.caseStudies || 'Case Studies'}
        description="Real projects, real results — see how farms worldwide grow with Agricon"
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.caseStudies || 'Case Studies'}`}
      />
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {cases.length === 0 ? (
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="file-text" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Case Studies Coming Soon</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto">Success stories from our customers are being prepared.</p>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {cases.map((cs: any, i: number) => (
              <Reveal key={cs.id} delay={(i % 3) * 80} className="h-full">
                <a href={`${lp}/case-studies/${cs.slug}`} className="card card-hover h-full block">
                  <div className="aspect-video bg-[var(--color-muted)] flex items-center justify-center icon-zoom overflow-hidden">
                    {cs.image && typeof cs.image === 'object' && cs.image.url ? (
                      <img src={cs.image.url} alt={cs.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Icon name="compass" size={32} className="text-[var(--color-text-secondary)]/30" />
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-[var(--color-text)]">{cs.title}</h2>
                    {cs.location && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                        <Icon name="map-pin" size={13} />
                        {cs.location}
                      </p>
                    )}
                    {cs.summary && <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{cs.summary}</p>}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
