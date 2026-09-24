import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getProducts, getProductSeoFields, resolveProductPath } from '@/lib/payload'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import ImageGallery from '@/components/ui/ImageGallery'
import MediaImage from '@/components/ui/MediaImage'
import { catalogProductImages, catalogProductGallery } from '@/lib/catalog-images'
import { SITE_URL } from '@/lib/seo'
import { breadcrumbSchema, graph, productSchema } from '@/lib/structured-data'
import JsonLd from '@/components/JsonLd'
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
  // Every stored `seoTitle` ends with "| Agricon Agricultural Equipment", but the
  // frontend layout applies `title.template: '%s | Agricon'` on top of it, so product
  // pages rendered `<name> | Agricon Agricultural Equipment | Agricon` — the brand
  // twice. Drop the stored suffix and let the template be the single source of it.
  const stripBrand = (value?: string | null) =>
    (value || '').replace(/\s*\|\s*Agricon( Agricultural Equipment)?\s*$/i, '').trim()

  // Read the untranslated-vs-missing distinction (see getProductSeoFields).
  // Without this, `product.seoTitle` is the English title on every locale that
  // has no translation, and it is indistinguishable from a real translation.
  const seo = (await getProductSeoFields(locale))[productSlug]

  const title = stripBrand(seo?.seoTitle) || stripBrand(product.seoTitle) || product.name
  // Fall back to the localized short description rather than the English meta
  // description, and rather than emitting no description at all.
  const description = seo?.seoDescription || seo?.description || undefined

  return {
    title,
    description,
    keywords: product.seoKeywords || undefined,
    openGraph: {
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, category: categoryParam, subcategory: subcategoryParam, product: productSlug } = await params
  const t = getTranslations(locale as Locale, 'productDetail')
  const products = await getProducts(locale)
  const product = products.find((item) => item.slug === productSlug)

  if (!product) notFound()

  const p = product
  const cmsImages = (p.images || [])
    .filter((item) => item.image && typeof item.image === 'object' && item.image.url)
    .map((item) => ({
      src: (item.image as { url?: string }).url as string,
      alt: item.alt || `${p.name} ${t.imageAltSuffix || 'product image'}`,
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

  // Parent path for the "Related Products" links, plus validation of the two
  // ancestor segments in the requested URL.
  //
  // These cards used to be built from `related.subcategory.category.slug`, but
  // `getProducts()` runs at `depth: 1`, where `subcategory.category` is still an
  // **id** and `.slug` is `undefined`. The links silently rendered as
  // `/en/products//layer-cage/<product>` and returned 404 — 33 of 43 product
  // pages were affected (~480 dead links across the six locales).
  //
  // Related products are, by construction above, siblings inside the current
  // subcategory, so the current product's own resolved path is the correct
  // parent path for every card.
  //
  // `resolveProductPath` returns null — never a partial path — when the CMS
  // relations cannot produce a complete one, so cards render without a link
  // rather than pointing at a 404.
  const path = await resolveProductPath(p, locale)

  // The requested ancestors must match where the product actually lives.
  // Without this check, `/en/products/<anything>/<anything>/<real-slug>`
  // answered 200 with a self-referencing canonical: an unbounded set of
  // indexable duplicate URLs, and a broken CMS relation was served silently
  // instead of failing loudly.
  if (!path || path.categorySlug !== categoryParam || path.subcategorySlug !== subcategoryParam) {
    notFound()
  }
  const { categorySlug, categoryName, subcategorySlug, subcategoryName } = path
  const productPathBase = `/${locale}/products/${categorySlug}/${subcategorySlug}`

  const specs = p.specs || []
  const faqs = (p.faqs || [])
    .map((f) => ({ question: (f.question || '').trim(), answer: (f.answer || '').trim() }))
    .filter((f) => f.question && f.answer)
  const detailImages = (p.detailImages || [])
    .filter((item) => item.image && typeof item.image === 'object' && (item.image as { url?: string }).url)
    .map((item) => ({
      src: (item.image as { url?: string }).url as string,
      alt: item.alt || `${p.name} ${t.detailImageAltSuffix || 'detail image'}`,
    }))
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
      {/* Product rich result + breadcrumb trail. `p.name` stays in English on
          purpose (technical designation); the description and image follow the
          locale. See src/lib/structured-data.ts. */}
      <JsonLd
        data={graph([
          productSchema({
            name: p.name,
            description: p.seoDescription || p.description,
            image: typeof p.seoImage === 'object' && p.seoImage?.url ? p.seoImage.url : undefined,
            url: `${SITE_URL}/${locale}/products/${categorySlug}/${subcategorySlug}/${p.slug}`,
            sku: p.slug,
            price: (p as { price?: string | null }).price,
          }),
          breadcrumbSchema([
            { name: t.breadcrumb?.home || 'Home', url: `${SITE_URL}/${locale}` },
            { name: t.breadcrumb?.products || 'Products', url: `${SITE_URL}/${locale}/products` },
            // Use the CMS display names, not the slugs: these feed Google's
            // breadcrumb rich result, which used to read
            // "poultry-equipment / layer-cage".
            { name: categoryName, url: `${SITE_URL}/${locale}/products/${categorySlug}` },
            { name: subcategoryName, url: `${SITE_URL}/${locale}/products/${categorySlug}/${subcategorySlug}` },
            { name: p.name, url: `${SITE_URL}/${locale}/products/${categorySlug}/${subcategorySlug}/${p.slug}` },
          ]),
        ])}
      />
      {/* Compact Alibaba-style product header: breadcrumb → product information */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-canvas-soft)]">
        <div className="max-w-7xl mx-auto px-6 py-7 md:py-9">
          <nav className="text-xs md:text-sm text-[var(--color-text-secondary)]" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-[var(--color-primary)]">{t.breadcrumb?.home || 'Home'}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${locale}/products`} className="hover:text-[var(--color-primary)]">{t.breadcrumb?.products || 'Products'}</Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--color-text)]">{p.name}</span>
          </nav>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-16">
        {/* Product hero/spec — main image + short introduction + inquiry */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-8 lg:gap-14 items-stretch">
          <Reveal className="h-full">
            <ImageGallery images={gallery} aspect="square" priority className="h-full flex flex-col" locale={locale} />
          </Reveal>

          <Reveal delay={100} className="h-full">
            <div className="lg:sticky lg:top-24 flex flex-col h-full">
              <span className="eyebrow">{t.productBadge || 'AGRICON Product'}</span>
              <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-[1.06] tracking-[-0.02em] text-[var(--color-text)]">{p.name}</h1>
              <span className="orange-underline mt-5" aria-hidden="true" />
              <p className="mt-6 text-base text-[var(--color-text-secondary)] leading-relaxed">
                {p.description || t.descriptionFallback || 'Reliable agricultural equipment matched to your farm type, capacity and operating requirements.'}
              </p>

              {(p.price || p.moq) && (
                <div className="mt-7 flex flex-wrap items-baseline gap-x-10 gap-y-4 border-t border-[var(--color-border)] pt-5">
                  {p.price && (
                    <div>
                      <span className="eyebrow">{t.unitPrice || 'Unit Price'}</span>
                      <span className="mt-1.5 block text-2xl md:text-[28px] font-bold leading-none tracking-[-0.01em] text-[var(--color-text)]">
                        {p.price}
                      </span>
                    </div>
                  )}
                  {p.moq && (
                    <div>
                      <span className="eyebrow">{t.minOrder || 'Min. Order'}</span>
                      <span className="mt-1.5 block text-base font-semibold text-[var(--color-text)]">{p.moq}</span>
                    </div>
                  )}
                </div>
              )}

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
                  {t.viewDetails || 'View Details'}
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Product details and parameters */}
        <section id="product-details" className="grid grid-cols-1 lg:grid-cols-[1.22fr_0.78fr] gap-10 lg:gap-16 mt-16 md:mt-24 scroll-mt-24">
          <article>
            <Reveal>
              <span className="eyebrow">{t.productDetails || 'Product Details'}</span>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)]">{t.builtAroundApplication || 'Built around the application'}</h2>
              <span className="orange-underline mt-4" aria-hidden="true" />

              {p.overviewHtml ? (
                // The long-form overview is supplier copy and only exists in
                // English (translating 4 KB × 43 products × 5 locales was out of
                // scope). `lang="en"` tells browsers and screen readers to switch
                // reading language for this block instead of applying, say,
                // Arabic letter shaping or Russian hyphenation to English text.
                <div
                  className="prose-agricon mt-7"
                  lang={locale === 'en' ? undefined : 'en'}
                  dangerouslySetInnerHTML={{ __html: p.overviewHtml }}
                />
              ) : (
                <p className="mt-7 text-base text-[var(--color-text-secondary)] leading-relaxed">
                  {p.description || t.overviewFallback || 'This product can be configured around the application scenario, capacity and site conditions confirmed in your inquiry.'}
                </p>
              )}
            </Reveal>

            {features.length > 0 && (
              <Reveal delay={80}>
                <div className="advantages-list mt-10 info-card">
                  <h3 className="adv-heading">{t.advantages || 'Advantages'}</h3>
                  <ul>
                    {features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}
                  </ul>
                </div>
              </Reveal>
            )}

            {/* Long-form detail images from the supplier's product description */}
            {detailImages.length > 0 && (
              <Reveal delay={110}>
                <div className="mt-12 space-y-5">
                  <span className="eyebrow">{t.productInDetail || 'Product in Detail'}</span>
                  {detailImages.map((img, index) => (
                    <div key={`${img.src}-${index}`} className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                      <MediaImage
                        src={img.src}
                        alt={img.alt}
                        width={1200}
                        height={800}
                        loading="lazy"
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </article>

          <Reveal delay={120} className="h-full">
            <aside className="info-card p-6 md:p-7 lg:sticky lg:top-24">
              <span className="eyebrow">{t.technicalInformation || 'Technical Information'}</span>
              <h2 className="mt-3 text-xl font-bold text-[var(--color-text)]">{t.keySpecifications || 'Key Specifications'}</h2>
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
                    {t.specsFallback || 'Technical specifications are confirmed according to the selected model, material, capacity and site requirements.'}
                  </p>
                  <a href={`/${locale}/contact?product=${p.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                    {t.requestParameters || 'Request product parameters'} <Icon name="arrow-right" size={14} className="text-[var(--color-accent)]" />
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
              <span className="eyebrow">{t.resources || 'Resources'}</span>
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

        {/* Product FAQ */}
        {faqs.length > 0 && (
          <section className="mt-16 md:mt-24 border-t border-[var(--color-border)] pt-10">
            <Reveal>
              <span className="eyebrow">{t.faq || 'FAQ'}</span>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)]">{t.commonQuestions || 'Common questions'}</h2>
              <span className="orange-underline mt-4" aria-hidden="true" />
            </Reveal>
            <div className="mt-8 max-w-3xl divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {faqs.map((faq, index) => (
                <Reveal key={`${faq.question}-${index}`} delay={index * 40}>
                  <details className="group py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] font-semibold leading-snug text-[var(--color-text)] marker:content-none">
                      {faq.question}
                      <Icon
                        name="chevron-down"
                        size={18}
                        className="mt-0.5 shrink-0 text-[var(--color-accent)] transition-transform duration-200 group-open:rotate-180"
                      />
                    </summary>
                    <p className="mt-3 pr-10 text-sm leading-relaxed text-[var(--color-text-secondary)]">{faq.answer}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24 border-t border-[var(--color-border)] pt-10">
            <Reveal>
              <span className="eyebrow">{t.continueBrowsing || 'Continue Browsing'}</span>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--color-text)]">{t.relatedProducts || 'Related Products'}</h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mt-7">
              {relatedProducts.map((related, index) => {
                const relImg = (related.images || []).find(
                  (it) => it.image && typeof it.image === 'object' && (it.image as { url?: string }).url,
                )
                const image = relImg ? ((relImg.image as { url?: string }).url as string) : catalogProductImages[related.slug]
                const card = (
                  <>
                    <div className="aspect-[4/3] bg-[var(--color-muted)] overflow-hidden">
                      {image && <MediaImage src={image} alt={related.name} width={500} height={375} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold leading-snug text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{related.name}</h3>
                    </div>
                  </>
                )
                return (
                  <Reveal key={related.id} delay={index * 70} className="h-full">
                    {productPathBase ? (
                      <Link href={`${productPathBase}/${related.slug}`} className="card card-hover h-full block overflow-hidden group">
                        {card}
                      </Link>
                    ) : (
                      <div className="card h-full block overflow-hidden">{card}</div>
                    )}
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
