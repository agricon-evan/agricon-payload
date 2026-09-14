import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getCategories, getSubcategories } from '@/lib/payload'
import { categoryImages, subcategoryImages, heroFallback } from '@/lib/images'
import MediaImage from '@/components/ui/MediaImage'
import Icon from '@/components/ui/Icon'

interface Props { locale: Locale }

// The four core product series, each a full-screen showcase (left scene + right series).
const SERIES_SLUGS = [
  { slug: 'poultry-equipment', accent: 'Poultry', tagline: 'Layer, broiler & hatchery systems' },
  { slug: 'livestock-equipment', accent: 'Livestock', tagline: 'Cattle, pig, goat & rabbit housing' },
  { slug: 'agriculture-machinery', accent: 'Machinery', tagline: 'Feed, processing & farm machinery' },
  { slug: 'farming-vehicles', accent: 'Vehicles', tagline: 'Tractors, harvesters & farm transport' },
] as const

const subImg = (slug: string, seriesSlug: string) =>
  subcategoryImages[slug] || categoryImages[seriesSlug] || heroFallback

// 首页左屏场景图覆盖：指定系列使用专属航拍图（不影响产品详情页画廊所引用的 catalog 图）。
// w/h 为文件真实内禀尺寸；图已预压缩，unoptimized 绕过 Next 优化器避免二次压缩发虚。
const SCENE_OVERRIDES: Record<string, { src: string; w: number; h: number }> = {
  'breeding-accessories': { src: '/images/home-series-poultry.jpg', w: 1672, h: 941 },
  'livestock-accessories': { src: '/images/home-series-livestock.jpg', w: 2289, h: 1831 },
  'production-line': { src: '/images/home-series-machinery.jpg', w: 2864, h: 1463 },
  'walking-tractor': { src: '/images/home-series-vehicles.jpg', w: 2741, h: 1530 },
}

// Poultry series: six fixed product cards with custom 16:7 images and product-level links.
// href 为空表示产品页未上线，先做占位（不可点击，无跳转）。
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
    { name: 'Chick Cage', img: { src: '/images/card-chick-cage.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Feeding & Watering Line', img: { src: '/images/card-feeding-watering-line.jpg', w: 1280, h: 560 }, href: '' },
  ],
  'livestock-equipment': [
    { name: 'European Rabbit Cage', img: { src: '/images/card-european-rabbit-cage.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Rabbit Cage', img: { src: '/images/card-rabbit-cage.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Sow Farrowing Bed', img: { src: '/images/card-sow-farrowing-bed.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Gestation Crate', img: { src: '/images/card-gestation-crate.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Livestock Fence', img: { src: '/images/card-livestock-fence.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Sheep Pen', img: { src: '/images/card-sheep-pen.jpg', w: 1280, h: 560 }, href: '' },
  ],
  'agriculture-machinery': [
    { name: 'Pellet Machine', img: { src: '/images/card-pellet-machine.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Fish Feed Pellet Machine', img: { src: '/images/card-fish-feed-pellet-machine.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Tooth Disc Crusher', img: { src: '/images/card-tooth-disc-crusher.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Hammer Crusher', img: { src: '/images/card-hammer-crusher.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Grass Chaff Machine', img: { src: '/images/card-grass-chaff-machine.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Mixing Machine', img: { src: '/images/card-mixing-machine.jpg', w: 1280, h: 560 }, href: '' },
  ],
  'farming-vehicles': [
    { name: 'Small Harvester', img: { src: '/images/card-small-harvester.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Walking Tractor', img: { src: '/images/card-walking-tractor.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Tractor', img: { src: '/images/card-tractor.jpg', w: 1280, h: 560 }, href: '' },
    { name: 'Tricycle', img: { src: '/images/card-tricycle.jpg', w: 1280, h: 560 }, href: '' },
  ],
}

export default async function ProductSeriesScreens({ locale }: Props) {
  const lp = `/${locale}`
  const [categories, subs] = await Promise.all([
    getCategories(locale),
    getSubcategories(locale),
  ])

  const catName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name || slug

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

              {/* Left — full-bleed scene photo, editorial index */}
              <Link
                href={`${lp}/products/${series.slug}/${leadSlug}`}
                className="group relative block overflow-hidden bg-[var(--color-surface-alt)] min-h-[17vh] sm:min-h-[20vh] lg:h-auto lg:min-h-0"
              >
                {lead ? (
                  (() => {
                    const scene = SCENE_OVERRIDES[leadSlug]
                    return (
                      <MediaImage
                        src={scene?.src || subImg(leadSlug, series.slug)}
                        alt={leadName}
                        width={scene?.w || 1200}
                        height={scene?.h || 900}
                        unoptimized={Boolean(scene) || undefined}
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
                  {series.tagline}
                </p>

                {/* mt-auto pushes the grid down: bottom-aligned with the left image, big gap from the text */}
                <div className="mt-auto pt-4 lg:pt-12 grid grid-cols-2 lg:grid-cols-3 gap-x-4 lg:gap-x-5 gap-y-4 lg:gap-y-6">
                  {(() => {
                    const overrideCards = SERIES_CARD_OVERRIDES[series.slug]
                    const cardItems = overrideCards
                      ? overrideCards.map((c) => ({
                          name: c.name,
                          href: c.href ? `${lp}/products/${series.slug}/${c.href}` : '#',
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
