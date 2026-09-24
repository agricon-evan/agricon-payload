'use client'

import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/ui/Icon'
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from '@/lib/anti-spam-constants'

// Lightweight props — server passes only what client needs (NOT the full i18n module)
interface ContactFormProps {
  locale: string
  contactMethods: { email?: { title: string; description: string }; phone?: { title: string; description: string }; whatsapp?: { title: string; description: string } }
  inquiryLabels: {
    title: string; description: string; contactName: string; emailAddress: string
    companyName: string; country: string; selectCountry: string
    interestedProducts: string; message: string; messagePlaceholder: string
    submit: string; submitting: string; errorNetwork: string
    /**
     * The two server-side rejections the public write guard can return. They were
     * previously collapsed into `errorNetwork`, so a rate-limited visitor was
     * told "network error, please try again" and retried immediately — each retry
     * consuming another token and deepening the limit.
     */
    errorRateLimit: string; errorRejected: string
  }
  /**
   * Requirement-diagnosis field labels and options (Application / Current Setup /
   * Purchase Type). These used to be hard-coded English inside this component, so
   * the fields the sales handbook cares most about were the only ones still in
   * English on all six localised contact pages.
   */
  diagnostics: {
    phone: string
    phonePlaceholder: string
    application: string
    currentSetup: string
    purchaseType: string
    select: string
    applications: Record<string, string>
    setups: Record<string, string>
    purchaseTypes: Record<string, string>
  }
  responseInfo: { title: string; items: { title: string; description: string }[] }
  countries: string[]
  productOptions: string[]
  successTitle: string; successDesc: string; successBrowse: string
  whatsappTitle: string; whatsappDesc: string; whatsappOpen: string
  responseLabel: string
  whatsappNumber?: string
  /** Product pre-selected from the product detail page (?product=slug) */
  initialProduct?: string
}

