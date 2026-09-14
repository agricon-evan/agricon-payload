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
  const featured = products
    .filter((p) => p.featured)
    .slice(0, 10)
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
      <div className="w-full max-w-7xl mx-auto px-6 flex flex-col py-8 lg:py-10 lg:h-[calc(100vh-72px)]">

        <Reveal className="shrink-0">
          <SectionHeading
            className="!mb-6 lg:!mb-8"
            eyebrow="Featured Equipment"
            title={<>Best-Selling <span className="split-accent">Equipment</span></>}
            description="Hand-picked machines and systems our customers order most — verified by the product team."
          />
        </Reveal>

        {/*
          Full-screen product grid — 10 items.
          lg+ : 5 columns × 2 rows, vertically centred in the space left under the heading.
          below lg : a single-row horizontal snap rail, so the section still fits one screen.
        */}
        <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:pb-0 lg:content-center">
          {featured.map((p, i) => (
            <Reveal
              key={p.id}
              delay={(i % 5) * 60}
              className="w-[46%] shrink-0 sm:w-[31%] md:w-[23%] lg:w-auto lg:shrink h-full"
            >
              <Link
                href={`/${locale}/products/${p.categorySlug || 'poultry-equipment'}/${p.subcategorySlug}/${p.slug}`}
                className="card card-hover group flex h-full flex-col overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-[var(--color-muted)] flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <MediaImage src={p.image} alt={p.name} width={640} height={480} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <Icon name="box" size={30} className="text-[var(--color-text-secondary)]/30" />
                  )}
                  <span className="absolute top-2 left-2 bg-[var(--color-primary)] text-white text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full">
                    Export-ready
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3 lg:p-4">
                  <h3 className="text-[13px] lg:text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                  <span className="mt-auto pt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
                    View Details
                    <Icon name="arrow-right" size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}
