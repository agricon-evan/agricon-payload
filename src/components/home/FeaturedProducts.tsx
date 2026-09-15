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
    <section className="snap-start snap-always min-h-[100dvh] lg:h-screen bg-[var(--color-bg)] pt-[72px] flex">
      <div className="w-full max-w-7xl mx-auto px-6 flex flex-col py-5 lg:py-7 lg:h-[calc(100vh-72px)]">

        <Reveal className="shrink-0">
          <SectionHeading
            className="!mb-5 lg:!mb-6"
            eyebrow="Featured Equipment"
            title={<>Best-Selling <span className="split-accent">Equipment</span></>}
            description="Hand-picked machines and systems our customers order most — verified by the product team."
          />
        </Reveal>

        {/*
          Full-screen grid — 12 products in 4 columns × 3 rows.
          `grid-rows-3` splits the space under the heading into three equal rows, and each
          card lets the photo flex to fill whatever the caption doesn't use. That keeps the
          section exactly one screen and means the photos need no overlay at all.
          below lg : a single-row horizontal snap rail, which also stays one screen.
        */}
        <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 lg:grid lg:grid-cols-4 lg:grid-rows-3 lg:gap-4 lg:overflow-visible lg:pb-0">
          {featured.map((p, i) => (
            <Reveal
              key={p.id}
              delay={(i % 4) * 50}
              className="w-[46%] shrink-0 sm:w-[31%] md:w-[23%] lg:w-auto lg:shrink h-full min-h-0"
            >
              <Link
                href={`/${locale}/products/${p.categorySlug || 'poultry-equipment'}/${p.subcategorySlug}/${p.slug}`}
                className="card card-hover group h-full min-h-0 flex flex-col overflow-hidden"
              >
                {/* Clean photo — no scrim, no darkening */}
                <div className="relative aspect-[16/10] lg:aspect-auto lg:flex-1 min-h-0 bg-[var(--color-muted)] overflow-hidden">
                  {p.image ? (
                    <MediaImage src={p.image} alt={p.name} width={640} height={400} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon name="box" size={30} className="text-[var(--color-text-secondary)]/30" />
                    </div>
                  )}
                </div>
                {/* Caption sits below the photo */}
                <div className="shrink-0 px-3 py-2 flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                  <Icon name="arrow-up-right" size={13} className="shrink-0 text-[var(--color-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}
