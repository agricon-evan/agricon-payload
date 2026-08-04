import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'white'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: Variant
  size?: Size
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  fullWidth?: boolean
  ariaLabel?: string
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]',
  secondary: 'bg-[var(--color-surface-alt)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)]',
  accent: 'bg-[var(--color-accent)] text-white hover:brightness-110',
  outline: 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10',
  ghost: 'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10',
  white: 'bg-white text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-white',
}

const sizeClasses: Record<Size, string> = {
  // Mobile-first: min 44px tap target
  sm: 'px-4 py-2 min-h-[40px] text-sm',
  md: 'px-6 py-3 min-h-[48px] text-base',
  lg: 'px-8 py-4 min-h-[52px] text-lg',
}

export function Button({
  children, href, onClick, variant = 'primary', size = 'md',
  className = '', type = 'button', disabled, fullWidth, ariaLabel,
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg touch-manipulation transition-all duration-200 hover-lift focus-visible:outline-2 focus-visible:outline-[var(--color-ring)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ')

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} aria-label={ariaLabel}>
      {children}
    </button>
  )
}
