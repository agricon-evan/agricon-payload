import type { ReactNode } from 'react'

/**
 * Flat card — elevation is not the primary hierarchy mechanism.
 * Use `info-card` for soft-gray information containers, `.card` for white modules.
 * Per D:\system-design.md {component.info-card} + elevation philosophy.
 */
export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`bg-[var(--color-surface)] rounded-sm border border-[var(--color-border)] overflow-hidden ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 md:p-6 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`font-semibold text-[var(--color-text)] ${className}`}>{children}</h3>
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-[var(--color-text-secondary)] leading-relaxed ${className}`}>{children}</p>
}

export function CardMedia({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-[var(--color-muted)] flex items-center justify-center overflow-hidden ${className}`}>{children}</div>
}
