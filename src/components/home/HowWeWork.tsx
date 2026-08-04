import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

// From company sales process (手册第二层 11-阶段作战流程), simplified to a
// client-facing 6-step workflow. Key differentiators: needs diagnosis (04),
// value calculation (06), evidence matching (07), risk-reducing trial (10).
export default function HowWeWork() {
  const steps = [
    { num: '01', icon: 'users', title: 'Consultation & Diagnosis', desc: 'We ask about your current setup, pain points, and goals — then design around your specific farm, not a template.' },
    { num: '02', icon: 'ruler', title: 'Layout & Value Design', desc: 'Our engineers produce a facility layout, equipment list, and a calculated value breakdown — expected output, cost savings, and payback.' },
    { num: '03', icon: 'document', title: 'Quote, Evidence & Proposal', desc: 'You receive a transparent quote backed by evidence — QC flow, inspection samples, and references for your exact application.' },
    { num: '04', icon: 'gear', title: 'Manufacturing & QC', desc: 'Built under ISO-controlled processes with in-factory load testing and pre-shipment inspection reports you can review.' },
    { num: '05', icon: 'handshake', title: 'Risk-Lowering Delivery', desc: 'Sample or trial batches for first orders, phased payments, pre-production confirmation, and on-site installation support.' },
  ]
  const icons = { 'document': 'file-text', 'gear': 'gear', 'handshake': 'handshake', 'ruler': 'ruler', 'users': 'users' }

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="How We Work"
          title="From Inquiry to Production"
          description="A structured, evidence-based process — designed to lower your risk on every first order"
        />
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 md:gap-6 mt-10">
        {steps.map((s, i) => (
          <Reveal key={s.num} delay={i * 80} className="h-full">
            <div className="card card-hover p-6 h-full flex flex-col text-center">
              <span className="text-xs font-bold text-[var(--color-primary)]/40 tracking-wider tabular-nums">{s.num}</span>
              <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center my-4 mx-auto">
                <Icon name={icons[s.icon as keyof typeof icons] || s.icon} size={22} />
              </div>
              <h3 className="text-[var(--color-text)]">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}