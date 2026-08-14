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
      title: 'Portfolio Breadth',
      items: [
        { label: 'Product categories', value: '10+' },
        { label: 'Product options', value: '100+' },
        { label: 'Supply model', value: 'Integrated' },
      ],
    },
    {
      icon: 'zap',
      title: 'Global Delivery',
      items: [
        { label: 'Export markets', value: '30+' },
        { label: 'Container shipments', value: '500+' },
        { label: 'Delivery support', value: 'End-to-end' },
      ],
    },
    {
      icon: 'shield',
      title: 'Project Fit',
      items: [
        { label: 'Selection basis', value: 'Farm type' },
        { label: 'Capacity and site', value: 'Matched' },
        { label: 'Supply window', value: 'One partner' },
      ],
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Value, Calculated"
          title={<>We Don&apos;t Say Quality. We <span className="split-accent">Show Numbers.</span></>}
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
          The figures describe the scope of the Agricon catalog. Final equipment selection depends on farm type, capacity, site conditions, operation requirements and budget — our team matches the package to the project.
        </p>
      </Reveal>
    </section>
  )
}
