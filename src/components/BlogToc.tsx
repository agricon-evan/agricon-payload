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
}

/**
 * 博客文章页面大纲 — 服务端预渲染目录，客户端扫描 h2/h3 校准锚点并高亮当前章节。
 * 桌面端 sticky 左侧导航（soft-card），移动端顶部卡片。
 * 当前章节以品牌绿高亮 + 橙色序号标识。
 */
export default function BlogToc({ children, initialSections = [] }: BlogTocProps) {
  const articleRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<TocSection[]>(initialSections)
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const root = articleRef.current
    if (!root) return

    const headings = Array.from(root.querySelectorAll('h2, h3'))
    const seen = new Map<string, number>()
    const list: TocSection[] = headings.map((h) => {
      const text = (h.textContent || '').trim()
      const base = slugifyHeading(text)
      const n = seen.get(base) || 0
      seen.set(base, n + 1)
      const id = n > 0 ? `${base}-${n + 1}` : base
      h.id = id
      return { id, text, level: h.tagName === 'H2' ? 2 : 3 }
    })
    if (list.length) setItems(list)

    if (!list.length || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-90px 0px -70% 0px', threshold: 0 },
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [])

  if (!items.length) {
    return <div ref={articleRef}>{children}</div>
  }

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      {/* 页面大纲 — 左侧 sticky（桌面）/ 顶部卡片（移动） */}
      <aside className="mb-8 lg:mb-0">
        <nav
          aria-label="Table of contents"
          className="lg:sticky lg:top-24 bg-[var(--color-canvas-soft)] border border-[var(--color-border)] rounded-lg p-5"
        >
          <span className="eyebrow">On This Page</span>
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
