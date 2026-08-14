import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'
import { getSiteSettings } from '@/lib/payload'

export default async function GlobalCoverage() {
  const settings = await getSiteSettings()
  const fallback = [
    { icon: 'building', title: 'Farm Operations', sub: 'Poultry, livestock, aquaculture and crop production equipment for daily operation.' },
    { icon: 'layers', title: 'Processing & Supply', sub: 'Feed preparation, pelletizing, machinery and mixed-category equipment sourcing.' },
    { icon: 'warehouse', title: 'Infrastructure', sub: 'Farm structures, ventilation, cooling, storage, fencing and environmental support.' },
    { icon: 'globe', title: 'International Buyers', sub: 'Export coordination for farms, importers, distributors and project buyers worldwide.' },
  ]
  const raw = (settings as { homeGlobalCoverage?: unknown }).homeGlobalCoverage
  const regions = (Array.isArray(raw) && raw.length > 0 ? raw : fallback) as Array<{ icon: string; title: string; sub: string }>

  return (
    <section className="bg-[var(--color-surface-alt)] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Global Reach"
            title={<>Supporting <span className="split-accent">Buyers Worldwide</span></>}
            description="Practical equipment supply and export coordination for farms, importers, distributors and agricultural projects."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-10">
          {regions.map((r, i) => (
            <Reveal key={r.title} delay={i * 80} className="h-full">
              <div className="card card-hover p-6 md:p-8 h-full">
                <div className="w-11 h-11 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-5">
                  <Icon name={r.icon} size={22} />
                </div>
                <h3 className="text-[var(--color-text)]">{r.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{r.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
