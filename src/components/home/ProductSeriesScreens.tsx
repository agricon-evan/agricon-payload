import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getCategories, getSubcategories, getProducts } from '@/lib/payload'
import { categoryImages, subcategoryImages, heroFallback } from '@/lib/images'
import { homeCopy } from '@/lib/home-copy'
import MediaImage from '@/components/ui/MediaImage'
import Icon from '@/components/ui/Icon'

interface Props { locale: Locale }

// The four core product series, each a full-screen showcase (left scene + right series).
// `taglineKey` indexes the localized taglines in `common.home.series`.
const SERIES_SLUGS = [
  { slug: 'poultry-equipment', accent: 'Poultry', taglineKey: 'poultry', tagline: 'Layer, broiler & hatchery systems' },
  { slug: 'livestock-equipment', accent: 'Livestock', taglineKey: 'livestock', tagline: 'Cattle, pig, goat & rabbit housing' },
  { slug: 'agriculture-machinery', accent: 'Machinery', taglineKey: 'machinery', tagline: 'Feed, processing & farm machinery' },
  // NOTE: slug must match the CMS category slug exactly. This previously read
  // 'farming-vehicle' (singular) while the CMS category is 'farming-vehicles',
  // so this series never matched its own subcategories and always fell through
  // to the generic branch.
  { slug: 'farming-vehicles', accent: 'Vehicles', taglineKey: 'vehicles', tagline: 'Tractors, harvesters & farm transport' },
] as const

const subImg = (slug: string, seriesSlug: string) =>
  subcategoryImages[slug] || categoryImages[seriesSlug] || heroFallback

/**
 * Dedicated full-bleed scene photo for each series' left-hand panel, keyed by
 * **series (category) slug**.
 *
 * This map used to be keyed by subcategory slug with the values
 * `breeding-accessory`, `livestock-accessory`, `production-line` and
 * `walking-tractor`. Every one of those keys was dead:
 *   - `breeding-accessory` / `livestock-accessory` are singular, but the CMS
 *     slugs are `breeding-accessories` / `livestock-accessories`
 *   - `production-line` and `walking-tractor` exist but are not the first
 *     subcategory returned by `getSubcategories()`, and the panel only ever
 *     looked up the lead subcategory
 * so the lookup always missed and the panel silently fell back to a generic
 * per-subcategory catalog photo. The four themed photos were sitting in
 * `public/images/` the whole time and never rendered.
 *
 * Keying by series also keeps the panel stable: it no longer depends on which
 * subcategory happens to sort first.
 *
 * w/h express the source aspect ratio. These files are large (the poultry and
 * machinery aerials are 3200x2560 at 8.7MB / 6.0MB), so they are deliberately
 * NOT marked `unoptimized` — the Next image optimiser resizes and re-encodes
 * them for the layout width. The previous code passed `unoptimized` and served
 * ~19MB of raw JPEG to every homepage visitor.
 */
const SCENE_BY_SERIES: Record<string, { src: string; w: number; h: number }> = {
  // 3200x2560 source — 5:4
  'poultry-equipment': { src: '/images/home-series-poultry.jpg', w: 1600, h: 1280 },
  // 2289x1831 source — ~5:4
  'livestock-equipment': { src: '/images/home-series-livestock.jpg', w: 1600, h: 1280 },
  // 3200x2560 source — 5:4
  'agriculture-machinery': { src: '/images/home-series-machinery.jpg', w: 1600, h: 1280 },
  // 2741x1530 source — 16:9
  'farming-vehicles': { src: '/images/home-series-vehicles.jpg', w: 1600, h: 893 },
}

// Poultry series: six fixed product cards with custom 16:7 images and product-level links.
// href 为 `<subcategory>/<product>`，链接到**具体产品**（客户要求首页第 2–5 屏产品卡不得落
// 在二级分类页）。所有 href 均已对照 2026-09-23 的线上目录逐条核实；resolveCardHref 仍会
// 对着 CMS 校验，产品将来被删时自动退回子分类页，不会 404。
interface SeriesCard {
  name: string
  img: { src: string; w: number; h: number }
  href: string
}

