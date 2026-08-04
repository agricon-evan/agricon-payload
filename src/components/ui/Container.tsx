import type { ReactNode } from 'react'

export default function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-7xl mx-auto px-6 ${className}`}>{children}</div>
}

export function Section({ children, className = '', bg }: { children: ReactNode; className?: string; bg?: 'muted' | 'primary' }) {
  const bgClass = bg === 'muted' ? 'bg-[var(--color-surface-alt)]' : bg === 'primary' ? 'bg-[var(--color-primary)] text-white' : ''
  return <section className={`py-14 md:py-20 ${bgClass} ${className}`}>{children}</section>
}

export function Badge({ children, color = 'primary' }: { children: ReactNode; color?: 'primary' | 'accent' | 'gray' }) {
  const colorClass = color === 'primary'
    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
    : color === 'accent'
      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
      : 'bg-[var(--color-muted)] text-[var(--color-text-secondary)]'
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>{children}</span>
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`border-t border-[var(--color-border)] ${className}`} />
}
