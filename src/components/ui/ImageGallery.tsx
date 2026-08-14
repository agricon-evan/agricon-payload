'use client'

import { useState } from 'react'
import MediaImage from '@/components/ui/MediaImage'

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
 * AGRICON photo matrix — {component.photo-matrix}: one dominant image plus a
 * supporting thumbnail strip. All image edges align, gaps stay 2.5–4 mm,
 * thumbnails act as selectors (>=72px) with a clear green selected state.
 * Flat: no shadows, no mixed radius treatments.
 */
export default function ImageGallery({ images, aspect = '4-3', priority = false, className = '' }: ImageGalleryProps) {
  const [active, setActive] = useState(0)
  if (!images.length) return null
  const current = images[Math.min(active, images.length - 1)]

  return (
    <div className={className}>
      {/* Dominant image */}
      <div className={`${ASPECT[aspect]} rounded-lg overflow-hidden bg-[var(--color-muted)]`}>
        <MediaImage
          src={current.src}
          alt={current.alt}
          width={1000}
          height={750}
          priority={priority && active === 0}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Supporting thumbnails — equal width, consistent crop, 4 mm gap */}
      {images.length > 1 && (
        <div className="grid gap-2.5 mt-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(images.length, 5)}, minmax(0,1fr))` }}>
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative aspect-[4/3] overflow-hidden rounded-md bg-[var(--color-muted)] transition-all tap-target press ${
                i === active
                  ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg)]'
                  : 'opacity-75 hover:opacity-100'
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
