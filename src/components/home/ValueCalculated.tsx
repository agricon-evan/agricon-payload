import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

// Homepage section — "Value, Calculated"
// From company principle 04: 价值必须尽可能算出来 (Value must be calculated, not claimed)
// We avoid "high quality / good service" adjectives and show measurable outcomes instead.
export default function ValueCalculated() {
  const calculators = [
    {
      icon: 'trending-down',
      title: 'Lower Operating Cost',
      items: [
        { label: 'Feed conversion improved', value: 'up to 8%' },
        { label: 'Labor cost reduction', value: '30–40%' },
        { label: 'Energy per bird saved', value: 'up to 15%' },
      ],
    },
    {
      icon: 'zap',
      title: 'Higher Output',
      items: [
        { label: 'Hatch rate improvement', value: '+6–9%' },
        { label: 'Egg collection efficiency', value: '99%' },
        { label: 'House capacity per m²', value: '+35%' },
      ],
    },
    {
      icon: 'shield',
      title: 'Less Risk & Downtime',
      items: [
        { label: 'Galvanized steel lifespan', value: '15+ years' },
        { label: 'On-time delivery rate', value: '98%' },
        { label: 'Spare parts availability', value: '95% in stock' },
      ],
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Value, Calculated"
          title="We Don't Say Quality. We Show Numbers."
          description="Every claim we make is backed by a measurable outcome on your farm — because trust is built with evidence, not adjectives."
        />
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mt-10">
        {calculators.map((c, i) => (
          <Reveal key={c.title} delay={i * 100} className="h-full">
            <div className="card card-hover p-6 md:p-8 h-full">
              <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5">
                <Icon name={c.icon} size={22} />
              </div>
              <h3 className="text-[var(--color-text)]">{c.title}</h3>
              <ul className="mt-4 space-y-3">
                {c.items.map(item => (
                  <li key={item.label} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)]/60 pb-2.5">
                    <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
                    <span className="text-sm font-semibold text-[var(--color-primary)] whitespace-nowrap">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={200}>
        <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Figures based on typical results across our 500+ installations. Your actual results depend on farm conditions, management, and local climate — we will calculate expected outcomes for your specific project during consultation.
        </p>
      </Reveal>
    </section>
  )
}
