import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getBlogPosts } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export default async function BlogPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'common')
  const tHome = getTranslations(locale as Locale, 'home')
  const posts = await getBlogPosts(locale)
  const lp = locale === 'en' ? '' : `/${locale}`

  return (
    <>
      <PageHero
        title={t.nav?.blog || 'Blog'}
        description="Industry insights, farm tips, and company news"
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.nav?.blog || 'Blog'}`}
      />
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {posts.length === 0 ? (
          <Reveal>
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-5">
                <Icon name="book" size={26} />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Articles Coming Soon</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] max-w-md mx-auto">Expert advice for poultry and livestock farmers is on the way.</p>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={(i % 3) * 80} className="h-full">
                <a href={`${lp}/blog/${post.slug}`} className="card card-hover h-full block">
                  <div className="aspect-video bg-[var(--color-muted)] flex items-center justify-center icon-zoom overflow-hidden">
                    {post.coverImage && typeof post.coverImage === 'object' && post.coverImage.url ? (
                      <img src={post.coverImage.url} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Icon name="file-text" size={32} className="text-[var(--color-text-secondary)]/30" />
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-[var(--color-text-secondary)]">{post.createdAt ? new Date(post.createdAt).getFullYear() : '2026'}</p>
                    <h2 className="mt-2 text-[var(--color-text)]">{post.title}</h2>
                    {post.excerpt && <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{post.excerpt}</p>}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
