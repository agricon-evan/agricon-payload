import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getSolutions } from '@/lib/payload'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function SolutionDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const t = getTranslations(locale as Locale, 'productDetail')
  const solutions = await getSolutions(locale)
  const solution = solutions.find((s: any) => s.slug === slug)

  if (!solution) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Solution Not Found</h1>
        <a href={`/${locale}/solutions`} className="inline-flex items-center gap-1.5 mt-4 text-[var(--color-primary)] font-semibold">
          <Icon name="arrow-right" size={15} className="rotate-180" />
          Back
        </a>
      </div>
    )
  }

  const s = solution as any

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 py-10 md:py-16">
        <nav className="text-sm text-[var(--color-text-secondary)] mb-4">
          <a href={`/${locale}/solutions`} className="hover:text-[var(--color-primary)] transition-colors">Solutions</a> / {s.name}
        </nav>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">{s.name}</h1>
        {s.description && <p className="mt-4 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">{s.description}</p>}

        {s.features && s.features.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-4 text-[var(--color-text)]">Key Features</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(s.features as any[]).map((f: any, i: number) => (
                <Reveal key={i} delay={(i % 2) * 60}>
                  <li className="flex items-start gap-3 p-4 card">
                    <Icon name="check" size={16} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.feature || f}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        )}

        {s.products && s.products.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4 text-[var(--color-text)]">{t.relatedProducts || 'Related Products'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(s.products as any[]).map((p: any, i: number) => (
                <Reveal key={p.id} delay={i * 60} className="h-full">
                  <a
                    href={`/${locale}/products/${p.subcategory?.category?.slug || ''}/${p.subcategory?.slug || ''}/${p.slug}`}
                    className="card card-hover p-4 text-center h-full block"
                  >
                    <div className="w-9 h-9 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-2.5">
                      <Icon name="box" size={17} />
                    </div>
                    <div className="text-sm font-medium text-[var(--color-text)] leading-snug">{p.name}</div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>
      <CtaSection locale={locale as Locale} />
    </>
  )
}
