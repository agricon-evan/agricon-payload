import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getProducts } from '@/lib/payload'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import ImageGallery from '@/components/ui/ImageGallery'
import MediaImage from '@/components/ui/MediaImage'
import { catalogProductImages, catalogProductGallery } from '@/lib/catalog-images'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; category: string; subcategory: string; product: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, product: productSlug } = await params
  const products = await getProducts(locale)
  const product = products.find((item) => item.slug === productSlug)
  if (!product) return { title: productSlug }
  const seoImage = product.seoImage
  const imageUrl = typeof seoImage === 'object' && seoImage ? (seoImage.url as string) : undefined
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || undefined,
    keywords: product.seoKeywords || undefined,
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || undefined,
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, product: productSlug } = await params
  const t = getTranslations(locale as Locale, 'productDetail')
  const products = await getProducts(locale)
  const product = products.find((item) => item.slug === productSlug)

  if (!product) notFound()

  const p = product
  const cmsImages = (p.images || [])
    .filter((item) => item.image && typeof item.image === 'object' && item.image.url)
    .map((item) => ({
      src: (item.image as { url?: string }).url as string,
      alt: item.alt || `${p.name} product image`,
    }))
  const gallery = (
    cmsImages.length > 0
      ? cmsImages
      : (catalogProductGallery[p.slug]?.length
          ? catalogProductGallery[p.slug]
          : catalogProductImages[p.slug]
            ? [catalogProductImages[p.slug]]
            : [])
          .map((src) => ({ src, alt: p.name }))
  )
  const subcategory = typeof p.subcategory === 'object' && p.subcategory ? p.subcategory : null
  const relatedProducts = products
    .filter((item) => item.slug !== p.slug && typeof item.subcategory === 'object' && item.subcategory?.id === subcategory?.id)
    .slice(0, 4)

  const specs = p.specs || []
  const features = (p.features || [])
    .map((feature) => typeof feature === 'object' ? feature.feature || '' : feature)
    .filter(Boolean)
  // 有意义的标签:过滤掉品牌占位(Agricon…)、导入标记(alibaba-…)、
  // 与产品名重复的、以及超长噪音文本
  const nameLower = (p.name || '').toLowerCase()
  const tags = (p.tags || [])
    .map((tag) => typeof tag === 'object' ? (tag.tag || '') : String(tag))
    .map((t) => t.trim())
    .filter((t) => {
      if (!t) return false
      const lower = t.toLowerCase()
      if (lower.startsWith('alibaba-')) return false
      if (lower.includes('agricon')) return false
      if (lower === nameLower) return false
      if (t.length > 40) return false
      return true
    })
    // 去重、保留顺序
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 4)

  // Product downloads (PDF datasheets, manuals, drawings, …)
  const downloads = (p.downloads || [])
    .map((entry) => {
      const d = entry.download
      if (!d || typeof d !== 'object' || d.published === false) return null
      const file = d.file && typeof d.file === 'object' ? d.file : null
      const url = file?.url || ''
      if (!url) return null
      return {
        id: d.id,
        name: d.name || (file?.filename || `Download ${d.id}`),
        category: d.category || '',
        fileType: d.fileType || (file?.mimeType ? (file.mimeType.split('/').pop() || '').toUpperCase() : ''),
        fileSize: d.fileSize || (file?.filesize ? `${(file.filesize / 1024).toFixed(0)} KB` : ''),
        url,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <>
      {/* Compact Alibaba-style product header: breadcrumb → product information */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-canvas-soft)]">
        <div className="max-w-7xl mx-auto px-6 py-7 md:py-9">
          <nav className="text-xs md:text-sm text-[var(--color-text-secondary)]" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-[var(--color-primary)]">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/${locale}/products`} className="hover:text-[var(--color-primary)]">Products</Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--color-text)]">{p.name}</span>
          </nav>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-16">
        {/* Product hero/spec — main image + short introduction + inquiry */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-8 lg:gap-14 items-stretch">
          <Reveal className="h-full">
            <ImageGallery images={gallery} aspect="4-3" priority className="h-full flex flex-col" />
          </Reveal>

          <Reveal delay={100} className="h-full">
            <div className="lg:sticky lg:top-24 flex flex-col h-full">
              <span className="eyebrow">AGRICON Product</span>
              <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-[1.06] tracking-[-0.02em] text-[var(--color-text)]">{p.name}</h1>
              <span className="orange-underline mt-5" aria-hidden="true" />
              <p className="mt-6 text-base text-[var(--color-text-secondary)] leading-relaxed">
                {p.description || 'Reliable agricultural equipment matched to your farm type, capacity and operating requirements.'}
              </p>

              <div className="flex flex-wrap gap-2 mt-5">
                {tags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className="px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/8 rounded-xs">{tag}</span>
                ))}
              </div>

              <div className="mt-auto pt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href={`/${locale}/contact?product=${p.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-sm min-h-[48px] tap-target hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {t.requestQuote || 'Request Quote'}
                  <Icon name="arrow-right" size={16} className="text-[var(--color-accent-soft)]" />
                </a>
                <a
                  href="#product-details"
                  className="inline-flex items-center justify-center px-7 py-3.5 border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold rounded-sm min-h-[48px] tap-target hover:bg-[var(--color-primary)]/6 transition-colors"
                >
                  View Details
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Product details and parameters */}
        <section id="product-details" className="grid grid-cols-1 lg:grid-cols-[1.22fr_0.78fr] gap-10 lg:gap-16 mt-16 md:mt-24 scroll-mt-24">
          <article>
            <Reveal>
              <span className="eyebrow">Product Details</span>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)]">Built around the application</h2>
              <span className="orange-underline mt-4" aria-hidden="true" />

              {p.overviewHtml ? (
                <div className="prose-agricon mt-7" dangerouslySetInnerHTML={{ __html: p.overviewHtml }} />
              ) : (
                <p className="mt-7 text-base text-[var(--color-text-secondary)] leading-relaxed">
                  {p.description || 'This product can be configured around the application scenario, capacity and site conditions confirmed in your inquiry.'}
                </p>
              )}
            </Reveal>

            {features.length > 0 && (
              <Reveal delay={80}>
                <div className="advantages-list mt-10 info-card">
                  <h3 className="adv-heading">Advantages</h3>
                  <ul>
                    {features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}
                  </ul>
                </div>
              </Reveal>
            )}
          </article>

          <Reveal delay={120} className="h-full">
            <aside className="info-card p-6 md:p-7 lg:sticky lg:top-24">
              <span className="eyebrow">Technical Information</span>
              <h2 className="mt-3 text-xl font-bold text-[var(--color-text)]">Key Specifications</h2>
              {specs.length > 0 ? (
                <div className="overflow-x-auto mt-6">
                  <table className="spec-table">
                    <tbody>
                      {specs.map((spec, index) => (
                        <tr key={index}>
                          <td>{spec.label}</td>
                          <td>{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Technical specifications are confirmed according to the selected model, material, capacity and site requirements.
                  </p>
                  <a href={`/${locale}/contact?product=${p.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                    Request product parameters <Icon name="arrow-right" size={14} className="text-[var(--color-accent)]" />
                  </a>
                </div>
              )}
            </aside>
          </Reveal>
        </section>

        {/* Downloads & Resources */}
        {downloads.length > 0 && (
          <section className="mt-16 md:mt-20 border-t border-[var(--color-border)] pt-10">
            <Reveal>
              <span className="eyebrow">Resources</span>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                {t.downloadsResources || 'Downloads & Resources'}
              </h2>
              <span className="orange-underline mt-4" aria-hidden="true" />
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-8">
              {downloads.map((item, index) => (
                <Reveal key={`${item.id}-${index}`} delay={index * 60} className="h-full">
                  <a
                    href={item.url}
                    target={item.url.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="card card-hover h-full flex items-start gap-4 p-5 group"
                  >
                    <span className="w-11 h-11 shrink-0 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center">
                      <Icon name="file-text" size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                        {item.name}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                        {item.fileType && <span className="px-1.5 py-0.5 rounded-xs bg-[var(--color-muted)] font-medium">{item.fileType}</span>}
                        {item.fileSize && <span>{item.fileSize}</span>}
                        {item.category && <span className="truncate">{item.category}</span>}
                      </span>
                    </span>
                    <Icon name="download" size={18} className="shrink-0 text-[var(--color-primary)] mt-1" />
                  </a>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24 border-t border-[var(--color-border)] pt-10">
            <Reveal>
              <span className="eyebrow">Continue Browsing</span>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)]">Related Products</h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mt-7">
              {relatedProducts.map((related, index) => {
                const image = catalogProductImages[related.slug]
                const relatedSub = typeof related.subcategory === 'object' && related.subcategory ? related.subcategory : null
                const relatedCategory = relatedSub && typeof relatedSub.category === 'object' && relatedSub.category ? relatedSub.category : null
                return (
                  <Reveal key={related.id} delay={index * 70} className="h-full">
                    <Link href={`/${locale}/products/${relatedCategory?.slug || ''}/${relatedSub?.slug || ''}/${related.slug}`} className="card card-hover h-full block overflow-hidden group">
                      <div className="aspect-[4/3] bg-[var(--color-muted)] overflow-hidden">
                        {image && <MediaImage src={image} alt={related.name} width={500} height={375} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold leading-snug text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{related.name}</h3>
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <CtaSection locale={locale as Locale} />
    </>
  )
}
