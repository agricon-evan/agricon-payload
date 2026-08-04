interface PageHeroProps {
  title: string
  description?: string
  image?: string | null
  breadcrumb?: string
  align?: 'left' | 'center'
}

export default function PageHero({ title, description, image, breadcrumb, align = 'left' }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-primary-dark)] text-white">
      {image && (
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" loading="eager" />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />
      <div className={`relative max-w-7xl mx-auto px-6 py-14 md:py-24 ${align === 'center' ? 'text-center' : ''}`}>
        {breadcrumb && (
          <nav className="text-xs md:text-sm opacity-70 mb-3 tracking-wide" aria-label="Breadcrumb">
            {breadcrumb}
          </nav>
        )}
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">{title}</h1>
        {description && (
          <p className="mt-4 text-sm md:text-lg opacity-85 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
