'use client'

import { useEffect, useRef, useState } from 'react'
import { slugifyHeading } from '@/lib/slugify'

export interface TocSection {
  id: string
  text: string
  level?: number
}

interface BlogTocProps {
  /** 文章内容（服务端渲染的子节点），组件会扫描其中的 h2/h3 生成大纲 */
  children: React.ReactNode
  /** SSR 预渲染的目录（服务端用与客户端相同的 slugify 生成 id） */
  initialSections?: TocSection[]
  /** 目录标题（本地化），默认英文 */
  title?: string
  /** 目录导航的可访问名称（本地化），默认英文 */
  label?: string
}

/**
 * 博客文章页面大纲 — 服务端预渲染目录，客户端扫描 h2/h3 校准锚点并高亮当前章节。
 * 桌面端 sticky 左侧导航（soft-card），移动端顶部卡片。
 * 当前章节以品牌绿高亮 + 橙色序号标识。
 */
export default function BlogToc({ children, initialSections = [], title = 'On This Page', label = 'Table of contents' }: BlogTocProps) {
  const articleRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<TocSection[]>(initialSections)
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const root = articleRef.current
    if (!root) return

    let intersection: IntersectionObserver | null = null
    let mutation: MutationObserver | null = null

    /**
     * Scans the article, (re)assigns anchor ids and refreshes the outline.
     *
     * It must be re-runnable: `<RichText>` (Lexical) replaces its whole subtree
     * once it renders on the client, so ids written during the first pass end up
     * on nodes that are no longer in the document. The table of contents then
     * looked correct while every link scrolled nowhere — clicking a TOC entry
     * changed the hash but left `window.scrollY` at 0. The MutationObserver below
     * re-applies the ids whenever the article's DOM is replaced.
     */
    const sync = () => {
      const headings = Array.from(root.querySelectorAll('h2, h3'))
      const seen = new Map<string, number>()
      const list: TocSection[] = headings.map((h) => {
        const text = (h.textContent || '').trim()
        const base = slugifyHeading(text)
        const n = seen.get(base) || 0
        seen.set(base, n + 1)
        const id = n > 0 ? `${base}-${n + 1}` : base
        if (h.id !== id) h.id = id
        return { id, text, level: h.tagName === 'H2' ? 2 : 3 }
      })
      setItems((prev) => (JSON.stringify(prev) === JSON.stringify(list) ? prev : list))

      intersection?.disconnect()
      if (headings.length && 'IntersectionObserver' in window) {
        intersection = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) setActiveId((entry.target as HTMLElement).id)
            }
          },
          { rootMargin: '-90px 0px -70% 0px', threshold: 0 },
        )
        headings.forEach((h) => intersection?.observe(h))
      }
    }

    sync()
    // childList only — assigning `h.id` above is an attribute change and must not
    // re-trigger this observer (it would loop).
    mutation = new MutationObserver(() => sync())
    mutation.observe(root, { childList: true, subtree: true })

    return () => {
      mutation?.disconnect()
      intersection?.disconnect()
    }
  }, [])

  if (!items.length) {
    return <div ref={articleRef}>{children}</div>
  }

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      {/* 页面大纲 — 左侧 sticky（桌面）/ 顶部卡片（移动） */}
      <aside className="mb-8 lg:mb-0">
        <nav
          aria-label={label}
          className="lg:sticky lg:top-24 bg-[var(--color-canvas-soft)] border border-[var(--color-border)] rounded-lg p-5"
        >
          <span className="eyebrow">{title}</span>
          <ol className="mt-4 space-y-0.5">
            {items.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm leading-snug transition-colors ${
                    item.id === activeId
                      ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
                  } ${item.level === 3 ? 'pl-7' : ''}`}
                >
                  <span
                    className={`text-xs font-bold tabular-nums flex-shrink-0 ${
                      item.id === activeId ? 'text-[var(--color-accent)]' : 'text-[var(--color-primary)]/45'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{item.text}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      {/* 文章内容 — 客户端扫描此容器校准锚点 */}
      <div ref={articleRef} className="min-w-0">
        {children}
      </div>
    </div>
  )
}