const SERIES_CARD_OVERRIDES: Record<string, SeriesCard[]> = {
  'poultry-equipment': [
    { name: 'H-Frame Automatic Layer Cage', img: { src: '/images/card-h-frame-automatic-layer-cage.jpg', w: 1200, h: 560 }, href: 'automatic-cage/h-frame-automatic-layer-cage' },
    { name: 'A-Type Automatic Layer Cage', img: { src: '/images/card-a-type-automatic-layer-cage.jpg', w: 1200, h: 560 }, href: 'automatic-cage/a-type-automatic-layer-cage' },
    { name: '128-Bird 4-Tier Layer Cage', img: { src: '/images/card-128-bird-4-tier-layer-cage.jpg', w: 1200, h: 560 }, href: 'layer-cage/128-bird-4-tier-layer-cage' },
    { name: 'H-Frame Broiler Cage', img: { src: '/images/card-h-frame-broiler-cage.jpg', w: 1280, h: 560 }, href: 'broiler-cage/h-frame-broiler-cage' },
    { name: 'Chick Cage', img: { src: '/images/card-chick-cage.jpg', w: 1280, h: 560 }, href: 'chick-cage/h-type-stacked-chick-cage' },
    { name: 'Feeding & Watering Line', img: { src: '/images/card-feeding-watering-line.jpg', w: 1280, h: 560 }, href: 'cage-accessories/automatic-poultry-feeding-line' },
  ],
  'livestock-equipment': [
    { name: 'European Rabbit Cage', img: { src: '/images/card-european-rabbit-cage.jpg', w: 1280, h: 560 }, href: 'rabbit-cage/european-style-h-type-rabbit-cage' },
    { name: 'Rabbit Cage', img: { src: '/images/card-rabbit-cage.jpg', w: 1280, h: 560 }, href: 'rabbit-cage/3-tier-h-type-rabbit-cage' },
    { name: 'Sow Farrowing Bed', img: { src: '/images/card-sow-farrowing-bed.jpg', w: 1280, h: 560 }, href: 'farrow-pen/farrowing-crate' },
    { name: 'Gestation Crate', img: { src: '/images/card-gestation-crate.jpg', w: 1280, h: 560 }, href: 'farrow-pen/pig-gestation-crate' },
    // 整个系列里没有可对应的成品产品页，只能先落到最接近的二级分类。
    { name: 'Livestock Fence', img: { src: '/images/card-livestock-fence.jpg', w: 1280, h: 560 }, href: 'farm-fence' },
    { name: 'Sheep Pen', img: { src: '/images/card-sheep-pen.jpg', w: 1280, h: 560 }, href: 'goat-pen' },
  ],
  'agriculture-machinery': [
    { name: 'Pellet Machine', img: { src: '/images/card-pellet-machine.jpg', w: 1280, h: 560 }, href: 'pellet-machine/agp-160-flat-die-pellet-machine' },
    { name: 'Fish Feed Pellet Machine', img: { src: '/images/card-fish-feed-pellet-machine.jpg', w: 1280, h: 560 }, href: 'extruder-machine/dgp-series-floating-fish-feed-extruder' },
    { name: 'Tooth Disc Crusher', img: { src: '/images/card-tooth-disc-crusher.jpg', w: 1280, h: 560 }, href: 'grinding-machine/toothed-disc-mill-grinder' },
    { name: 'Hammer Crusher', img: { src: '/images/card-hammer-crusher.jpg', w: 1280, h: 560 }, href: 'grinding-machine/hammer-mill-grinder' },
    { name: 'Grass Chaff Machine', img: { src: '/images/card-grass-chaff-machine.jpg', w: 1280, h: 560 }, href: 'grass-chaff-machine/3-in-1-chaff-cutter-1-10t-h' },
    { name: 'Mixing Machine', img: { src: '/images/card-mixing-machine.jpg', w: 1280, h: 560 }, href: 'mixing-machine/compact-animal-feed-mixer' },
  ],
  'farming-vehicles': [
    { name: 'Small Harvester', img: { src: '/images/card-small-harvester.jpg', w: 1280, h: 560 }, href: 'harvester/mini-crawler-combine-harvester' },
    { name: 'Walking Tractor', img: { src: '/images/card-walking-tractor.jpg', w: 1280, h: 560 }, href: 'walking-tractor/8hp-walking-tractor' },
    { name: 'Tractor', img: { src: '/images/card-tractor.jpg', w: 1280, h: 560 }, href: 'tractor/4wd-agricultural-wheel-tractor' },
    { name: 'Tricycle', img: { src: '/images/card-tricycle.jpg', w: 1280, h: 560 }, href: 'tricycle/diesel-farm-tricycle' },
  ],
}

