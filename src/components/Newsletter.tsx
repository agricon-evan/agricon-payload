'use client'

import { useState } from 'react'
import type { Locale } from '@/i18n/config'
import { getUiString } from '@/i18n/ui'

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
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text)] tracking-tight">
          {u('newsletterTitle')}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
          {u('newsletterDesc')}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={u('newsletterPlaceholder')}
            className="flex-1 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md min-h-[48px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target disabled:opacity-50 transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            {status === 'loading' ? '...' : u('newsletterSubscribe')}
          </button>
        </form>
        {status === 'success' && (
          <p className="mt-3 text-sm text-[var(--color-primary)]">{u('newsletterSuccess')}</p>
        )}
        {status === 'error' && (
          <p className="mt-3 text-sm text-red-600">{u('newsletterError')}</p>
        )}
      </div>
    </section>
  )
}