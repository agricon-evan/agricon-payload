import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getVideos } from '@/lib/payload'
import { resolvePageHeroImage } from '@/lib/payload'
import PageHero from '@/components/PageHero'
import CtaSection from '@/components/CtaSection'
import Reveal from '@/components/ui/Reveal'
import Icon from '@/components/ui/Icon'
import VideoCard, { type VideoCardData } from '@/components/videos/VideoCard'
import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

/** Extract the YouTube video ID from common URL formats. */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([\w-]{6,})/,
    /youtube\.com\/live\/([\w-]{6,})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

function parseVideoUrl(url: string): { platform: VideoCardData['platform']; embedUrl: string | null; watchUrl: string; thumbnail: string | null } {
  const trimmed = url.trim()
  const ytId = getYouTubeId(trimmed)
  if (ytId) {
    return {
      platform: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
      thumbnail: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
    }
  }
  if (trimmed.includes('tiktok.com')) {
    return { platform: 'tiktok', embedUrl: null, watchUrl: trimmed, thumbnail: null }
  }
  return { platform: 'other', embedUrl: null, watchUrl: trimmed, thumbnail: null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'videos')
  return {
    title: t.hero?.title || 'Video Library',
    description: t.hero?.description || 'See Agricon equipment in action.',
  }
}

export default async function VideosPage({ params }: Props) {
  const { locale } = await params
  const heroImage = await resolvePageHeroImage('videos', '/images/heroes/farm-field.jpg')
  const t = getTranslations(locale as Locale, 'videos')
  const tHome = getTranslations(locale as Locale, 'home')
  const videos = await getVideos(locale)

  const cards: VideoCardData[] = videos.map((video) => {
    const parsed = parseVideoUrl(video.url || '')
    const mediaThumb =
      video.thumbnail && typeof video.thumbnail === 'object' && video.thumbnail.url
        ? (video.thumbnail.url as string)
        : null
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail: mediaThumb || parsed.thumbnail,
      embedUrl: parsed.embedUrl,
      watchUrl: parsed.watchUrl || video.url,
      platform: parsed.platform,
      watchLabel: parsed.platform === 'youtube' ? (t.watchOnYoutube || 'Watch on YouTube') : parsed.platform === 'tiktok' ? (t.watchOnTiktok || 'Watch on TikTok') : (t.watchOnYoutube || 'Watch'),
    }
  })

  return (
    <>
      <PageHero
        title={t.hero?.title || 'Video Library'}
        description={t.hero?.description || 'See Agricon equipment in action.'}
        breadcrumb={`${tHome.breadcrumb?.home || 'Home'} / ${t.breadcrumb?.videos || 'Videos'}`}
        image={heroImage}
      />

      <section className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {cards.map((video, index) => (
              <Reveal key={video.id} delay={(index % 3) * 70} className="h-full">
                <VideoCard video={video} index={index} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="max-w-xl mx-auto text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center">
                <Icon name="video" size={28} />
              </div>
              <h2 className="mt-6 text-xl md:text-2xl font-bold text-[var(--color-text)]">
                {t.hero?.title || 'Video Library'}
              </h2>
              <p className="mt-3 text-[var(--color-text-secondary)] leading-relaxed">
                {t.noVideos || 'Videos are being prepared. Please check back soon.'}
              </p>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center gap-2 mt-8 px-7 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-sm min-h-[48px] tap-target hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                {t.ctaButton || 'Request a Demo'}
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </Reveal>
        )}
      </section>

      <CtaSection
        locale={locale as Locale}
        title={t.ctaTitle || 'Want a Live Demonstration?'}
        description={t.ctaDescription || 'Contact our team to arrange a live video call.'}
        buttonLabel={t.ctaButton || 'Request a Demo'}
      />
    </>
  )
}
