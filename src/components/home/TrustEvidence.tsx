import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

// From company principle 05: 信任靠证据，不靠形容词 (Trust is built on evidence, not adjectives)
// And sales process 07 证据匹配 (Evidence matching — every customer concern has supporting documentation)
// Claims are read from SiteSettings (admin-editable) so only verified statements ship.
export default function TrustEvidence() {  const evidence = [
    {
      icon: 'shield',
      title: 'Quality & Order Control',
      items: ['Product scope confirmed', 'Specifications and quantities checked', 'Key inspection points agreed', 'Production follow-up coordinated'],
    },
    {
      icon: 'clipboard',
      title: 'Project Matching',
      items: ['Farm type and capacity reviewed', 'Site conditions considered', 'Equipment and accessories matched', 'Practical configuration proposed'],
    },
    {
      icon: 'briefcase',
      title: 'Coordinated Supply',
      items: ['Multiple categories through one window', 'Flexible equipment combinations', 'Individual orders or project packages', 'Repeat-order support for distributors'],
    },
    {
      icon: 'file-text',
      title: 'Export-Ready Delivery',
      items: ['Export packing and labeling', 'Container loading plans', 'Shipping document preparation', 'Shipment coordination to dispatch'],
    },
  ]

  return (
    <section className="bg-[var(--color-surface-brand)] text-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Trust & Evidence"
            title={<>We <span className="split-accent !text-[var(--color-accent)]">Prove</span> What We Claim</>}
            description="Ask us for any document — inspection reports, traceability records, test certificates. Every advantage we state is verifiable."
            dark
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-10">
          {evidence.map((e, i) => (
            <Reveal key={e.title} delay={i * 80} className="h-full">
              <div className="card card-hover p-6 h-full">
                <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5">
                  <Icon name={e.icon} size={22} />
                </div>
                <h3 className="text-[var(--color-text)]">{e.title}</h3>
                <ul className="mt-3 space-y-2">
                  {e.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      <Icon name="check" size={14} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
