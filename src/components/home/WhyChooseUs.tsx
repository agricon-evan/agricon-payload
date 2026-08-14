import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

export default function WhyChooseUs() {
  const features = [
    { icon: 'layers', title: 'Coordinated Sourcing', desc: 'Poultry, livestock, feed processing, aquaculture, infrastructure and machinery through one supply window.' },
    { icon: 'shield', title: 'Quality & Order Control', desc: 'Product scope, specifications, quantities and key inspection points are confirmed before shipment.' },
    { icon: 'target', title: 'Project-Based Selection', desc: 'Equipment is matched to farm type, target capacity, site conditions, operating requirements and budget.' },
    { icon: 'truck', title: 'Export-Ready Delivery', desc: 'Export packing, product identification, loading plans, container coordination and shipping documents.' },
    { icon: 'users', title: 'Distributor Support', desc: 'Flexible product combinations, repeat-order support and coordinated sourcing for local market development.' },
    { icon: 'handshake', title: 'Long-Term Cooperation', desc: 'From individual equipment to complete project packages, we support expansion and repeat supply.' },
  ]

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Why Agricon"
          title={<>A <span className="split-accent">Partner</span>, Not Just a Supplier</>}
          description="Six reasons commercial farms across three continents build with Agricon"
        />
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 80} className="h-full">
            <div className="card card-hover p-6 md:p-8 h-full">
              <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5">
                <Icon name={f.icon} size={22} />
              </div>
              <h3 className="text-[var(--color-text)]">{f.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
