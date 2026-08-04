import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

export default function WhyChooseUs() {
  const features = [
    { icon: 'factory', title: 'Factory Direct', desc: 'We own the production line. No middlemen — better pricing, full quality control, direct technical support.' },
    { icon: 'shield', title: 'Certified Quality', desc: 'ISO 9001 certified manufacturing. Galvanized steel and stainless components rated for 15+ years of service.' },
    { icon: 'globe', title: 'Export Expertise', desc: '20+ years shipping to Africa, Southeast Asia and South America. We handle documentation, packing and logistics.' },
    { icon: 'gear', title: 'After-sales Support', desc: 'Spare parts in stock, installation guidance, and responsive engineers — your farm never stops because of us.' },
    { icon: 'ruler', title: 'Custom Design', desc: 'Every farm is different. Our engineers adapt layouts, capacities and automation to your building and budget.' },
    { icon: 'users', title: 'Multilingual Team', desc: 'English, Russian, French, Spanish, Swahili and Arabic speaking support for your local team.' },
  ]

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Why Agricon"
          title="A Partner, Not Just a Supplier"
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
