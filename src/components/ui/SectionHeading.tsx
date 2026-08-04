interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export default function SectionHeading({ eyebrow, title, description, align = 'center', className = '' }: SectionHeadingProps) {
  return (
    <div className={`mb-10 md:mb-14 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && (
        <span className="inline-block text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-2">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl md:text-4xl font-bold text-[var(--color-text)] leading-tight">{title}</h2>
      {description && (
        <p className={`mt-3 text-[var(--color-text-secondary)] ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'} leading-relaxed`}>
          {description}
        </p>
      )}
    </div>
  )
}