export default async function ProductSeriesScreens({ locale }: Props) {
  const lp = `/${locale}`
  const seriesCopy = homeCopy(locale).series ?? {}
  const [categories, subs, products] = await Promise.all([
    getCategories(locale),
    getSubcategories(locale),
    getProducts(locale),
  ])

  const catName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name || slug

  // Card link resolution.
  //
  // A curated card may carry an explicit "<subcategory>/<product>" href, or an
  // empty href meaning "the product page does not exist yet". Both cases are
  // resolved against the live CMS so a catalogue rename can never produce a dead
  // link:
  //   1. href names a product that exists            -> product page
  //   2. href names only an existing subcategory     -> subcategory page
  //   3. href empty, but the card NAME matches a
  //      product in this series                       -> that product page
  //   4. href empty, but the card NAME matches a
  //      subcategory in this series                   -> subcategory page
  //   5. otherwise                                   -> category page
  //
  // Rules 3 and 4 matter because 17 of the 22 curated cards ship with an empty
  // href; previously they rendered as non-clickable placeholders even though the
  // matching product was in the CMS. Resolving by name turns them into real
  // links without touching the curated names or the 16:7 artwork.
  const productBySlug = new Map(
    products.map((p) => [
      (p as unknown as { slug: string }).slug,
      p as unknown as { slug: string; name: string; subcategory?: { slug?: string } | string | number },
    ]),
  )
  const productByNormName = new Map<string, string>()
  for (const p of products) {
    const o = p as unknown as { slug: string; name: string }
    if (o.name) productByNormName.set(normCardName(o.name), o.slug)
  }
  const subBySlug = new Map(subs.map((s) => [(s as unknown as { slug: string }).slug, s.id]))
  const subByNormName = new Map<string, string>()
  for (const s of subs) {
    const o = s as unknown as { slug: string; name: string }
    if (o.name) subByNormName.set(normCardName(o.name), o.slug)
  }

  /** Extracts the subcategory slug a product belongs to. */
  const subSlugOfProduct = (p: { subcategory?: unknown }): string => {
    const sub = p.subcategory
    if (typeof sub === 'object' && sub) return (sub as { slug?: string }).slug || ''
    if (typeof sub === 'number') {
      const found = subs.find((s) => s.id === sub)
      return (found as unknown as { slug?: string } | undefined)?.slug || ''
    }
    return typeof sub === 'string' ? sub : ''
  }

  const resolveCardHref = (seriesSlug: string, href: string, cardName: string): string => {
    const [sub, product] = href ? href.split('/') : ['', '']
    if (product && productBySlug.has(product)) return `${lp}/products/${seriesSlug}/${sub}/${product}`
    if (sub && subBySlug.has(sub)) return `${lp}/products/${seriesSlug}/${sub}`

    // Name-based fallbacks for cards with no (or a stale) href.
    const norm = normCardName(cardName)
    const productSlug = productByNormName.get(norm)
    if (productSlug) {
      const owner = subSlugOfProduct(productBySlug.get(productSlug) || {})
      if (owner) return `${lp}/products/${seriesSlug}/${owner}/${productSlug}`
    }
    const subSlug = subByNormName.get(norm)
    if (subSlug) return `${lp}/products/${seriesSlug}/${subSlug}`

    return `${lp}/products/${seriesSlug}`
  }

  return (
    <>
      {SERIES_SLUGS.map((series, idx) => {
        const seriesSubs = subs.filter(
          (s) => (s as unknown as { category?: { slug?: string } | string }).category &&
            ((s as unknown as { category: string | { slug?: string } }).category === series.slug ||
             (s as unknown as { category: { slug?: string } }).category?.slug === series.slug),
        )
        const [lead] = seriesSubs
        const leadName = (lead as unknown as { name: string } | undefined)?.name || ''
        const leadSlug = (lead as unknown as { slug: string } | undefined)?.slug || ''
        const num = String(idx + 1).padStart(2, '0')

        return (
          <section
            key={series.slug}
            className="snap-start snap-always min-h-[100dvh] lg:h-screen bg-[var(--color-bg)] flex pt-[72px] overflow-hidden"
          >
            <div className="grid grid-cols-1 grid-rows-[minmax(17vh,1fr)_auto] lg:grid-cols-2 lg:grid-rows-1 items-stretch w-full lg:h-[calc(100vh-72px)]">

              {/* Left — full-bleed scene photo, editorial index.
                  Links to the series (category) page, not the lead subcategory:
                  the panel is a series entry, and the client asked that homepage
                  links stop landing on subcategory listings. */}
              <Link
                href={`${lp}/products/${series.slug}`}
                className="group relative block overflow-hidden bg-[var(--color-surface-alt)] min-h-[17vh] sm:min-h-[20vh] lg:h-auto lg:min-h-0"
              >
                {lead ? (
                  (() => {
                    const scene = SCENE_BY_SERIES[series.slug]
                    return (
                      <MediaImage
                        src={scene?.src || subImg(leadSlug, series.slug)}
                        alt={leadName}
                        width={scene?.w || 1200}
                        height={scene?.h || 900}
                        priority
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                      />
                    )
                  })()
                ) : null}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent lg:h-44" />
                <div className="absolute bottom-5 left-6 md:bottom-10 md:left-10 lg:bottom-8 lg:left-8 flex items-end gap-4">
                  <span className="font-display text-5xl sm:text-6xl xl:text-7xl font-bold text-white leading-none">{num}</span>
                  <span className="pb-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
                    {series.accent} Series
                  </span>
                </div>
              </Link>

              {/* Right — title at top, uniform 2×2 grid pinned to the BOTTOM (aligned with left image) */}
              <div className="px-6 sm:px-10 lg:px-14 xl:px-16 py-3 sm:py-6 lg:py-8 flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                  {num} — {series.accent} {t_seriesHeading(locale)}
                </span>
                <h2 className="mt-1.5 lg:mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-primary)] tracking-[-0.02em] leading-[1.05]">
                  {catName(series.slug)}
                </h2>
                <p className="mt-1.5 lg:mt-2.5 text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                  {seriesCopy[series.taglineKey as keyof typeof seriesCopy] || series.tagline}
                </p>

                {/* mt-auto pushes the grid down: bottom-aligned with the left image, big gap from the text */}
                <div className="mt-auto pt-4 lg:pt-12 grid grid-cols-2 lg:grid-cols-3 gap-x-4 lg:gap-x-5 gap-y-4 lg:gap-y-6">
                  {(() => {
                    const overrideCards = SERIES_CARD_OVERRIDES[series.slug]
                    const cardItems = overrideCards
                      ? overrideCards.map((c) => ({
                          name: c.name,
                          href: resolveCardHref(series.slug, c.href, c.name),
                          imgSrc: c.img.src,
                          imgW: c.img.w,
                          imgH: c.img.h,
                          unoptimized: true,
                        }))
                      : seriesSubs.slice(0, 6).map((s) => {
                          const slug = (s as unknown as { slug: string }).slug
                          const name = (s as unknown as { name: string }).name
                          return { name, href: `${lp}/products/${series.slug}/${slug}`, imgSrc: subImg(slug, series.slug), imgW: 480, imgH: 210, unoptimized: false }
                        })
                    return cardItems.map((card, i) => {
                      const inner = (
                        <>
                          <div className="relative aspect-[16/7] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface-alt)]">
                            <MediaImage
                              src={card.imgSrc}
                              alt={card.name}
                              width={card.imgW}
                              height={card.imgH}
                              unoptimized={card.unoptimized || undefined}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                            />
                            {i === 0 ? (
                              <span className="absolute top-2 left-2 lg:top-3 lg:left-3 bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-1 rounded-full">
                                {t_coreRange(locale)}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1.5 lg:mt-2.5 flex items-center justify-between gap-2">
                            <span className="text-[13px] lg:text-[15px] font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                              {card.name}
                            </span>
                            <Icon
                              name="arrow-up-right"
                              size={14}
                              className="text-[var(--color-accent)] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </div>
                        </>
                      )
                      return card.href === '#' ? (
                        <div key={card.name} className="block" aria-disabled="true">
                          {inner}
                        </div>
                      ) : (
                        <Link key={card.name} href={card.href} className="group block">
                          {inner}
                        </Link>
                      )
                    })
                  })()}
                </div>

                <Link
                  href={`${lp}/products/${series.slug}`}
                  className="mt-3 lg:mt-7 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[var(--color-primary)] hover:gap-2.5 transition-all"
                >
                  {t_viewAll(locale)} {catName(series.slug)}
                  <Icon name="arrow-right" size={15} className="text-[var(--color-accent)]" />
                </Link>
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}

function t_seriesHeading(locale: Locale): string {
  const map: Record<string, string> = {
    en: 'Series',
    ru: 'Серия',
    fr: 'Série',
    es: 'Serie',
    sw: 'Mfululizo',
    ar: 'سلسلة',
  }
  return map[locale] || 'Series'
}

function t_coreRange(locale: Locale): string {
  const map: Record<string, string> = {
    en: 'Core range',
    ru: 'Основная серия',
    fr: 'Gamme principale',
    es: 'Gama principal',
    sw: 'Mfululizo mkuu',
    ar: 'السلسلة الأساسية',
  }
  return map[locale] || 'Core range'
}

function t_viewAll(locale: Locale): string {
  const map: Record<string, string> = {
    en: 'View all',
    ru: 'Смотреть все',
    fr: 'Voir tout',
    es: 'Ver todo',
    sw: 'Tazama zote',
    ar: 'عرض الكل',
  }
  return map[locale] || 'View all'
}

/**
 * Normalises a display name for matching a curated card to a CMS record.
 *
 * The curated card names and the CMS names differ only in punctuation and
 * spacing (e.g. "H-Frame Automatic Layer Cage" vs "Automatic H Type Chicken
 * Cage" will NOT match, but "Rabbit Cage" vs "Rabbit Cage " will). Lowercase,
 * collapse whitespace, and drop punctuation so trivial differences do not
 * prevent a card from finding its product.
 */
function normCardName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
