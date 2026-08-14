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
      {/* 10 个产品分类：桌面端保持宽松 4 列，优先保证产品信息可读性 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr items-stretch gap-6 md:gap-8 mt-10">
        {items.map((cat, i) => (
          <Reveal key={cat.id} delay={i * 80} className="h-full">
            <Link href={cat.slug ? `${lp}/products/${cat.slug}` : `${lp}/products`} className="card card-hover h-full min-w-0 flex flex-col group overflow-hidden">
              <div className="relative aspect-[4/3] bg-[var(--color-muted)] overflow-hidden">
                {cat.image ? (
                  <MediaImage src={cat.image} alt={cat.name} width={800} height={600} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]/30 text-lg font-medium">{cat.name?.slice(0,2)}</div>
                )}
                {/* Flat photo overlay — {colors.surface-photo-dark}, no gradients per design spec */}
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute bottom-4 left-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">Equipment line</span>
              </div>
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h3>
                  <span className="w-8 h-8 shrink-0 aspect-square rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white group-hover:border-[var(--color-primary)] transition-colors">
                    <span aria-hidden="true">↗</span>
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">{cat.description}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
