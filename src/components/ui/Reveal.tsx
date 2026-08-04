"use client"

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  variant?: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-left' | 'slide-right'
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'figure' | 'article'
}

// Scroll-triggered reveal animation — respects reduced-motion via CSS
export default function Reveal({
  children,
  variant = 'fade-up',
  delay = 0,
  className = '',
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  // Compute reduced-motion preference at mount (client-side only)
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true
    }
    return false
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Respect reduced motion — already visible
    if (visible) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  const style: React.CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {}

  return (
    <Tag
      ref={ref as any}
      style={style}
      className={`reveal reveal-${variant} ${visible ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}
