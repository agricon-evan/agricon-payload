import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { homeCopy } from '@/lib/home-copy'
import { getProducts, resolveProductCategorySlug } from '@/lib/payload'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'
import ScrollRail from '@/components/ui/ScrollRail'

/**
 * Featured products band — products with `featured: true` in the CMS.
 * Rendered on the homepage under the category grid.
 */
export default async function FeaturedProducts({ locale }: { locale: Locale }) {
  const h = homeCopy(locale).featured ?? {}
  const products = await getProducts(locale)
  // 12 cards: featured products first, topped up from the rest of the catalogue.
  // Only 10 products currently carry `featured: true` — mark two more in the CMS
  // to control which products fill the last two slots.
  const rows = (await Promise.all(
    [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)]
      .slice(0, 12)
      .map(async (p) => {
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
        // depth-1 products carry subcategory.category as a bare id, so resolve it
        // against the subcategory list (same strategy as the solution pages).
        categorySlug: cat?.slug || (await resolveProductCategorySlug(p, locale)),
        categoryName: (cat as { name?: string } | null)?.name || '',
        subcategorySlug: sub?.slug || '',
        subcategoryName: (sub as { name?: string } | null)?.name || '',
        image: cover,
      }
    }),
  ))
  // The old `|| 'poultry-equipment'` fallback stuffed every non-poultry product
  // into a poultry URL — it rendered 200 only because the product route matches
  // by slug, but the visible category segment was wrong.
  const featured = rows.filter((p) => p.slug && p.categorySlug && p.subcategorySlug)

  if (featured.length === 0) return null

  return (
    <section className="py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow={h.eyebrow || 'Featured Equipment'}
            title={<>{h.titleLead || 'Best-Selling'} <span className="split-accent">{h.titleAccent || 'Equipment'}</span></>}
            description={h.description || 'Hand-picked machines and systems our customers order most — verified by the product team.'}
          />
        </Reveal>

        {/*
          Horizontal gallery — one row of large cards that scrolls sideways.
          Cards get 360px each (vs 290px in a 4-up grid), so the product shots read
          properly; about 3.4 are visible at a time and the next one peeks in to signal
          there is more. Prev/next controls + a progress bar live in ScrollRail, because
          horizontal scrolling with a mouse is otherwise awkward.
        */}
        <ScrollRail label={h.eyebrow || 'Featured equipment'} locale={locale}>
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 45} className="snap-start shrink-0 w-[280px] sm:w-[320px] lg:w-[360px]">
              <Link
                href={`/${locale}/products/${p.categorySlug || 'poultry-equipment'}/${p.subcategorySlug}/${p.slug}`}
                className="group block"
              >
                <div className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface-alt)]">
                  {p.image ? (
                    <MediaImage src={p.image} alt={p.name} width={800} height={800} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon name="box" size={30} className="text-[var(--color-text-secondary)]/30" />
                    </div>
                  )}
                </div>
                {/* Ranked eyebrow */}
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] leading-none">
                  <span className={i < 3 ? 'text-[var(--color-accent)]' : 'text-[var(--color-primary-light)]'}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {p.categoryName ? (
                    <>
                      <span className="mx-1.5 text-[var(--color-border)]">·</span>
                      <span className="text-[var(--color-primary-light)]">{p.categoryName}</span>
                    </>
                  ) : null}
                </p>
                <div className="mt-1.5 flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-[var(--color-text)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                    {p.name}
                  </h3>
                  <Icon name="arrow-up-right" size={15} className="shrink-0 mt-0.5 text-[var(--color-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </Reveal>
          ))}
        </ScrollRail>
      </div>
    </section>
  )
}
