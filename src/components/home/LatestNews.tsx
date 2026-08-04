import Link from 'next/link'
import { getBlogPosts } from '@/lib/payload'
import type { Locale } from '@/i18n/config'
import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'

interface Props {
  locale: Locale
}

// Unified display shape — maps both CMS posts and placeholders into one structure
interface NewsItem {
  title: string
  excerpt: string
  date: string
  slug: string
  coverUrl: string | null
}

export default async function LatestNews({ locale }: Props) {
  const posts = await getBlogPosts(locale)
  const lp = locale === 'en' ? '' : `/${locale}`

  // Map CMS posts to the unified shape
  const cmsItems: NewsItem[] = posts.map((p: any) => ({
    title: p.title || '',
    excerpt: p.excerpt || p.subtitle || '',
    date: p.createdAt ? new Date(p.createdAt).getFullYear().toString() : '2026',
    slug: p.slug || '',
    coverUrl: typeof p.coverImage === 'object' && p.coverImage?.url ? p.coverImage.url : null,
  }))

  const placeholders: NewsItem[] = [
    { title: 'How to Choose the Right Layer Cage System', excerpt: 'A-type vs H-type vs manure-belt: capacity, cost and climate considerations for your poultry house.', date: '2026', slug: '', coverUrl: null },
    { title: '5 Key Factors for Incubation Success', excerpt: 'Temperature, humidity, turning, ventilation and sanitation — the science behind hatch rate.', date: '2026', slug: '', coverUrl: null },
    { title: 'Designing a Profitable Broiler House', excerpt: 'Stocking density, ventilation and feeding automation that maximize your return per square meter.', date: '2026', slug: '', coverUrl: null },
  ]

  const items = cmsItems.length > 0 ? cmsItems : placeholders

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="eyebrow">News &amp; Insights</span>
            <h2 className="mt-2 text-[var(--color-text)]">From Our Blog</h2>
          </div>
          <Link href={`${lp}/blog`} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline">
            View all
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {items.map((p, i) => (
          <Reveal key={i} delay={i * 100} className="h-full">
            <article className="card card-hover h-full flex flex-col">
              <div className="aspect-video bg-[var(--color-muted)] flex items-center justify-center icon-zoom overflow-hidden">
                {p.coverUrl ? (
                  <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Icon name="file-text" size={36} className="text-[var(--color-text-secondary)]/30" />
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-xs text-[var(--color-text-secondary)]">{p.date}</p>
                <h3 className="mt-2 text-[var(--color-text)] flex-1">{p.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{p.excerpt}</p>
                {p.slug && (
                  <Link href={`${lp}/blog/${p.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                    Read more
                    <Icon name="arrow-right" size={13} />
                  </Link>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
