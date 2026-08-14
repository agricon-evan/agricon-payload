import type { Locale } from '@/i18n/config'
import { getCaseStudies, getSolutions } from '@/lib/payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import CtaSection from '@/components/CtaSection'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { caseStudyImages, caseStudyGalleries } from '@/lib/images'
import MediaImage from '@/components/ui/MediaImage'
import ImageGallery from '@/components/ui/ImageGallery'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export const dynamic = 'force-dynamic'

function countryName(country: unknown, location?: string | null): string {
  if (country && typeof country === 'object' && 'name' in country) {
    return String(country.name || location || '—')
  }
  return String(country || location || '—')
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const cases = await getCaseStudies(locale)
  const cs = cases.find((item) => item.slug === slug)
  const solutions = await getSolutions(locale)

  if (!cs) notFound()

  const relatedSolution = cs.solution
    ? solutions.find((solution) => solution.id === (typeof cs.solution === 'object' && cs.solution ? cs.solution.id : cs.solution))
    : undefined

  const country = countryName(cs.country, cs.location)
  const projectType = cs.farmName || 'Agricultural equipment project'
  const equipment = cs.equipment || 'Complete equipment package'
  const application = cs.application || cs.summary || 'Project-based equipment supply'
  const caseImages = (caseStudyGalleries[cs.slug] || (caseStudyImages[cs.slug] ? [caseStudyImages[cs.slug]] : []))
    .map((src) => ({ src, alt: `${cs.title} project photo` }))

  return (
    <>
      <PageHero
        title={cs.title}
        description={cs.subtitle || cs.summary || 'Real project, real results.'}
        breadcrumb={`${locale.toUpperCase()} / Case Studies / ${cs.title}`}
        image="/images/heroes/farm-landscape.jpg"
      />

      {/* Evidence-first case header — dominant photo + metadata column */}
      <section className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)] gap-8 lg:gap-12 items-start">
          <Reveal>
            {caseImages.length > 0 ? (
              <ImageGallery images={caseImages} aspect="4-3" priority />
            ) : (
              <div className="aspect-[4/3] rounded-lg bg-[var(--color-muted)] flex items-center justify-center">
                <Icon name="compass" size={48} className="text-[var(--color-text-secondary)]/30" />
              </div>
            )}
            <p className="mt-3 text-xs text-[var(--color-text-muted)] uppercase tracking-[0.1em]">Project evidence · {country}</p>
          </Reveal>

          <Reveal delay={100}>
            <aside className="info-card rounded-lg p-6 md:p-8">
              <span className="eyebrow">Project at a glance</span>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-[var(--color-text)]">{cs.title}</h2>
              <dl className="metadata-pairs mt-6">
                <div className="pair"><dt>Country / Market</dt><dd>{country}</dd></div>
                <div className="pair"><dt>Project Type</dt><dd>{projectType}</dd></div>
                <div className="pair"><dt>Equipment</dt><dd>{equipment}</dd></div>
                <div className="pair"><dt>Application</dt><dd>{application}</dd></div>
              </dl>
              {cs.keyResult && (
                <div className="mt-6 border-l-2 border-[var(--color-rule-orange)] pl-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)]">Key result</span>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-text)]">{cs.keyResult}</p>
                </div>
              )}
            </aside>
          </Reveal>
        </div>

        {/* Project story */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-16 mt-16 md:mt-20">
          <div>
            <Reveal>
              <span className="eyebrow">Project Story</span>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)]">The project in context</h2>
              <span className="orange-underline mt-4" aria-hidden="true" />
              {(cs.summary || cs.subtitle) && (
                <p className="mt-6 text-base text-[var(--color-text-secondary)] leading-relaxed">{cs.summary || cs.subtitle}</p>
              )}
              {cs.content && <RichText className="mt-6 prose-agricon max-w-none" data={cs.content} />}
            </Reveal>
          </div>

          <div className="space-y-5">
            {cs.challenge && (
              <Reveal>
                <div className="card p-6 border-l-2 border-[var(--color-accent)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                    <Icon name="alert" size={16} />
                    The Challenge
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">{cs.challenge}</p>
                </div>
              </Reveal>
            )}
            <Reveal delay={80}>
              <div className="info-card p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                  <Icon name="check-circle" size={16} />
                  Equipment Package
                </div>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">{equipment}</p>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="info-card p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                  <Icon name="target" size={16} />
                  Application
                </div>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">{application}</p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Related solution */}
        {relatedSolution && (
          <Reveal>
            <div className="mt-16 border-t border-[var(--color-border)] pt-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                <div>
                  <span className="eyebrow">Related Solution</span>
                  <h2 className="mt-3 text-2xl font-bold text-[var(--color-text)]">{relatedSolution.name}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] leading-relaxed">{relatedSolution.description}</p>
                </div>
                <Link
                  href={`/${locale}/solutions/${relatedSolution.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-sm min-h-[44px] tap-target shrink-0 hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  View Solution <Icon name="arrow-right" size={15} className="text-[var(--color-accent-soft)]" />
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {/* More case studies */}
        <div className="mt-16 md:mt-20 border-t border-[var(--color-border)] pt-10">
          <Reveal>
            <span className="eyebrow">Continue Exploring</span>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)]">More Case Studies</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-7">
            {cases.filter((item) => item.slug !== slug).slice(0, 3).map((item, index) => (
              <Reveal key={item.id} delay={index * 70} className="h-full">
                <Link href={`/${locale}/case-studies/${item.slug}`} className="card card-hover h-full block overflow-hidden group">
                  {caseStudyImages[item.slug] && (
                    <div className="aspect-[4/3] overflow-hidden bg-[var(--color-muted)]">
                      <MediaImage src={caseStudyImages[item.slug]} alt={item.title} width={600} height={450} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)]">{countryName(item.country, item.location)}</div>
                    <h3 className="mt-2 font-semibold leading-snug text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{item.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{item.summary || item.subtitle}</p>
                  </div>
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
