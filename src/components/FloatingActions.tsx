'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/i18n/config'
import Icon from '@/components/ui/Icon'

interface FloatingActionsProps {
  locale: Locale
  whatsappNumber?: string | null
}

/** Fixed customer actions: WhatsApp contact + return-to-top. */
export default function FloatingActions({ whatsappNumber }: FloatingActionsProps) {
  const [showTop, setShowTop] = useState(false)
  const digits = whatsappNumber?.replace(/\D/g, '') || ''

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 420)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="fixed right-3 bottom-5 sm:right-6 sm:bottom-6 z-40 flex flex-col items-center gap-3">
      {digits && (
        <a
          href={`https://wa.me/${digits}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Agricon on WhatsApp"
          title="Chat on WhatsApp"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--color-primary)] text-white border-2 border-white flex items-center justify-center transition-transform hover:scale-105 press tap-target"
        >
          <Icon name="whatsapp" size={24} strokeWidth={1.8} />
        </a>
      )}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-border)] flex items-center justify-center transition-all press tap-target ${showTop ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}
      >
        <Icon name="arrow-up" size={18} />
      </button>
    </div>
  )
}
