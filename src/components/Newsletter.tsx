'use client'

import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@/i18n/config'
import { getUiString } from '@/i18n/ui'
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from '@/lib/anti-spam-constants'
import Icon from '@/components/ui/Icon'

export default function Newsletter({ locale }: { locale: Locale }) {
  const u = (key: string) => getUiString(locale, key)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  // Anti-spam: a hidden field no human fills, plus the time the form was first
  // rendered (see lib/anti-spam.ts). A ref keeps this out of the render cycle.
  const honeypotRef = useRef<HTMLInputElement>(null)
  // Seeded in an effect — `Date.now()` during render is a purity violation.
  const renderedAtRef = useRef<number>(0)
  useEffect(() => {
    renderedAtRef.current = Date.now()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletterSubscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
          [RENDERED_AT_FIELD]: String(renderedAtRef.current),
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setEmail('')
      // Refresh the token so a second signup in the same session is not flagged
      // as a stale/replayed submission.
      renderedAtRef.current = Date.now()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]">
      <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-16 items-center">
          {/* Editorial information block — flat, spacious, print-inspired */}
          <div>
            <span className="eyebrow text-[var(--color-primary)]">{u('newsletterEyebrow')}</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-[1.08] tracking-[-0.015em] text-[var(--color-text)]">
              {u('newsletterTitle')}
            </h2>
            <span className="orange-underline mt-4" aria-hidden="true" />
            <p className="mt-5 max-w-lg text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
              {u('newsletterDesc')}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-primary-light)]">
              <span>{u('newsletterChipProduct')}</span>
              <span>{u('newsletterChipInsights')}</span>
              <span>{u('newsletterChipExport')}</span>
            </div>
          </div>

          {/* Inquiry-field grammar — white card, restrained border, no decorative shadow */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm p-6 md:p-8">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-sm bg-[var(--color-primary)] text-white flex items-center justify-center">
                <Icon name="mail" size={19} />
              </span>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[var(--color-text)]">{u('newsletterHeading')}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{u('newsletterSub')}</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="mt-6">
              <label htmlFor="newsletter-email" className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                Email address
              </label>
              <div className="mt-2 flex flex-col sm:flex-row gap-3">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={u('newsletterPlaceholder')}
                  className="flex-1 min-w-0 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm min-h-[48px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-sm min-h-[48px] press tap-target disabled:opacity-50 transition-colors hover:bg-[var(--color-primary-dark)]"
                >
                  {status === 'loading' ? '...' : u('newsletterSubscribe')}
                  {status !== 'loading' && <Icon name="arrow-right" size={16} className="text-[var(--color-accent-soft)]" />}
                </button>
              </div>
              {/* Anti-spam honeypot. Hidden from sighted users AND from assistive
                  technology (aria-hidden + tabIndex -1) so it never becomes a
                  confusing required field. Bots that parse the DOM fill it in. */}
              <div aria-hidden="true" className="hidden">
                <label htmlFor="newsletter-company-website">Company website</label>
                <input
                  id="newsletter-company-website"
                  ref={honeypotRef}
                  type="text"
                  name={HONEYPOT_FIELD}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
            </form>
            {status === 'success' && (
              <p className="mt-3 text-sm text-[var(--color-primary)]" role="status">{u('newsletterSuccess')}</p>
            )}
            {status === 'error' && (
              <p className="mt-3 text-sm text-[var(--color-accent)]" role="alert">{u('newsletterError')}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
