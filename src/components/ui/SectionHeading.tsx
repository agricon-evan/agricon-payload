interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  dark?: boolean
  className?: string
}

export default function SectionHeading({ eyebrow, title, description, align = 'center', dark = false, className = '' }: SectionHeadingProps) {
  return (
    <div className={`mb-10 md:mb-14 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && (
        <span className={`inline-block text-sm font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-white/70' : 'text-[var(--color-primary)]'}`}>
          {eyebrow}
        </span>
      )}
      <h2 className={`text-2xl md:text-4xl font-bold leading-tight ${dark ? 'text-white' : 'text-[var(--color-text)]'}`}>{title}</h2>
      {description && (
        <p className={`mt-3 ${dark ? 'text-white/70' : 'text-[var(--color-text-secondary)]'} ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'} leading-relaxed`}>
          {description}
        </p>
      )}
    </div>
  )
}
