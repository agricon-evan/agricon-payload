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
    ? categories.map((cat) => {
        // Prefer the CMS category image. The bundled catalog map is keyed by the OLD category
        // slugs, so renamed categories (wire-mesh, farming-vehicle, breeding-coop-equipment,
        // other-machine) silently fell through to no image.
        const media = (cat as unknown as { image?: { url?: string } }).image
        return { ...cat, image: media?.url || categoryImages[cat.slug] || null }
      })
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
          10 categories — five across, two rows. Every line visible at once, no rail.
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-8 lg:gap-x-5 lg:gap-y-10">
          {items.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 45}>
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
                <div className="mt-3 flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-[var(--color-text)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                    {cat.name}
                  </h3>
                  <Icon name="arrow-up-right" size={15} className="shrink-0 mt-0.5 text-[var(--color-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
