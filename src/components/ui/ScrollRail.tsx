"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Icon from '@/components/ui/Icon'

interface ScrollRailProps {
  children: ReactNode
  /** Accessible label for the scrollable region. */
  label: string
  /** Auto-advance interval in ms. Set to 0 to disable. Default 3000. */
  autoAdvanceMs?: number
}

/**
 * Horizontal snap rail with prev/next controls, a progress bar and optional autoplay.
 *
 * Native horizontal scrolling is awkward with a mouse, so the rail gets explicit
 * controls. Autoplay pauses while the user is hovering, focusing or touching the
 * rail, and is disabled entirely under `prefers-reduced-motion`.
 */
export default function ScrollRail({ children, label, autoAdvanceMs = 3000 }: ScrollRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(1)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [paused, setPaused] = useState(false)

  const measure = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
    setVisible(el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1)
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(max <= 0 || el.scrollLeft >= max - 4)
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      el.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  // Autoplay. Steps by exactly one card (card width + gap) so it lands on a snap
  // point, and wraps back to the first card at the end.
  useEffect(() => {
    if (!autoAdvanceMs || paused) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = railRef.current
    if (!el) return

    const id = window.setInterval(() => {
      const max = el.scrollWidth - el.clientWidth
      if (max <= 4) return
      const first = el.firstElementChild as HTMLElement | null
      const gap = 20 // matches `gap-5`
      const step = first ? first.getBoundingClientRect().width + gap : Math.round(el.clientWidth * 0.85)
      const next = el.scrollLeft + step
      el.scrollTo({ left: next >= max - 8 ? 0 : next, behavior: 'smooth' })
    }, autoAdvanceMs)

    return () => window.clearInterval(id)
  }, [autoAdvanceMs, paused])

  const nudge = (dir: -1 | 1) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: 'smooth' })
  }

  const thumb = Math.min(100, Math.max(10, Math.round(visible * 100)))
  const btn =
    'w-10 h-10 shrink-0 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-30 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text)]'

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={railRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-4"
      >
        {children}
      </div>

      <div className="mt-6 flex items-center gap-5">
        <div className="flex-1 h-[3px] rounded-full bg-[var(--color-border)] overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-[margin-left] duration-150 ease-out"
            style={{ width: `${thumb}%`, marginLeft: `${progress * (100 - thumb)}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => nudge(-1)} disabled={atStart} aria-label="Scroll left" className={btn}>
            <Icon name="chevron-left" size={18} />
          </button>
          <button type="button" onClick={() => nudge(1)} disabled={atEnd} aria-label="Scroll right" className={btn}>
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
