import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getProducts, getSubcategories } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'
import { catalogProductImages } from '@/lib/catalog-images'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; category: string; subcategory: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, subcategory } = await params
  const subs = await getSubcategories(locale)
  const sub = subs.find((s) => s.slug === subcategory)
  return { title: (sub)?.name || subcategory, description: (sub)?.description || '' }
}

export default async function SubcategoryPage({ params }: Props) {
  const { locale, category: catSlug, subcategory: subSlug } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const products = await getProducts(locale)
  const subs = await getSubcategories(locale)
  const sub = subs.find((s) => s.slug === subSlug)
  const cat = sub?.category
  const catObj = typeof cat === 'object' && cat !== null ? cat : null
  const catSlugFromCat = catObj?.slug || catSlug
  const lp = `/${locale}`

  const subProducts = products.filter((p) => {
    const s = p.subcategory
    return typeof s === 'object' && s?.slug === subSlug
  })

  if (!sub) {
    notFound()
  }

  return (
    <>
      <PageHero
        title={sub.name}
        description={sub.description ?? undefined}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.products || 'Products'} / ${catObj?.name || catSlug} / ${sub.name}`}
        image="/images/heroes/farm-machinery.jpg"
      />
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {subProducts.length === 0 ? (
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="box" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Products Coming Soon</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto">
                Products in this line are being added. Contact us for the latest catalog.
              </p>
              <a href={`${lp}/contact`} className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]">
                {t.cta?.getQuote || 'Contact Us'}
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {subProducts.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 80} className="h-full">
                <a href={`${lp}/products/${catSlugFromCat}/${subSlug}/${p.slug}`} className="card card-hover h-full block group">
                  <div className="aspect-[4/3] bg-[var(--color-muted)] flex items-center justify-center overflow-hidden">
                    {p.images?.[0]?.image && typeof p.images[0].image === 'object' && p.images[0].image.url ? (
                      <MediaImage src={p.images[0].image.url} alt={p.name} width={800} height={500} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : catalogProductImages[p.slug] ? (
                      <MediaImage src={catalogProductImages[p.slug]} alt={p.name} width={800} height={500} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <Icon name="box" size={36} className="text-[var(--color-text-secondary)]/25" />
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{p.name}</h2>
                    {p.description && <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{p.description}</p>}
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
