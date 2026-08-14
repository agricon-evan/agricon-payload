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

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('products', '/images/heroes/farm-machinery.jpg')
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const categories = await getCategories(locale)
  const lp = `/${locale}`
  const fallbackCategories = [
    { id: 'poultry', slug: '', name: 'Poultry Equipment', description: 'Layer cages, broiler systems, feeding, drinking and climate control for efficient poultry houses.', image: null },
    { id: 'livestock', slug: '', name: 'Livestock Equipment', description: 'Practical systems for cattle, pig and sheep farms — built for hygiene, safety and daily throughput.', image: null },
    { id: 'feed', slug: '', name: 'Feed Processing', description: 'Grinding, mixing, pelleting and bagging lines designed around your target capacity.', image: null },
    { id: 'infrastructure', slug: '', name: 'Farm Infrastructure', description: 'Ventilation, water, fencing and supporting equipment that keeps your operation moving.', image: null },
  ]
  const displayCategories = categories.length > 0 ? categories : fallbackCategories

  return (
    <>
      <PageHero
        title={t.nav?.products || 'Products'}
        description={t.footer?.brandDescription || 'Durable, export-ready farm equipment'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.products || 'Products'}`}
        image={heroImage}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {displayCategories.map((cat, i) => (
            <Reveal key={cat.id} delay={(i % 3) * 80} className="h-full">
              <a href={cat.slug ? `${lp}/products/${cat.slug}` : `/${locale}/contact`} className="card card-hover h-full block group overflow-hidden">
                <div className="relative aspect-[16/9] bg-[var(--color-muted)] flex items-center justify-center icon-zoom overflow-hidden">
                  {cat.image && typeof cat.image === 'object' && cat.image.url ? (
                    <MediaImage src={cat.image.url} alt={cat.name} width={800} height={450} className="w-full h-full object-cover" loading="lazy" />
                  ) : categoryImages[cat.slug] ? (
                    <MediaImage src={categoryImages[cat.slug]} alt={cat.name} width={800} height={450} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Icon name="box" size={36} className="text-[var(--color-text-secondary)]/30" />
                  )}
                  <div className="absolute inset-0 bg-black/40" />
                  <span className="absolute bottom-4 left-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">Equipment line</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h2>
                    <span className="w-8 h-8 shrink-0 aspect-square rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">↗</span>
                  </div>
                  {cat.description && <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{cat.description}</p>}
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaSection locale={locale as Locale} />
    </>
  )
}
