import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getFAQs, getFaqCategories } from '@/lib/payload'
import { resolvePageHeroImage } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export default async function FaqPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('faq', '/images/heroes/farm-field.jpg')
  const t = getTranslations(locale as Locale, 'faq')
  const tHome = getTranslations(locale as Locale, 'home')
  const faqs = await getFAQs(locale)
  const faqCategories = await getFaqCategories(locale)
  const lp = `/${locale}`

  const supportItems = (t.relatedSupport?.items ?? {}) as Record<string, { title: string; description: string }>
  const supportLinks: Record<string, string> = {
    catalog: `${lp}/products`,
    video: `${lp}/case-studies`,
    headset: `${lp}/contact`,
    documentation: `${lp}/trade-support`,
    distributors: `${lp}/distributors`,
  }
  const supportIcon = ['file-text', 'video', 'headset', 'file-text', 'globe']

  // 常见问题分类（当数据库为空时展示标准企业 FAQ，保证页面不空）
  const defaultFaqs = [
    {
      question: 'What is the minimum order quantity (MOQ)?',
      answer: 'MOQ depends on the product category. For accessories and smaller items, MOQ can be as low as one carton or a single set. For cages, machinery and bulk equipment, MOQ is typically one container or one complete set per model. Contact us with your project details for an exact quote.',
    },
    {
      question: 'Can you help with shipping and export documentation?',
      answer: 'Yes. We provide full export support including export packing, container loading plans, commercial documents (invoice, packing list, bill of lading), certificate of origin and any other documents required by your country. We coordinate shipments from factory preparation to dispatch.',
    },
    {
      question: 'What payment terms do you accept?',
      answer: 'We typically work with T/T (telegraphic transfer) — a deposit to confirm the order and the balance before shipment. For larger projects, L/C at sight or other agreed terms can be arranged. Payment terms are confirmed in the quotation for each order.',
    },
    {
      question: 'Can you supply a complete farm project, not just single machines?',
      answer: 'Yes — this is our core strength. We provide integrated solutions: equipment selection matched to your farm type and capacity, combined supply across multiple categories (poultry, livestock, feed processing, infrastructure), project planning, and export delivery coordination.',
    },
    {
      question: 'How do you ensure product quality before shipment?',
      answer: 'Product scope, specifications and key inspection points are confirmed before shipment. We coordinate production follow-up, packing checks and available inspection records with qualified manufacturing partners. You can request inspection reports and load-testing documentation.',
    },
    {
      question: 'Do you support distributors and long-term cooperation?',
      answer: 'Yes. Importers and distributors receive flexible product combinations, repeat-order support and coordinated sourcing for local market development. Product portfolios can be adjusted for project demand and regional sales channels.',
    },
    {
      question: 'What about spare parts and after-sales support?',
      answer: 'We provide spare parts support, product information and repeat-order assistance after delivery. Spare parts can be shipped together with your order or later as needed, so your farm operations continue without interruption.',
    },
    {
      question: 'Can equipment be customized for my farm?',
      answer: 'Yes. Equipment is matched to the farm type, target capacity, site conditions and operating requirements. Layouts, capacities and configurations can be adapted to your building and budget before production.',
    },
  ]

  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs

  return (
    <>
      <PageHero
        title={t.hero?.title || 'FAQ'}
        description={t.hero?.description || 'Answers to the questions buyers ask us most — from MOQ and shipping to quality control and support.'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.breadcrumb?.faq || 'FAQ'}`}
        image={heroImage}
      />

      <section className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Quick category chips — driven by CMS FAQ categories */}
        <Reveal>
          <div className="flex flex-wrap gap-2 mb-10">
            {faqCategories.length > 0 ? (
              faqCategories.map((cat) => (
                <a
                  key={cat.id}
                  href="#faq-list"
                  className="px-4 py-2 rounded-full border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors tap-target"
                >
                  {cat.name}
                </a>
              ))
            ) : (
              ['Ordering & MOQ', 'Shipping & Export', 'Quality Control', 'Farm Projects', 'Distributors', 'After-sales'].map((chip) => (
                <a key={chip} href="#faq-list" className="px-4 py-2 rounded-full border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors tap-target">
                  {chip}
                </a>
              ))
            )}
          </div>
        </Reveal>

        {/* FAQ accordion */}
        <div id="faq-list" className="space-y-4">
          {displayFaqs.map((faq, i) => (
            <Reveal key={'id' in faq ? faq.id : faq.question} delay={(i % 5) * 60}>
              <details className="group card overflow-hidden" open={i === 0}>
                <summary className="flex items-center justify-between gap-4 px-5 py-4 font-medium text-[var(--color-text)] cursor-pointer min-h-[48px] list-none tap-target">
                  <span className="leading-snug">{faq.question}</span>
                  <Icon name="plus" size={18} className="text-[var(--color-primary)] flex-shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <div className="px-5 pb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {typeof faq.answer === 'string' ? faq.answer : <RichText data={faq.answer} />}
                </div>
              </details>
            </Reveal>
          ))}
        </div>

        {/* Support resources */}
        <div className="mt-16">
          <Reveal>
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-6">{t.relatedSupport?.title || 'Additional Support Resources'}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(supportItems).map(([key, item]: [string, { title: string; description: string }], i: number) => (
              <Reveal key={key} delay={i * 80} className="h-full">
                <Link href={supportLinks[key] || `${lp}/contact`} className="card card-hover p-5 h-full block">
                  <div className="w-9 h-9 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-3">
                    <Icon name={supportIcon[i] || 'file'} size={18} />
                  </div>
                  <div className="font-semibold text-[var(--color-text)]">{item.title}</div>
                  <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.description}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[var(--color-primary)]">
                    {t.learnMore || 'Learn More'}
                    <Icon name="arrow-right" size={13} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Reveal>
          <div className="mt-16 p-8 md:p-10 bg-[var(--color-primary)] text-white rounded-lg text-center">
            <h2 className="text-xl md:text-2xl font-bold">{t.cta?.title || 'Still Have Questions?'}</h2>
            <p className="mt-3 opacity-85 max-w-xl mx-auto text-sm leading-relaxed">
              {t.cta?.description || 'Send us your project details — farm type, capacity and equipment needs — and our team will respond with a practical recommendation.'}
            </p>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-white text-[var(--color-primary)] font-semibold rounded-sm min-h-[48px] press tap-target transition-colors hover:bg-white/90"
            >
              {t.cta?.contactUs || 'Contact Us'}
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}
