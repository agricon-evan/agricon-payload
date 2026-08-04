import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getCategories } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const categories = await getCategories(locale)
  const lp = locale === 'en' ? '' : `/${locale}`

  return (
    <>
      <PageHero
        title={t.nav?.products || 'Products'}
        description={t.footer?.brandDescription || 'Durable, export-ready farm equipment'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.products || 'Products'}`}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {categories.length === 0 ? (
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="box" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Products Coming Soon</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto">
                Our product catalog is being updated. Please check back soon or contact us for current offerings.
              </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {categories.map((cat: any, i: number) => (
              <Reveal key={cat.id} delay={(i % 3) * 80} className="h-full">
                <a href={`${lp}/products/${cat.slug}`} className="card card-hover h-full block group">
                  <div className="aspect-[16/9] bg-[var(--color-muted)] flex items-center justify-center icon-zoom overflow-hidden">
                    {cat.image && typeof cat.image === 'object' && cat.image.url ? (
                      <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Icon name="box" size={36} className="text-[var(--color-text-secondary)]/30" />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h2>
                      <Icon name="arrow-right" size={16} className="text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {cat.description && <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{cat.description}</p>}
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