export default function ContactForm(props: ContactFormProps) {
  const {
    locale, contactMethods, inquiryLabels: t, diagnostics: d, responseInfo, countries, productOptions,
    successTitle, successDesc, successBrowse,
    whatsappTitle, whatsappDesc, whatsappOpen, responseLabel, whatsappNumber,
    initialProduct,
  } = props

  const whatsappDigits = whatsappNumber?.replace(/\D/g, '')

  const [form, setForm] = useState({
    name: '', email: '', company: '', country: '', phone: '',
    message: initialProduct ? `I'm interested in: ${initialProduct}\n\n` : '',
    application: '', currentSetup: '', purchaseType: '',
  })
  const [interest, setInterest] = useState<string[]>(initialProduct ? [initialProduct] : [])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  // Anti-spam: hidden honeypot field + the time this form first rendered.
  // See lib/anti-spam.ts for the server-side heuristics these feed.
  const honeypotRef = useRef<HTMLInputElement>(null)
  // Seeded in an effect, not during render: `Date.now()` is impure and reading
  // it in the render body is a React purity violation (and would change on every
  // re-render). The effect runs right after mount, which is exactly the moment
  // the visitor starts reading the form.
  const renderedAtRef = useRef<number>(0)
  useEffect(() => {
    renderedAtRef.current = Date.now()
  }, [])

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const toggleInterest = (p: string) =>
    setInterest(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Re-entrancy guard. The `disabled` attribute alone is not enough: it does
    // not stop a second Enter-key submit that was already queued, and a stalled
    // request used to leave the form permanently un-submittable.
    if (status === 'submitting' || status === 'success') return
    setStatus('submitting')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productInterest: interest.map(p => ({ product: p })),
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
          [RENDERED_AT_FIELD]: String(renderedAtRef.current),
        }),
      })
      if (!res.ok) {
        // Distinguish the guard's two documented rejections instead of showing
        // "network error" for all of them. The server already returns a
        // human-readable message in the JSON body; prefer the localised string
        // and fall back to the server text.
        const localised =
          res.status === 429 ? t.errorRateLimit
          : res.status === 400 ? t.errorRejected
          : t.errorNetwork
        let serverMessage = ''
        try {
          const body = await res.json()
          serverMessage =
            (typeof body?.message === 'string' && body.message) ||
            (Array.isArray(body?.errors) && typeof body.errors[0]?.message === 'string' && body.errors[0].message) ||
            ''
        } catch {
          // Non-JSON error body — the localised string is enough.
        }
        setStatus('error')
        setError(localised || serverMessage || t.errorNetwork)
        // A stale timing token (>12h old tab) can never pass the guard, so give
        // the visitor a fresh one rather than leaving them stuck.
        renderedAtRef.current = Date.now()
        return
      }
      setStatus('success')
      // Fresh token so a follow-up inquiry from the same visitor is not treated
      // as a replayed/stale submission.
      renderedAtRef.current = Date.now()
    } catch {
      setStatus('error')
      setError(t.errorNetwork)
    }
  }

  const fieldClass = "w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
  const methodIcons: Record<string, string> = { email: 'mail', phone: 'phone', whatsapp: 'whatsapp' }

  return (
    <>
      {/* Contact methods cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-12">
        {Object.entries(contactMethods).map(([key, m]) => (
          <div key={key} className="card card-hover p-6">
            <div className="w-10 h-10 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mb-4">
              <Icon name={methodIcons[key] || 'mail'} size={20} />
            </div>
            <h2 className="font-semibold text-lg text-[var(--color-text)]">{m.title}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{m.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 card p-6 md:p-8">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[var(--color-text)]">{t.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.description}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium mb-1.5">{t.contactName} *</label>
              <input id="contact-name" required value={form.name} onChange={update('name')} className={fieldClass} placeholder={t.contactName} />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium mb-1.5">{t.emailAddress} *</label>
              <input id="contact-email" required type="email" value={form.email} onChange={update('email')} className={fieldClass} placeholder="you@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-company" className="block text-sm font-medium mb-1.5">{t.companyName}</label>
              <input id="contact-company" value={form.company} onChange={update('company')} className={fieldClass} placeholder={t.companyName} />
            </div>
            <div>
              <label htmlFor="contact-country" className="block text-sm font-medium mb-1.5">{t.country}</label>
              <select id="contact-country" value={form.country} onChange={update('country')} className={fieldClass}>
                <option value="">{t.selectCountry}</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="contact-phone" className="block text-sm font-medium mb-1.5">{d.phone}</label>
            <input id="contact-phone" type="tel" value={form.phone} onChange={update('phone')} className={fieldClass} placeholder={d.phonePlaceholder} />
          </div>
          <div>
            {/* Button group, not a labelled control — use a group + toggle semantics
                instead of a <label> (which would have nothing to point at). */}
            <span id="contact-interests-label" className="block text-sm font-medium mb-2">{t.interestedProducts}</span>
            <div role="group" aria-labelledby="contact-interests-label" className="flex flex-wrap gap-2">
              {productOptions.map(p => (
                <button key={p} type="button" onClick={() => toggleInterest(p)}
                  aria-pressed={interest.includes(p)}
                  className={`px-3.5 py-2 rounded-md text-sm border min-h-[40px] tap-target transition-colors ${
                    interest.includes(p)
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white font-medium'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                >{p}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="contact-application" className="block text-sm font-medium mb-1.5">{d.application}</label>
              <select id="contact-application" value={form.application} onChange={update('application')} className={fieldClass}>
                <option value="">{d.select}</option>
                <option>{d.applications.layerFarm}</option>
                <option>{d.applications.broilerFarm}</option>
                <option>{d.applications.breederHatchery}</option>
                <option>{d.applications.pigFarm}</option>
                <option>{d.applications.cattleFarm}</option>
                <option>{d.applications.feedPlant}</option>
                <option>{d.applications.distributor}</option>
                <option>{d.applications.other}</option>
              </select>
            </div>
            <div>
              <label htmlFor="contact-current-setup" className="block text-sm font-medium mb-1.5">{d.currentSetup}</label>
              <select id="contact-current-setup" value={form.currentSetup} onChange={update('currentSetup')} className={fieldClass}>
                <option value="">{d.select}</option>
                <option>{d.setups.newProject}</option>
                <option>{d.setups.replacing}</option>
                <option>{d.setups.expanding}</option>
                <option>{d.setups.automation}</option>
                <option>{d.setups.other}</option>
              </select>
            </div>
            <div>
              <label htmlFor="contact-purchase-type" className="block text-sm font-medium mb-1.5">{d.purchaseType}</label>
              <select id="contact-purchase-type" value={form.purchaseType} onChange={update('purchaseType')} className={fieldClass}>
                <option value="">{d.select}</option>
                <option>{d.purchaseTypes.comparing}</option>
                <option>{d.purchaseTypes.ready}</option>
                <option>{d.purchaseTypes.researching}</option>
                <option>{d.purchaseTypes.partnership}</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium mb-1.5">{t.message} *</label>
            <textarea id="contact-message" required rows={5} value={form.message} onChange={update('message')} className={`${fieldClass} resize-y`} placeholder={t.messagePlaceholder} />
          </div>
          {status === 'success' && (
            <div role="status" aria-live="polite" className="p-5 bg-[var(--color-primary)]/6 border border-[var(--color-primary)]/20 rounded-md text-[var(--color-primary)]">
              <div className="font-semibold">{successTitle}</div>
              <p className="mt-1 text-sm opacity-90">{successDesc}</p>
              <a href={`/${locale}/products`} className="inline-block mt-3 text-sm font-semibold underline">{successBrowse}</a>
            </div>
          )}
          {status === 'error' && (
            <div role="alert" aria-live="assertive" className="p-5 bg-[var(--color-canvas-soft)] border border-[var(--color-accent)]/40 rounded-md">
              <p className="text-sm text-[var(--color-text)] font-medium flex items-start gap-2">
                <Icon name="alert" size={16} className="text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}
          {/* Disabled after a successful submit. The form fields keep their
              values, so leaving the button live meant a second Enter/click filed
              a duplicate inquiry — the refreshed timing token (see handleSubmit)
              passed the anti-spam check, so nothing stopped it. */}
          <button type="submit" disabled={status === 'submitting' || status === 'success'}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[52px] press tap-target disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[var(--color-primary-dark)]"
          >{status === 'submitting' ? t.submitting : t.submit}{status === 'idle' && <Icon name="arrow-right" size={16} />}</button>
          {/* Anti-spam honeypot — hidden from sighted users and assistive tech. */}
          <div aria-hidden="true" className="hidden">
            <label htmlFor="contact-company-website">Company website</label>
            <input
              id="contact-company-website"
              ref={honeypotRef}
              type="text"
              name={HONEYPOT_FIELD}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
        </form>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-[var(--color-text)] mb-4">{responseLabel}</h3>
            <ul className="space-y-4">
              {responseInfo.items.map((item: { title?: string; description?: string }, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center flex-shrink-0 font-semibold text-xs tabular-nums">{['1', '2', '3'][i]}</span>
                  <div>
                    <div className="font-medium text-[var(--color-text)] text-sm">{item.title}</div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{item.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 bg-[var(--color-primary)] text-white rounded-lg">
            <h3 className="font-semibold text-lg">{whatsappTitle}</h3>
            <p className="mt-2 text-sm opacity-85 leading-relaxed">{whatsappDesc}</p>
            {whatsappDigits ? (
              <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 mt-4 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-sm min-h-[44px] tap-target transition-colors hover:bg-[var(--color-primary-dark)]"
              ><Icon name="whatsapp" size={16} />{whatsappOpen}</a>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  )
}
