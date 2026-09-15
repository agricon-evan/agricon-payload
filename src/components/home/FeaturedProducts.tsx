import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getProducts } from '@/lib/payload'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'

/**
 * Featured products band — products with `featured: true` in the CMS.
 * Rendered on the homepage under the category grid.
 */
export default async function FeaturedProducts({ locale }: { locale: Locale }) {
  const products = await getProducts(locale)
  // 12 cards: featured products first, topped up from the rest of the catalogue.
  // Only 10 products currently carry `featured: true` — mark two more in the CMS
  // to control which products fill the last two slots.
  const featured = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)]
    .slice(0, 12)
    .map((p) => {
      const sub = typeof p.subcategory === 'object' && p.subcategory !== null ? p.subcategory : null
      const cat = sub && typeof sub.category === 'object' && sub.category !== null ? sub.category : null
      const cover =
        p.images && p.images.length > 0 && typeof p.images[0] === 'object' && p.images[0] !== null
          ? typeof (p.images[0] as { image?: unknown }).image === 'object' && (p.images[0] as { image?: { url?: string } }).image
            ? ((p.images[0] as { image: { url?: string } }).image.url ?? null)
            : null
          : null
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        moq: p.moq || null,
        price: p.price || null,
        categorySlug: cat?.slug || '',
        subcategorySlug: sub?.slug || '',
        image: cover,
      }
    })
    .filter((p) => p.slug)

  if (featured.length === 0) return null

  return (
    <section className="py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Featured Equipment"
            title={<>Best-Selling <span className="split-accent">Equipment</span></>}
            description="Hand-picked machines and systems our customers order most — verified by the product team."
          />
        </Reveal>

        {/*
          12 products — 4 across on desktop, 3 rows.
          Big square photos with just the product name underneath: photo-led, minimal text.
          No overlay of any kind, so the product shots stay untouched.
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-5 lg:gap-y-10">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 45}>
              <Link
                href={`/${locale}/products/${p.categorySlug || 'poultry-equipment'}/${p.subcategorySlug}/${p.slug}`}
                className="group block"
              >
                <div className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface-alt)]">
                  {p.image ? (
                    <MediaImage src={p.image} alt={p.name} width={800} height={800} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon name="box" size={34} className="text-[var(--color-text-secondary)]/30" />
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-[var(--color-text)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                    {p.name}
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
