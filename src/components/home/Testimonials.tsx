import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import SectionHeading from '@/components/ui/SectionHeading'

export default function Testimonials() {
  const testimonials = [
    {
      quote: 'Layer cages, feeding, drinking and poultry accessories coordinated for commercial egg production and farm expansion.',
      name: 'Kenya Layer Farm',
      role: 'Layer poultry project',
    },
    {
      quote: 'Grinding, mixing, pelletizing, cooling and packing support combined into a practical feed production package.',
      name: 'Ghana Feed Mill Setup',
      role: 'Animal feed processing project',
    },
    {
      quote: 'Floating cage, fish net, walkway support and mooring parts organized for lake, river and coastal aquaculture operations.',
      name: 'Philippines Fish Cage Support',
      role: 'Aquaculture equipment package',
    },
  ]

  return (
    <section className="bg-[var(--color-surface-alt)] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading eyebrow="Testimonials" title={<>Trusted by <span className="split-accent">Farmers</span> Worldwide</>} />
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mt-10">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100} className="h-full">
              <figure className="card card-hover p-6 md:p-8 h-full flex flex-col relative overflow-hidden">
                <div className="absolute right-5 top-5 flex gap-0.5 text-[var(--color-accent)]" aria-label="5 star rating">
                  {[1, 2, 3, 4, 5].map(star => <Icon key={star} name="star" size={13} strokeWidth={2.2} />)}
                </div>
                <Icon name="quote" size={30} className="text-[var(--color-primary)]/30 mb-5" />
                <blockquote className="text-[var(--color-text-secondary)] leading-relaxed flex-1 text-sm">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-[var(--color-border)]">
                  <div className="font-semibold text-[var(--color-text)]">{t.name}</div>
                  <div className="text-sm text-[var(--color-text-secondary)] mt-0.5">{t.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
