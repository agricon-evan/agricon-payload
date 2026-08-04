import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import SectionHeading from '@/components/ui/SectionHeading'

export default function Testimonials() {
  const testimonials = [
    {
      quote: 'We installed 5 tiers of H-type cages with manure belts from Agricon. Hatching rate improved and labor costs dropped by 40%.',
      name: 'James Mwangi',
      role: 'Farm Owner, Kenya',
    },
    {
      quote: 'The full feed processing line was delivered and installed right on schedule. Their engineers stayed until everything was running perfectly.',
      name: 'Alejandro Rojas',
      role: 'Operations Manager, Colombia',
    },
    {
      quote: 'Excellent quality and after-sales spare parts support. We have expanded three times, always with Agricon equipment.',
      name: 'Sergey Ivanov',
      role: 'Farm Director, Russia',
    },
  ]

  return (
    <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading eyebrow="Testimonials" title="Trusted by Farmers Worldwide" />
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mt-10">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100} className="h-full">
              <figure className="card card-hover p-6 md:p-8 h-full flex flex-col">
                <Icon name="quote" size={28} className="text-[var(--color-primary)]/30 mb-4" />
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
