import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

// From company principle 05: 信任靠证据，不靠形容词 (Trust is built on evidence, not adjectives)
// And sales process 07 证据匹配 (Evidence matching — every customer concern has supporting documentation)
export default function TrustEvidence() {
  const evidence = [
    {
      icon: 'shield',
      title: 'Quality Assurance',
      items: ['ISO 9001 certified processes', 'CE marked components', 'Pre-shipment load testing', 'Galvanized steel rated 15+ years'],
    },
    {
      icon: 'clipboard',
      title: 'QC Documentation',
      items: ['QC flow & inspection reports', 'Material traceability records', 'Failure handling SOP', 'Factory test certificates'],
    },
    {
      icon: 'briefcase',
      title: 'Project Track Record',
      items: ['500+ farm installations', '20+ export countries', 'Repeat customers in 80% of markets', 'Projects from 500 to 100,000 birds'],
    },
    {
      icon: 'file-text',
      title: 'Export Documentation',
      items: ['Certificate of origin', 'Export customs documents', 'Installation drawings & manuals', 'Spare parts catalog with lead times'],
    },
  ]

  return (
    <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Trust & Evidence"
            title="We Prove What We Claim"
            description="Ask us for any document — inspection reports, traceability records, test certificates. Every advantage we state is verifiable."
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
