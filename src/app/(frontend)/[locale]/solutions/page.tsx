import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getSolutions } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const solutions = await getSolutions(locale)
  const lp = locale === 'en' ? '' : `/${locale}`

  return (
    <>
      <PageHero
        title={t.nav?.solutions || 'Solutions'}
        description="Complete farm solutions — from poultry houses to feed processing lines"
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.solutions || 'Solutions'}`}
      />
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {solutions.length === 0 ? (
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="building" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Solutions Coming Soon</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto">Our farm solutions are being finalized. Contact us to discuss your project.</p>
              <a
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                {t.cta?.getQuote || 'Contact Us'}
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {solutions.map((s: any, i: number) => (
              <Reveal key={s.id} delay={(i % 2) * 80} className="h-full">
                <a href={`${lp}/solutions/${s.slug}`} className="card card-hover p-6 md:p-8 h-full block group">
                  <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5 transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                    <Icon name={['building', 'warehouse', 'layers', 'droplet'][i % 4]} size={22} />
                  </div>
                  <h2 className="text-xl text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{s.name}</h2>
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">{s.description}</p>
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
