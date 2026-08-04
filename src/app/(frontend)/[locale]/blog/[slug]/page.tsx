import type { Locale } from '@/i18n/config'
import { getBlogPosts } from '@/lib/payload'
import CtaSection from '@/components/CtaSection'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params
  const posts = await getBlogPosts(locale)
  const post = posts.find((p) => p.slug === slug)

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Article Not Found</h1>
        <a href={`/${locale}/blog`} className="inline-flex items-center gap-1.5 mt-4 text-[var(--color-primary)] font-semibold">
          <Icon name="arrow-right" size={15} className="rotate-180" />
          Back
        </a>
      </div>
    )
  }

  return (
    <>
      <article className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <p className="text-sm text-[var(--color-text-secondary)]">{new Date(post.createdAt).toLocaleDateString()}</p>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)] leading-tight tracking-tight">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">{post.excerpt}</p>}
        {post.content && (
          <div
            className="mt-8 prose prose-slate max-w-none dark:prose-invert leading-relaxed text-[var(--color-text)]"
            dangerouslySetInnerHTML={{ __html: typeof post.content === 'string' ? post.content : '' }}
          />
        )}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
          <a href={`/${locale}/blog`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline">
            <Icon name="arrow-right" size={14} className="rotate-180" />
            Back to Blog
          </a>
        </div>
      </article>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
