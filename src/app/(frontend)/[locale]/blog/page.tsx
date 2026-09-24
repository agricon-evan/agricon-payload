import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getBlogPosts } from '@/lib/payload'
import { resolvePageHeroImage } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'
import { FALLBACK_ARTICLES } from '@/lib/blog-fallback'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return pageMetadata(locale as Locale, {
    path: '/blog',
    // `blog` carries its own meta title/description so the SEO copy can stay
    // longer than the visible hero line, and both follow the locale.
    namespace: 'blog',
    title: 'Blog',
    description:
      'Guides and field notes on poultry housing, livestock systems, feed processing and choosing the right farm equipment.',
  })
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('blog', '/images/heroes/farm-field.jpg', locale)
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const tBlog = getTranslations(locale as Locale, 'blog')
  const tagLabels = (tBlog.tags ?? {}) as Record<string, string>
  const posts = await getBlogPosts(locale)
  const lp = `/${locale}`
  const fallbackPosts = FALLBACK_ARTICLES.map((a) => ({
    id: a.slug,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    year: a.date,
    image: a.coverUrl,
  }))
  const displayPosts = posts.length > 0
    ? posts.map(post => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || '',
        year: post.createdAt ? new Date(post.createdAt).getFullYear().toString() : '2026',
        image: typeof post.coverImage === 'object' && post.coverImage?.url ? post.coverImage.url : null,
        // Tag labels are localized through the `blog` UI namespace keyed by slug
        // (`blogTags.name` is not a localized CMS field — changing that needs a
        // schema migration; see scripts/i18n-apply-todo.ts).
        tags: (post.tags || [])
          .map((t) => {
            if (typeof t !== 'object' || t === null) return ''
            const slug = (t as { slug?: string }).slug || ''
            const name = (t as { name?: string }).name || ''
            return tagLabels[slug] || name
          })
          .filter(Boolean) as string[],
      }))
    : fallbackPosts

  return (
    <>
      <PageHero
        locale={locale as Locale}
        title={tBlog.hero?.title || t.nav?.blog || 'Blog'}
        description={tBlog.hero?.description || 'Industry insights, farm tips, and company news'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${tBlog.breadcrumb?.blog || t.nav?.blog || 'Blog'}`}
        image={heroImage}
      />
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {displayPosts.map((post, i) => (
            <Reveal key={post.id} delay={(i % 3) * 80} className="h-full">
              <Link href={`${lp}/blog/${post.slug}`} className="card card-hover h-full block overflow-hidden group">
                <div className="relative aspect-video bg-[var(--color-muted)] flex items-center justify-center icon-zoom overflow-hidden">
                  {post.image ? (
                    <MediaImage src={post.image} alt={post.title} width={800} height={450} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <Icon name="file-text" size={32} className="text-[var(--color-text-secondary)]/30" />
                  )}
                  <div className="absolute inset-0 bg-black/40" />
                  <span className="absolute bottom-4 left-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">{tBlog.badge || 'Field notes'}</span>
                </div>
                <div className="p-6">
                  <p className="text-xs text-[var(--color-text-secondary)]">{post.year}</p>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="mt-2 text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{post.title}</h2>
                    <span className="mt-2 w-8 h-8 shrink-0 aspect-square rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">↗</span>
                  </div>
                  {post.excerpt && <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">{post.excerpt}</p>}
                  {'tags' in post && (post as { tags?: string[] }).tags && (post as { tags?: string[] }).tags!.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {(post as { tags?: string[] }).tags!.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-full bg-[var(--color-primary)]/8 text-[var(--color-primary)] text-[11px] font-medium">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
