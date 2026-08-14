import type { Locale } from '@/i18n/config'
import { getBlogPosts } from '@/lib/payload'
import { getFallbackArticle } from '@/lib/blog-fallback'
import { RichText } from '@payloadcms/richtext-lexical/react'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'
import BlogToc from '@/components/BlogToc'
import { buildHeadingIds } from '@/lib/slugify'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params
  const posts = await getBlogPosts(locale)
  const post = posts.find((p) => p.slug === slug)

  // CMS 为空时的内置文章 — 保证博客详情可用（不跳转 contact）
  const fallback = post ? null : getFallbackArticle(slug)

  if (!post && !fallback) {
    notFound()
  }

  const title = post?.title || fallback?.title || ''
  const excerpt = post?.excerpt || fallback?.excerpt || ''
  const date = post ? new Date(post.createdAt).toLocaleDateString() : fallback?.date || ''

  // SSR 大纲 — 与客户端 slugify 一致，锚点链接立即可用
  const tocSections = fallback ? buildHeadingIds(fallback.sections).map((s) => ({ id: s.id, text: s.heading })) : []

  return (
    <>
      <article className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        <p className="text-sm text-[var(--color-text-secondary)]">{date}</p>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)] leading-tight tracking-tight">{title}</h1>
        {excerpt && <p className="mt-4 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">{excerpt}</p>}

        {fallback?.coverUrl && (
          <Reveal>
            <div className="mt-8 rounded-lg overflow-hidden">
              <MediaImage src={fallback.coverUrl} alt={title} width={900} height={500} priority className="w-full aspect-[16/9] object-cover" />
            </div>
          </Reveal>
        )}

        {/* 页面大纲 + 正文 — 大纲自动扫描 h2/h3 生成锚点 */}
        <div className="mt-8">
          <BlogToc initialSections={tocSections}>
            {post?.content ? (
              <RichText
                className="prose-agricon max-w-none"
                data={post.content}
              />
            ) : fallback ? (
              <div className="space-y-8">
                {fallback.sections.map((s, i) => (
                  <Reveal key={i} delay={(i % 3) * 50}>
                    <section>
                      <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text)] leading-snug">{s.heading}</h2>
                      <p className="mt-3 text-[var(--color-text-secondary)] leading-relaxed">{s.body}</p>
                      {s.bullets && (
                        <ul className="mt-4 space-y-2">
                          {s.bullets.map((b, j) => (
                            <li key={j} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-[7px] flex-shrink-0" aria-hidden="true" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </Reveal>
                ))}
              </div>
            ) : null}
          </BlogToc>
        </div>

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
