import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getProducts } from '@/lib/payload'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'

interface Props {
  params: Promise<{ locale: string; category: string; subcategory: string; product: string }>
}

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({ params }: Props) {
  const { locale, product: productSlug } = await params
  const t = getTranslations(locale as Locale, 'productDetail')
  const products = await getProducts(locale)
  const product = products.find((p) => p.slug === productSlug)

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <a href={`/${locale}/products`} className="inline-flex items-center gap-1.5 mt-4 text-[var(--color-primary)] font-semibold">
          <Icon name="arrow-right" size={15} className="rotate-180" />
          Back to Products
        </a>
      </div>
    )
  }

  const p = product
  const images = p.images || []
  const specs = p.specs || []
  const features = p.features || []
  const tCommon = getTranslations(locale as Locale, 'common')

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Gallery */}
          <Reveal>
            <div className="aspect-square rounded-lg bg-[var(--color-muted)] overflow-hidden flex items-center justify-center">
              {images.length > 0 && images[0].image && typeof images[0].image === 'object' && images[0].image.url ? (
                <img src={images[0].image.url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <Icon name="box" size={64} className="text-[var(--color-text-secondary)]/25" />
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {images.slice(0, 4).map((img, i) => (
                  <div key={i} className="aspect-square rounded-md bg-[var(--color-muted)] overflow-hidden">
                    {img.image && typeof img.image === 'object' && img.image.url ? (
                      <img src={img.image.url} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Reveal>

          {/* Info */}
          <Reveal delay={100}>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">{p.name}</h1>
                {p.description && (
                  <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">{p.description}</p>
                )}
              </div>

              {p.moq && (
                <div className="inline-flex items-center gap-2 bg-[var(--color-primary)]/8 text-[var(--color-primary)] px-4 py-2 rounded-md text-sm font-semibold">
                  {t.tradeInfo?.minimumOrder || 'MOQ'}: {p.moq}
                </div>
              )}

              <a
                href={`/${locale}/contact?product=${p.slug}`}
                className="flex sm:inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                {t.requestQuote || 'Request Quote'}
                <Icon name="arrow-right" size={16} />
              </a>

              {specs.length > 0 && (
                <div className="card overflow-hidden">
                  <h2 className="px-5 py-3 bg-[var(--color-muted)] font-semibold text-sm text-[var(--color-text)]">
                    {t.keySpecifications || 'Key Specifications'}
                  </h2>
                  <dl className="divide-y divide-[var(--color-border)]">
                    {specs.slice(0, 6).map((s, i) => (
                      <div key={i} className="flex justify-between gap-4 px-5 py-3">
                        <dt className="text-sm text-[var(--color-text-secondary)]">{s.label}</dt>
                        <dd className="text-sm font-medium text-[var(--color-text)] text-right">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {features.length > 0 && (
                <div>
                  <h2 className="font-semibold text-lg mb-3 text-[var(--color-text)]">{t.tabs?.overview || 'Features'}</h2>
                  <ul className="space-y-2.5">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                        <Icon name="check" size={15} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{typeof f === 'object' ? (f.feature ?? '') : f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <CtaSection locale={locale as Locale} />
    </>
  )
}
