import Link from 'next/link'
import { getCategories } from '@/lib/payload'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'
import Icon from '@/components/ui/Icon'
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
    <section className="py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow={t.nav?.products || 'Products'}
            title={<>Complete Farm <span className="split-accent">Equipment Lines</span></>}
            description="An integrated equipment ecosystem covering breeding, feeding, housing, processing and daily farm operation."
          />
        </Reveal>

        {/*
          10 categories — three across, large photos, everything visible at once.
          No rail here: a category index is something you want to scan in full,
          not scroll through. Cards land at ~395px wide (vs 360px in the rail).
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 lg:gap-x-7 lg:gap-y-12">
          {items.map((cat, i) => {
            // 10 categories over 3 columns leaves one card alone on the last row —
            // centre it so the grid reads as intentional rather than cut off.
            const loneLast = i === items.length - 1 && items.length % 3 === 1
            return (
              <Reveal key={cat.id} delay={i * 45} className={loneLast ? 'lg:col-start-2' : undefined}>
                <Link
                  href={cat.slug ? `${lp}/products/${cat.slug}` : `${lp}/products`}
                  className="group block"
                >
                  <div className="relative aspect-[4/3] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface-alt)]">
                    {cat.image ? (
                      <MediaImage src={cat.image} alt={cat.name} width={800} height={600} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-secondary)]/30 text-lg font-medium">{cat.name?.slice(0,2)}</div>
                    )}
                  </div>
                  <div className="mt-3.5 flex items-start justify-between gap-3">
                    <h3 className="text-base lg:text-[17px] font-semibold text-[var(--color-text)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                      {cat.name}
                    </h3>
                    <Icon name="arrow-up-right" size={16} className="shrink-0 mt-1 text-[var(--color-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
