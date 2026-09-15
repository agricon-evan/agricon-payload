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
    <section className="snap-start snap-always min-h-[100dvh] lg:h-screen bg-[var(--color-bg)] pt-[72px] flex">
      <div className="w-full max-w-7xl mx-auto px-6 flex flex-col py-5 lg:py-7 lg:h-[calc(100vh-72px)]">
        <Reveal className="shrink-0">
          <SectionHeading
            className="!mb-5 lg:!mb-6"
            eyebrow={t.nav?.products || 'Products'}
            title={<>Complete Farm <span className="split-accent">Equipment Lines</span></>}
            description="An integrated equipment ecosystem covering breeding, feeding, housing, processing and daily farm operation."
          />
        </Reveal>

        {/*
          Full-screen grid — 10 categories in 5 columns × 2 rows.
          Rows are sized with `grid-rows-2` + `1fr` so the two rows always split the
          space left under the heading exactly; each card lets the photo flex to fill
          whatever the caption doesn't use. Result: no photo overlay is needed at all,
          and the section is exactly one screen at any text length.
        */}
        <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:grid-rows-2 gap-3 md:gap-4">
          {items.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 50} className="h-full min-h-0">
              <Link
                href={cat.slug ? `${lp}/products/${cat.slug}` : `${lp}/products`}
                className="card card-hover h-full min-h-0 min-w-0 flex flex-col group overflow-hidden"
              >
                {/* Clean photo — no scrim, no darkening */}
                <div className="relative flex-1 min-h-0 bg-[var(--color-muted)] overflow-hidden">
                  {cat.image ? (
                    <MediaImage src={cat.image} alt={cat.name} width={800} height={600} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-secondary)]/30 text-lg font-medium">{cat.name?.slice(0,2)}</div>
                  )}
                </div>
                {/* Caption sits below the photo, so nothing ever tints the image */}
                <div className="shrink-0 px-3 lg:px-4 pt-3 pb-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] lg:text-[15px] font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-2">
                      {cat.name}
                    </h3>
                    <span className="shrink-0 mt-0.5 text-[var(--color-primary)] text-sm leading-none transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] lg:text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
