import { getSiteSettings } from '@/lib/payload'
import type { Locale } from '@/i18n/config'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

// Homepage stats band — reads verified figures from SiteSettings (admin-editable).
// Falls back to conservative English defaults so the UI renders even before settings exist.
// Numbers carry a short description line (from company catalog) so the band reads as
// a complete content section, not bare figures.
export default async function StatsSection({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings()
  const stats = (settings?.stats ?? {}) as { countriesServed?: string; farmProjects?: string; yearsInBusiness?: string; onTimeDelivery?: string }

  const items = [
    { num: stats?.countriesServed || '20+', label: 'Countries Served', desc: 'Export cooperation with farms, importers and distributors worldwide.' },
    { num: stats?.farmProjects || '100+', label: 'Farm Projects', desc: 'Farm setup, expansion and equipment upgrading projects supported.' },
    { num: stats?.yearsInBusiness || '10+', label: 'Years in Business', desc: 'Serving agricultural buyers across global markets.' },
    { num: stats?.onTimeDelivery || '95%', label: 'On-time Delivery', desc: 'Export packing, loading plans and shipment coordination.' },
  ]

  return (
    <section className="bg-[var(--color-primary-dark)] text-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Proven Track Record"
            title="Numbers That Speak for Themselves"
            description="An integrated equipment ecosystem covering breeding, feeding, housing, processing and daily farm operation."
            dark
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-12">
          {items.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="h-full">
              <div className="text-center lg:text-left p-6 lg:p-0">
                <div className="stat-num">{s.num}</div>
                <div className="mt-2 text-sm md:text-base font-semibold opacity-95">{s.label}</div>
                <p className="mt-2 text-xs md:text-sm opacity-60 leading-relaxed max-w-[220px] mx-auto lg:mx-0">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
