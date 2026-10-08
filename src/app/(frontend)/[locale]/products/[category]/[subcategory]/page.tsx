import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getProducts, getSubcategories } from '@/lib/payload'
import { localizedAlternates } from '@/lib/seo'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'
import { catalogProductImages } from '@/lib/catalog-images'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string; category: string; subcategory: string }>
}


/** Prerenders every subcategory page at build time. See the `[category]` route. */
export async function generateStaticParams({ params }: { params?: { locale?: string } }) {
  try {
    const subs = await getSubcategories(params?.locale ?? 'en')
    return subs
      .map((s) => {
        const cat = s.category
        const category = typeof cat === 'object' && cat !== null ? cat.slug : undefined
        return category ? { category, subcategory: s.slug } : null
      })
      .filter((p): p is { category: string; subcategory: string } =>
        Boolean(p && p.category && p.subcategory),
      )
  } catch (err) {
    console.error('[products/[category]/[subcategory]] generateStaticParams failed', err)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category, subcategory } = await params
  const subs = await getSubcategories(locale)
  const sub = subs.find((s) => s.slug === subcategory)
  return {
    title: sub?.name || subcategory,
    description: sub?.description || '',
    // Both ancestor segments are validated in the page itself (a mismatched
    // category 404s), so the requested URL is the canonical one. See the note in
    // the `[category]` route for why this is not inherited from the layout.
    alternates: localizedAlternates(locale as Locale, `/products/${category}/${subcategory}`),
  }
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

  // The category segment must be this subcategory's actual parent. Previously
  // only the leaf slug was matched and the URL's category segment was silently
  // rewritten (`catObj?.slug || catSlug`), so `/en/products/<anything>/layer-cage`
  // answered 200 with a self-referencing canonical — an unbounded set of
  // indexable duplicates that also masked a broken CMS relation.
  const parentCategorySlug = catObj?.slug
  if (!sub || !parentCategorySlug || parentCategorySlug !== catSlug) {
    notFound()
  }
  const catSlugFromCat = parentCategorySlug
  const lp = `/${locale}`

  const subProducts = products.filter((p) => {
    const s = p.subcategory
    return typeof s === 'object' && s?.slug === subSlug
  })

  // 子分类 hero 图：优先使用后台配置的 heroImage，其次子分类图，最后通用占位
  const heroImage = (() => {
    const hero = (sub as { heroImage?: number | { url?: string | null } | null }).heroImage
    const image = (sub as { image?: number | { url?: string | null } | null }).image
    if (typeof hero === 'object' && hero?.url) return hero.url
    if (typeof image === 'object' && image?.url) return image.url
    return '/images/heroes/farm-machinery.jpg'
  })()

  return (
    <>
      <PageHero
        locale={locale as Locale}
        title={sub.name}
        description={(sub as { subtitle?: string | null }).subtitle || (sub.description ?? undefined)}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.products || 'Products'} / ${catObj?.name || catSlug} / ${sub.name}`}
        image={heroImage}
      />
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {subProducts.length === 0 ? (
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="box" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">{t.productLine?.emptyTitle || 'Products Coming Soon'}</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto">
                {t.productLine?.emptyDesc || 'Products in this line are being added. Contact us for the latest catalog.'}
              </p>
              <Link href={`${lp}/contact`} className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]">
                {t.cta?.getQuote || 'Contact Us'}
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {subProducts.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 80} className="h-full">
                <Link href={`${lp}/products/${catSlugFromCat}/${subSlug}/${p.slug}`} className="card card-hover h-full block group">
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
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
