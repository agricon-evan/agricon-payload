'use client'

import { useState } from 'react'
import type { Locale } from '@/i18n/config'
import { getUiString } from '@/i18n/ui'
import Icon from '@/components/ui/Icon'

export default function Newsletter({ locale }: { locale: Locale }) {
  const u = (key: string) => getUiString(locale, key)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletterSubscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setEmail('')
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
            <span className="eyebrow text-[var(--color-primary)]">AGRICON Updates</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-[1.08] tracking-[-0.015em] text-[var(--color-text)]">
              {u('newsletterTitle')}
            </h2>
            <span className="orange-underline mt-4" aria-hidden="true" />
            <p className="mt-5 max-w-lg text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
              {u('newsletterDesc')}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-primary-light)]">
              <span>Product updates</span>
              <span>Farm insights</span>
              <span>Export support</span>
            </div>
          </div>

          {/* Inquiry-field grammar — white card, restrained border, no decorative shadow */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm p-6 md:p-8">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-sm bg-[var(--color-primary)] text-white flex items-center justify-center">
                <Icon name="mail" size={19} />
              </span>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[var(--color-text)]">Get practical updates</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">One useful update at a time. No unnecessary noise.</p>
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
