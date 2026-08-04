import { getSiteSettings } from '@/lib/payload'
import type { Locale } from '@/i18n/config'

// Homepage stats band — reads verified figures from SiteSettings (admin-editable).
// Falls back to conservative English defaults so the UI renders even before settings exist.
export default async function StatsSection({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings()
  const stats = settings?.stats as
    | { countriesServed?: string; farmProjects?: string; yearsInBusiness?: string; onTimeDelivery?: string }
    | undefined

  const items = [
    { num: stats?.countriesServed || '20+', label: 'Countries Served' },
    { num: stats?.farmProjects || '100+', label: 'Farm Projects' },
    { num: stats?.yearsInBusiness || '10+', label: 'Years in Business' },
    { num: stats?.onTimeDelivery || '95%', label: 'On-time Delivery' },
  ]

  return (
    <section className="bg-[var(--color-primary-dark)] text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {items.map((s, i) => (
            <div key={s.label} className={`text-center reveal reveal-fade-up stagger-${i + 1}`}>
              <div className="stat-num">{s.num}</div>
              <div className="mt-2 text-sm md:text-base opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}