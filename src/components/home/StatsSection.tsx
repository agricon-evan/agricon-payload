import { getSiteSettings } from '@/lib/payload'
import type { Locale } from '@/i18n/config'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

// Four equal metric items. Hovering any item promotes it to the primary proof-point style.
export default async function StatsSection({ locale: _locale }: { locale: Locale }) {
  const settings = await getSiteSettings()
  const stats = (settings?.stats ?? {}) as { countriesServed?: string; farmProjects?: string; yearsInBusiness?: string; onTimeDelivery?: string; equipmentModels?: string }

  const items = [
    { num: stats?.equipmentModels || '10+', label: 'Product Categories', desc: 'Poultry, livestock, aquaculture, machinery and infrastructure.' },
    { num: stats?.farmProjects || '100+', label: 'Farm Projects', desc: 'Complete projects delivered across farm types and scales.' },
    { num: stats?.countriesServed || '30+', label: 'Export Markets', desc: 'Serving farms and distributors worldwide.' },
    { num: stats?.onTimeDelivery || '98%', label: 'On-Time Delivery', desc: 'Practical international delivery experience.' },
  ]

  return (
    <section className="bg-[var(--color-canvas-soft)] border-y border-[var(--color-border)] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Proven Track Record"
            title={<>Numbers That <span className="split-accent">Speak</span> for Themselves</>}
            description="A clear view of Agricon's equipment scope and international delivery experience."
          />
        </Reveal>

        {/* Four equal items — hover any item to promote it to the green primary style */}
        <div className="stats-metrics-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr border-y border-[var(--color-border)]">
          {items.map((item, i) => (
            <Reveal key={item.label} delay={i * 90} className="h-full">
              <div className={`stats-metric group h-full min-h-[230px] p-6 md:p-7 flex flex-col ${i > 0 ? 'stats-metric-divider' : ''}`}>
                <span className="stats-metric-index text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-light)]">0{i + 1}</span>
                <div className="mt-auto pt-10">
                  <div className="relative inline-block metric-stat text-[var(--color-primary)]">
                    {item.num}
                    {!item.num.includes('%') && (
                      <span className="absolute -right-4 -top-1 text-xl md:text-2xl font-bold leading-none text-[var(--color-accent)]">+</span>
                    )}
                  </div>
                  <div className="stats-metric-label mt-4 min-h-[2.5rem] text-sm md:text-base font-semibold leading-tight text-[var(--color-primary-strong)]">{item.label}</div>
                  <p className="stats-metric-desc mt-2 min-h-[2.5rem] text-xs leading-relaxed text-[var(--color-text-secondary)]">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-7 max-w-3xl text-xs leading-relaxed text-[var(--color-text-muted)]">
          Figures describe the current Agricon catalog scope. Final equipment selection depends on farm type, capacity, site conditions and operating requirements.
        </p>
      </div>
    </section>
  )
}
