import Link from 'next/link'
import { getCategories } from '@/lib/payload'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

interface Props {
  locale: Locale
}

export default async function ProductCategories({ locale }: Props) {
  const categories = await getCategories(locale)
  const t = getTranslations(locale, 'common')
  const lp = locale === 'en' ? '' : `/${locale}`

  const placeholders = [
    { icon: 'zap', name: 'Egg Incubators', desc: 'Industrial incubation for maximum hatch rates', slug: 'incubators' },
    { icon: 'grid', name: 'Layer Cages', desc: 'A-type, H-type and manure-belt systems', slug: 'layer-cages' },
    { icon: 'trending-up', name: 'Broiler Equipment', desc: 'Raising systems for efficient broiler production', slug: 'broiler-equipment' },
    { icon: 'layers', name: 'Feed Machinery', desc: 'Pelleting, grinding and mixing lines', slug: 'feed-machinery' },
  ]
  const items = categories.length > 0 ? categories : placeholders

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
          <Reveal key={cat.id || cat.slug} delay={i * 80} className="h-full">
            <Link
              href={`${lp}/products/${cat.slug || ''}`}
              className="card card-hover p-6 md:p-8 h-full flex flex-col group"
            >
              <div className="w-12 h-12 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5 transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                <Icon name={cat.icon || 'box'} size={24} />
              </div>
              <h3 className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">{cat.desc || cat.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                Explore
                <Icon name="arrow-right" size={14} />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
