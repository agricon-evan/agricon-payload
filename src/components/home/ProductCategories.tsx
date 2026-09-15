import Link from 'next/link'
import { getCategories } from '@/lib/payload'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'
import { categoryImages } from '@/lib/images'
import MediaImage from '@/components/ui/MediaImage'

interface Props { locale: Locale }

export default async function ProductCategories({ locale }: Props) {
  const categories = await getCategories(locale)
  const t = getTranslations(locale, 'common')
  const lp = `/${locale}`

  const fallbackCategories = [
    { id: 'poultry', slug: '', name: 'Poultry Equipment', description: 'Layer cages, broiler systems, feeding, drinking and climate control for efficient poultry houses.', image: categoryImages['poultry-equipment'] },
    { id: 'livestock', slug: '', name: 'Livestock Equipment', description: 'Practical systems for cattle, pig and sheep farms — built for hygiene, safety and daily throughput.', image: categoryImages['livestock-equipment'] },
    { id: 'feed', slug: '', name: 'Feed Processing', description: 'Grinding, mixing, pelleting and bagging lines designed around your target capacity.', image: categoryImages['agriculture-machinery'] },
    { id: 'infrastructure', slug: '', name: 'Farm Infrastructure', description: 'Ventilation, water, fencing and supporting equipment that keeps your operation moving.', image: categoryImages['wire-mesh-fencing'] },
  ]
  const items = categories.length > 0
    ? categories.map((cat) => ({ ...cat, image: categoryImages[cat.slug] || null }))
    : fallbackCategories

  return (
    <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
      <Reveal>
        <SectionHeading
          eyebrow={t.nav?.products || 'Products'}
          title={<>Complete Farm <span className="split-accent">Equipment Lines</span></>}
          description="An integrated equipment ecosystem covering breeding, feeding, housing, processing and daily farm operation."
        />
      </Reveal>
      {/* 10 个产品分类：桌面端 5 列 × 2 行，一屏看全所有产线 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 auto-rows-fr items-stretch gap-4 md:gap-5 mt-10">
        {items.map((cat, i) => (
          <Reveal key={cat.id} delay={i * 60} className="h-full">
            <Link href={cat.slug ? `${lp}/products/${cat.slug}` : `${lp}/products`} className="card card-hover h-full min-w-0 flex flex-col group overflow-hidden">
              <div className="relative aspect-[4/3] bg-[var(--color-muted)] overflow-hidden">
                {cat.image ? (
                  <MediaImage src={cat.image} alt={cat.name} width={800} height={600} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]/30 text-lg font-medium">{cat.name?.slice(0,2)}</div>
                )}
                {/* Flat photo overlay — {colors.surface-photo-dark}, no gradients per design spec */}
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">Equipment line</span>
                {/* Arrow moved onto the photo so the narrow 5-up column keeps its full text width */}
                <span className="absolute top-3 right-3 w-7 h-7 shrink-0 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white text-xs group-hover:bg-[var(--color-primary)] group-hover:border-[var(--color-primary)] transition-colors" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-[15px] font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-2">{cat.name}</h3>
                <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">{cat.description}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
