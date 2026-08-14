"use client"

import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'

export interface VideoCardData {
  id: number | string
  title: string
  description?: string | null
  thumbnail?: string | null
  embedUrl?: string | null
  watchUrl: string
  platform: 'youtube' | 'tiktok' | 'other'
  watchLabel: string
}

/**
 * Client-side video card with an inline lightbox (YouTube embed).
 * TikTok / other platforms fall back to opening the video in a new tab.
 */
export default function VideoCard({ video, index }: { video: VideoCardData; index: number }) {
  const [open, setOpen] = useState(false)

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  const handleOpen = () => {
    if (video.embedUrl) {
      setOpen(true)
    } else {
      window.open(video.watchUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <article className="card card-hover h-full flex flex-col overflow-hidden group" style={{ animationDelay: `${index * 60}ms` }}>
        <button
          type="button"
          onClick={handleOpen}
          className="relative block w-full aspect-video bg-[var(--color-muted)] overflow-hidden tap-target"
          aria-label={`Play: ${video.title}`}
        >
          {video.thumbnail ? (
            <MediaImage
              src={video.thumbnail}
              alt={video.title}
              width={640}
              height={360}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-primary-dark)]">
              <Icon name="video" size={40} className="text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-[var(--color-primary-dark)]/35 transition-colors group-hover:bg-[var(--color-primary-dark)]/20" />
          {/* Play button */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <Icon name="play" size={22} className="ml-0.5" />
            </span>
          </span>
          {/* Platform badge */}
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-semibold uppercase tracking-wide">
            <Icon name={video.platform === 'youtube' ? 'youtube' : video.platform === 'tiktok' ? 'music' : 'external'} size={12} />
            {video.platform === 'youtube' ? 'YouTube' : video.platform === 'tiktok' ? 'TikTok' : 'Video'}
          </span>
        </button>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-base font-semibold leading-snug text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
            {video.title}
          </h3>
          {video.description && (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3 flex-1">
              {video.description}
            </p>
          )}
          <a
            href={video.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors tap-target"
          >
            {video.watchLabel}
            <Icon name="external" size={14} />
          </a>
        </div>
      </article>

      {/* Lightbox */}
      {open && video.embedUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors tap-target"
            aria-label="Close video"
          >
            <Icon name="close" size={22} />
          </button>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={video.embedUrl}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <p className="mt-3 text-white/85 text-sm font-medium">{video.title}</p>
          </div>
        </div>
      )}
    </>
  )
}
