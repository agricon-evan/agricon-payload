import type { ReactNode } from 'react'

interface SectionHeadingProps {
  eyebrow?: string
  /** 支持 split-color 语法：<span className="split-accent">橙色关键词</span> */
  title: ReactNode
  description?: string
  align?: 'left' | 'center'
  dark?: boolean
  className?: string
}

/**
 * AGRICON section heading — optional centered eyebrow with flanking rules,
 * split-color display title + short orange underline. Per D:\system-design.md
 * {component.split-color-title} and {component.orange-underline}.
 */
export default function SectionHeading({ eyebrow, title, description, align = 'center', dark = false, className = '' }: SectionHeadingProps) {
  return (
    <div className={`mb-10 md:mb-14 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && (
        <span className={`eyebrow mb-3 ${align === 'center' ? 'eyebrow-flank' : ''} ${dark ? '!text-[var(--color-accent-soft)]' : ''}`}>
          {eyebrow}
        </span>
      )}
      <h2 className={`split-color-title text-2xl md:text-4xl font-bold leading-[1.08] tracking-[-0.015em] ${dark ? 'text-white' : 'text-[var(--color-text)]'}`}>{title}</h2>
      <span className={`orange-underline mt-4 ${align === 'center' ? 'orange-underline-center' : ''}`} aria-hidden="true" />
      {description && (
        <p className={`mt-5 ${dark ? 'text-white/75' : 'text-[var(--color-text-secondary)]'} ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'} leading-relaxed text-[0.95rem]`}>
          {description}
        </p>
      )}
    </div>
  )
}
