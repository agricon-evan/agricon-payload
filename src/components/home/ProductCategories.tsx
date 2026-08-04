import Link from 'next/link'
import { getCategories } from '@/lib/payload'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'
import { categoryImages } from '@/lib/images'

interface Props { locale: Locale }

export default async function ProductCategories({ locale }: Props) {
  const categories = await getCategories(locale)
  const t = getTranslations(locale, 'common')
  const lp = locale === 'en' ? '' : `/${locale}`

  const items = categories.map((cat: any) => ({
    ...cat,
    image: categoryImages[cat.slug] || null,
  }))

  if (items.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionHeading
          eyebrow={t.nav?.products || 'Products'}
          title="Complete Farm Equipment Lines"
          description="From incubation to processing — every machine your commercial farm needs"
        />
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-10">
        {items.map((cat: any, i: number) => (
          <Reveal key={cat.id} delay={i * 80} className="h-full">
            <Link href={`${lp}/products/${cat.slug}`} className="card card-hover h-full flex flex-col group overflow-hidden">
              <div className="aspect-[4/3] bg-[var(--color-muted)] overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]/30 text-lg font-medium">{cat.name?.slice(0,2)}</div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">{cat.description}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
