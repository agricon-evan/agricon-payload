"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Icon from '@/components/ui/Icon'
import { getUiString, type UiLocale } from '@/i18n/ui'

interface ScrollRailProps {
  children: ReactNode
  /** Accessible label for the scrollable region. */
  label: string
  /** Locale for the arrow-button labels (see src/i18n/ui.ts). */
  locale?: string
  /** Auto-advance interval in ms. Set to 0 to disable. Default 3000. */
  autoAdvanceMs?: number
  /** How long to hold autoplay after the user touches the rail, in ms. Default 8000. */
  manualHoldMs?: number
}

/** Matches the `gap-5` on the rail — used so every step lands on a card boundary. */
const GAP = 20

/**
 * Horizontal snap rail with prev/next controls, a progress bar and optional autoplay.
 *
 * Manual and automatic movement MUST use the same step (one card + gap). They used to
 * differ — the buttons jumped ~0.85 × viewport while autoplay moved a single card — so
 * a manual click left the rail off a snap point and the next automatic tick landed
 * mid-card, which read as a glitch. Autoplay now also restarts its interval after any
 * manual interaction instead of firing on top of it.
 *
 * Autoplay pauses while the rail is hovered, focused or touched, for a cooldown after a
 * manual action, while the tab is hidden, and is disabled entirely under
 * `prefers-reduced-motion`.
 */
export default function ScrollRail({
  children,
  label,
  locale = 'en',
  autoAdvanceMs = 3000,
  manualHoldMs = 8000,
}: ScrollRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(1)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [manualHold, setManualHold] = useState(false)
  const [hidden, setHidden] = useState(false)

  /**
   * True while a programmatic (autoplay / button) scroll animation is running, so the
   * scroll handler can tell it apart from a real user drag or swipe.
   */
  const autoScrolling = useRef(false)
  const autoScrollTimer = useRef<number | null>(null)
  const holdTimer = useRef<number | null>(null)

  const paused = hovered || manualHold || hidden

  /** One card + gap, so every movement lands exactly on a snap point. */
  const stepSize = useCallback(() => {
    const el = railRef.current
    if (!el) return 0
    const first = el.firstElementChild as HTMLElement | null
    return first ? first.getBoundingClientRect().width + GAP : Math.round(el.clientWidth * 0.85)
  }, [])

  const measure = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
    setVisible(el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1)
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(max <= 0 || el.scrollLeft >= max - 4)
  }, [])

  /** Hold autoplay for a while after the user does something themselves. */
  const holdAfterManual = useCallback(() => {
    setManualHold(true)
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => setManualHold(false), manualHoldMs)
  }, [manualHoldMs])

  /** Mark the next ~700ms of scroll events as ours rather than the user's. */
  const markAutoScroll = useCallback(() => {
    autoScrolling.current = true
    if (autoScrollTimer.current) window.clearTimeout(autoScrollTimer.current)
    autoScrollTimer.current = window.setTimeout(() => {
      autoScrolling.current = false
    }, 700)
  }, [])

  const scrollByStep = useCallback(
    (dir: -1 | 1) => {
      const el = railRef.current
      if (!el) return
      const step = stepSize()
      if (!step) return
      markAutoScroll()
      el.scrollBy({ left: dir * step, behavior: 'smooth' })
    },
    [stepSize, markAutoScroll],
  )

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    measure()

    const onScroll = () => {
      measure()
      // A scroll we did not start is the user dragging / swiping — hold autoplay.
      if (!autoScrolling.current) holdAfterManual()
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [measure, holdAfterManual])

  // Don't let the rail race ahead while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(
    () => () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current)
      if (autoScrollTimer.current) window.clearTimeout(autoScrollTimer.current)
    },
    [],
  )

  // Autoplay — one card per tick, wrapping back to the first card at the end.
  useEffect(() => {
    if (!autoAdvanceMs || paused) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = railRef.current
    if (!el) return

    const id = window.setInterval(() => {
      const max = el.scrollWidth - el.clientWidth
      if (max <= 4) return
      const step = stepSize()
      if (!step) return
      const next = el.scrollLeft + step
      markAutoScroll()
      el.scrollTo({ left: next >= max - 8 ? 0 : next, behavior: 'smooth' })
    }, autoAdvanceMs)

    return () => window.clearInterval(id)
  }, [autoAdvanceMs, paused, stepSize, markAutoScroll])

  const onManual = (dir: -1 | 1) => {
    holdAfterManual()
    scrollByStep(dir)
  }

  const thumb = Math.min(100, Math.max(10, Math.round(visible * 100)))
  const btn =
    'w-10 h-10 shrink-0 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-30 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text)]'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
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
          <button type="button" onClick={() => onManual(-1)} disabled={atStart} aria-label={getUiString(locale as UiLocale, 'scrollLeft')} className={btn}>
            <Icon name="chevron-left" size={18} />
          </button>
          <button type="button" onClick={() => onManual(1)} disabled={atEnd} aria-label={getUiString(locale as UiLocale, 'scrollRight')} className={btn}>
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
