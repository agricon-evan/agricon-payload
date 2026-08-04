import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

export default function GlobalCoverage() {
  const regions = [
    { icon: 'globe', title: 'Africa', sub: 'Nigeria, Kenya, Tanzania, Zambia, Ghana, Ethiopia' },
    { icon: 'globe', title: 'Southeast Asia', sub: 'Vietnam, Philippines, Indonesia, Malaysia, Thailand' },
    { icon: 'globe', title: 'South America', sub: 'Brazil, Peru, Colombia, Ecuador, Bolivia' },
    { icon: 'globe', title: 'Central Asia & CIS', sub: 'Uzbekistan, Kazakhstan, Russia, Ukraine' },
  ]

  return (
    <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Global Reach"
            title="Serving Farms on Every Continent"
            description="From single-layer houses to 100,000-bird complexes — our equipment works in any climate"
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-10">
          {regions.map((r, i) => (
            <Reveal key={r.title} delay={i * 80} className="h-full">
              <div className="card card-hover p-6 md:p-8 h-full">
                <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5">
                  <Icon name={r.icon} size={22} />
                </div>
                <h3 className="text-[var(--color-text)]">{r.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{r.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
