import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getFAQs } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export default async function FaqPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'faq')
  const tHome = getTranslations(locale as Locale, 'home')
  const faqs = await getFAQs(locale)

  const supportItems = (t.relatedSupport?.items ?? {}) as Record<string, { title: string; description: string; href?: string }>
  const supportIcon = ['file-text', 'video', 'headset']

  return (
    <>
      <PageHero
        title={t.hero?.title || 'FAQ'}
        description={t.hero?.description || 'Find answers to common questions'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.breadcrumb?.faq || 'FAQ'}`}
      />

      <section className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {faqs.length === 0 ? (
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="help" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">{t.noQuestions || 'No questions yet'}</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                {t.cta?.description || 'Send us your question and our team will help.'}
              </p>
              <a
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                {t.cta?.contactUs || 'Contact Us'}
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
          </Reveal>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Reveal key={faq.id} delay={(i % 5) * 60}>
                <details className="group card overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 font-medium text-[var(--color-text)] cursor-pointer min-h-[48px] list-none tap-target">
                    <span className="leading-snug">{faq.question}</span>
                    <Icon name="plus" size={18} className="text-[var(--color-primary)] flex-shrink-0 transition-transform group-open:rotate-45" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {typeof faq.answer === 'string' ? faq.answer : ''}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-16">
          <Reveal>
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-6">{t.relatedSupport?.title || 'Additional Support Resources'}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(supportItems).map(([key, item]: [string, { title: string; description: string }], i: number) => (
              <Reveal key={key} delay={i * 80} className="h-full">
                <a href={`/${locale}$`} className="card card-hover p-5 h-full block">
                  <div className="w-9 h-9 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-3">
                    <Icon name={supportIcon[i] || 'file'} size={18} />
                  </div>
                  <div className="font-semibold text-[var(--color-text)]">{item.title}</div>
                  <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.description}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[var(--color-primary)]">
                    {t.learnMore || 'Learn More'}
                    <Icon name="arrow-right" size={13} />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal>
          <div className="mt-16 p-8 md:p-10 bg-[var(--color-primary)] text-white rounded-lg text-center">
            <h2 className="text-xl md:text-2xl font-bold">{t.cta?.title || 'Still Have Questions?'}</h2>
            <p className="mt-3 opacity-85 max-w-xl mx-auto text-sm">{t.cta?.description || ''}</p>
            <a
              href={`/${locale}/contact`}
              className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-[var(--color-accent)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:brightness-110"
            >
              {t.cta?.contactUs || 'Contact Us'}
              <Icon name="arrow-right" size={16} />
            </a>
          </div>
        </Reveal>
      </section>
    </>
  )
}
