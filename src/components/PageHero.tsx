import MediaImage from '@/components/ui/MediaImage'

interface PageHeroProps {
  title: string
  description?: string
  image?: string | null
  breadcrumb?: string
  align?: 'left' | 'center'
}

/**
 * {component.business-header} — green panel, eyebrow, split display title,
 * short orange underline, optional photo with brand-green overlay.
 * Flat, no gradients, no decorative rings.
 */
export default function PageHero({ title, description, image, breadcrumb, align = 'left' }: PageHeroProps) {
  return (
    <section className="hero-standard relative overflow-hidden bg-[var(--color-surface-brand)] text-white">
      {image && (
        <>
          <MediaImage src={image} alt="" width={1600} height={700} priority className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 photo-overlay-green" />
        </>
      )}
      <div className={`hero-standard-content relative max-w-7xl mx-auto px-6 py-16 md:py-24 lg:py-28 ${align === 'center' ? 'text-center' : ''}`}>
        <div className={align === 'center' ? 'mx-auto max-w-3xl' : 'max-w-3xl'}>
          {/* AGRICON eyebrow — always at the very top, breadcrumb stacks below */}
          <div className={`eyebrow !text-[var(--color-accent-soft)] mb-4 ${align === 'center' ? 'eyebrow-flank' : ''}`}>Agricon</div>
          {breadcrumb && (
            <nav
              className="inline-flex text-xs md:text-sm text-white/75 mb-6 tracking-wide px-3 py-1.5 rounded-sm border border-white/20 bg-white/5"
              aria-label="Breadcrumb"
            >
              {breadcrumb}
            </nav>
          )}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-[-0.02em] text-white">{title}</h1>
          <span className={`block w-14 h-[3px] bg-[var(--color-accent)] mt-5 ${align === 'center' ? 'mx-auto' : ''}`} aria-hidden="true" />
          {description && (
            <p className="mt-6 text-sm md:text-lg text-white/80 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
