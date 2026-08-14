'use client'

import { useRef, useState } from 'react'
import MediaImage from '@/components/ui/MediaImage'
import Icon from '@/components/ui/Icon'

interface GalleryImage {
  src: string
  alt: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  /** consistent crop behavior — {component.photo-matrix} */
  aspect?: 'square' | '4-3' | '3-2'
  priority?: boolean
  className?: string
}

const ASPECT: Record<string, string> = {
  'square': 'aspect-square',
  '4-3': 'aspect-[4/3]',
  '3-2': 'aspect-[3/2]',
}

/**
 * AGRICON photo matrix — {component.photo-matrix}: one dominant image with
 * prev/next arrows plus a single-row horizontally scrollable thumbnail strip.
 * Thumbnails act as selectors (>=72px) with a clear green selected state.
 */
export default function ImageGallery({ images, aspect = '4-3', priority = false, className = '' }: ImageGalleryProps) {
  const [active, setActive] = useState(0)
  const stripRef = useRef<HTMLDivElement>(null)
  if (!images.length) return null
  const count = images.length
  const current = images[Math.min(active, count - 1)]

  const prev = () => setActive((i) => (i - 1 + count) % count)
  const next = () => setActive((i) => (i + 1) % count)

  // Keep the active thumbnail visible in the scrolling strip
  const scrollThumbIntoView = (index: number) => {
    const strip = stripRef.current
    if (!strip) return
    const thumb = strip.children[index] as HTMLElement | undefined
    if (!thumb) return
    const left = thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2
    strip.scrollTo({ left, behavior: 'smooth' })
  }

  const select = (index: number) => {
    setActive(index)
    scrollThumbIntoView(index)
  }

  return (
    <div className={className}>
      {/* Dominant image with prev/next arrows */}
      <div className={`${ASPECT[aspect]} relative rounded-lg overflow-hidden bg-[var(--color-muted)] group`}>
        <MediaImage
          src={current.src}
          alt={current.alt}
          width={1000}
          height={750}
          priority={priority && active === 0}
          className="w-full h-full object-cover"
        />

        {count > 1 && (
          <>
            {/* Left / right arrows */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-black/65 tap-target press"
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-black/65 tap-target press"
            >
              <Icon name="chevron-right" size={20} />
            </button>

            {/* Counter */}
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-semibold tabular-nums">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {/* Single-row scrollable thumbnail strip — py offsets leave room for the ring */}
      {count > 1 && (
        <div
          ref={stripRef}
          className="flex gap-2.5 mt-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1.5 -my-1.5"
          role="tablist"
          aria-label="Product images"
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => select(i)}
              aria-label={`View image ${i + 1}`}
              role="tab"
              aria-selected={i === active}
              className={`relative w-20 sm:w-24 shrink-0 aspect-[4/3] overflow-hidden rounded-md bg-[var(--color-muted)] transition-all tap-target press snap-start ${
                i === active
                  ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg)]'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <MediaImage src={img.src} alt={img.alt} width={160} height={120} loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
