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
    .slice(0, 6)
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
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Featured Equipment"
          title={<>Best-Selling <span className="split-accent">Equipment</span></>}
          description="Hand-picked machines and systems our customers order most — verified by the product team."
        />
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10">
        {featured.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 80} className="h-full">
            <Link
              href={`/${locale}/products/${p.categorySlug || 'poultry-equipment'}/${p.subcategorySlug}/${p.slug}`}
              className="card card-hover h-full block overflow-hidden group"
            >
              <div className="aspect-[4/3] bg-[var(--color-muted)] flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <MediaImage src={p.image} alt={p.name} width={640} height={480} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <Icon name="box" size={34} className="text-[var(--color-text-secondary)]/30" />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-snug">{p.name}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-2.5 py-1 rounded-xs">Export-ready</span>
                </div>
                <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[var(--color-primary)]">
                  View Details
                  <Icon name="arrow-right" size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
