import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getCategories } from '@/lib/payload'
import { resolvePageHeroImage } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import { categoryImages } from '@/lib/images'
import MediaImage from '@/components/ui/MediaImage'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return pageMetadata(locale as Locale, {
    path: '/products',
    namespace: 'pages',
    key: 'products',
    title: 'Products',
    description:
      'Browse Agricon poultry, livestock, aquaculture and farm machinery lines — cages, feeding systems, incubators, processing equipment and more.',
  })
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('products', '/images/heroes/farm-machinery.jpg', locale)
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const categories = await getCategories(locale)
  const lp = `/${locale}`

  return (
    <>
      <PageHero
        locale={locale as Locale}
        title={t.nav?.products || 'Products'}
        description={t.footer?.brandDescription || 'Durable, export-ready farm equipment'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.products || 'Products'}`}
        image={heroImage}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {categories.length === 0 ? (
          // Real empty state. This previously fell back to four hardcoded English
          // cards whose `slug` was '' — every one of them linked to /contact,
          // which reads as four broken links rather than "no content yet".
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="box" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                {t.productLine?.emptyTitle || 'Products Coming Soon'}
              </h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto">
                {t.productLine?.emptyDesc || 'Products are being added. Contact us for the latest catalog.'}
              </p>
              <Link
                href={`${lp}/contact`}
                className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                {t.cta?.getQuote || 'Contact Us'}
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {categories.map((cat, i) => (
              <Reveal key={cat.id} delay={(i % 3) * 80} className="h-full">
                <Link href={`${lp}/products/${cat.slug}`} className="card card-hover h-full block group overflow-hidden">
                  <div className="relative aspect-[16/9] bg-[var(--color-muted)] flex items-center justify-center icon-zoom overflow-hidden">
                    {cat.image && typeof cat.image === 'object' && cat.image.url ? (
                      <MediaImage src={cat.image.url} alt={cat.name} width={800} height={450} className="w-full h-full object-cover" loading="lazy" />
                    ) : categoryImages[cat.slug] ? (
                      <MediaImage src={categoryImages[cat.slug]} alt={cat.name} width={800} height={450} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Icon name="box" size={36} className="text-[var(--color-text-secondary)]/30" />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                    <span className="absolute bottom-4 left-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
                      {t.productLine?.equipmentLine || 'Equipment line'}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h2>
                      <span className="w-8 h-8 shrink-0 aspect-square rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">↗</span>
                    </div>
                    {cat.description && <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{cat.description}</p>}
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
