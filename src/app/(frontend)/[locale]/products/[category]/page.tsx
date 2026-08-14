import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getSubcategories, getCategories } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import { subcategoryImages } from '@/lib/images'
import MediaImage from '@/components/ui/MediaImage'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; category: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params
  const categories = await getCategories(locale)
  const cat = categories.find((c) => c.slug === category)
  return { title: cat?.name || category, description: cat?.description || '' }
}

export default async function CategoryPage({ params }: Props) {
  const { locale, category: catSlug } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const categories = await getCategories(locale)
  const subcategories = await getSubcategories(locale)
  const cat = categories.find((c) => c.slug === catSlug)
  const lp = `/${locale}`

  const subs = subcategories.filter((s) => {
    const c = s.category
    return typeof c === 'object' && c?.slug === catSlug
  })

  if (!cat) {
    notFound()
  }

  return (
    <>
      <PageHero
        title={cat?.name || catSlug}
        description={cat?.description ?? undefined}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.products || 'Products'} / ${cat?.name || catSlug}`}
        image="/images/heroes/farm-machinery.jpg"
      />
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {subs.length === 0 ? (
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="layers" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Products Coming Soon</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto">
                Product categories within this line are being added. Contact us for current availability.
              </p>
              <a href={`${lp}/contact`} className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]">
                {t.cta?.getQuote || 'Contact Us'}
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {subs.map((sub, i) => (
              <Reveal key={sub.id} delay={(i % 3) * 80} className="h-full">
                <a href={`${lp}/products/${catSlug}/${sub.slug}`} className="card card-hover h-full block group">
                  <div className="aspect-[16/9] bg-[var(--color-muted)] flex items-center justify-center overflow-hidden">
                    {sub.image && typeof sub.image === 'object' && sub.image.url ? (
                      <MediaImage src={sub.image.url} alt={sub.name} width={800} height={500} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : subcategoryImages[sub.slug] ? (
                      <MediaImage src={subcategoryImages[sub.slug]} alt={sub.name} width={800} height={500} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <Icon name="layers" size={36} className="text-[var(--color-text-secondary)]/25" />
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{sub.name}</h2>
                    {sub.description && <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{sub.description}</p>}
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
