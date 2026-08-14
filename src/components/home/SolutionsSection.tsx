import Link from 'next/link'
import { getSolutions } from '@/lib/payload'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

interface Props {
  locale: Locale
}

export default async function SolutionsSection({ locale }: Props) {
  const solutions = await getSolutions(locale)
  const t = getTranslations(locale, 'common')
  const lp = `/${locale}`

  const placeholders = [
    { icon: 'building', name: 'Poultry Farm Setup', desc: 'Complete laying-hen and broiler house solutions — from cage systems to climate control and feeding lines.' },
    { icon: 'warehouse', name: 'Livestock Farm Setup', desc: 'Cattle, pig and sheep facilities engineered for productivity, hygiene and animal welfare.' },
    { icon: 'layers', name: 'Feed Processing Line', desc: 'Turnkey feed mills: grinding, mixing, pelleting and bagging — from 1t/h to 20t/h.' },
    { icon: 'droplet', name: 'Farm Infrastructure', desc: 'Water systems, ventilation, lighting and power — the backbone of a modern commercial farm.' },
  ]
  const items: Array<{
    id?: number | string
    slug?: string
    icon?: string
    name: string
    description?: string | null
    desc?: string
  }> = solutions.length > 0 ? solutions : placeholders

  return (
    <section className="section-wash py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionHeading
            eyebrow={t.nav?.solutions || 'Solutions'}
            title={<>Turnkey <span className="split-accent">Farm Solutions</span></>}
            description="We combine project matching, coordinated equipment supply and export support for practical agricultural operations."
          />
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mt-10">
          {items.map((s, i) => (
            <Reveal key={s.id || i} delay={(i % 2) * 100} className="h-full">
              <Link
                href={s.slug ? `${lp}/solutions/${s.slug}` : `${lp}/solutions`}
                className="card card-hover p-6 md:p-8 h-full flex gap-5 group relative overflow-hidden"
              >
                <div className="relative flex-shrink-0 w-12 h-12 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                  <Icon name={s.icon || (['building', 'warehouse', 'layers', 'droplet'][i % 4])} size={22} />
                </div>
                <div>
                  <h3 className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{s.name}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">{s.desc || s.description}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
