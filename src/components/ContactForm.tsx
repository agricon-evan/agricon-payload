'use client'

import { useState } from 'react'
import Icon from '@/components/ui/Icon'

// Lightweight props — server passes only what client needs (NOT the full i18n module)
interface ContactFormProps {
  locale: string
  contactMethods: { email?: { title: string; description: string }; phone?: { title: string; description: string }; whatsapp?: { title: string; description: string } }
  inquiryLabels: {
    title: string; description: string; contactName: string; emailAddress: string
    companyName: string; country: string; selectCountry: string
    interestedProducts: string; message: string; messagePlaceholder: string
    submit: string; submitting: string; errorNetwork: string
  }
  responseInfo: { title: string; items: { title: string; description: string }[] }
  countries: string[]
  productOptions: string[]
  successTitle: string; successDesc: string; successBrowse: string
  ctaGetQuote: string
  whatsappTitle: string; whatsappDesc: string; whatsappOpen: string
  responseLabel: string
  homeLabel: string; contactLabel: string
}

export default function ContactForm(props: ContactFormProps) {
  const {
    locale, contactMethods, inquiryLabels: t, responseInfo, countries, productOptions,
    successTitle, successDesc, successBrowse, ctaGetQuote,
    whatsappTitle, whatsappDesc, whatsappOpen, responseLabel, homeLabel, contactLabel,
  } = props

  const [form, setForm] = useState({
    name: '', email: '', company: '', country: '', phone: '', message: '',
    application: '', currentSetup: '', purchaseType: '',
  })
  const [interest, setInterest] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const toggleInterest = (p: string) =>
    setInterest(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productInterest: interest.map(p => ({ product: p })),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
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
              <label className="block text-sm font-medium mb-1.5">{t.contactName} *</label>
              <input required value={form.name} onChange={update('name')} className={fieldClass} placeholder={t.contactName} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.emailAddress} *</label>
              <input required type="email" value={form.email} onChange={update('email')} className={fieldClass} placeholder="you@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.companyName}</label>
              <input value={form.company} onChange={update('company')} className={fieldClass} placeholder={t.companyName} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.country}</label>
              <select value={form.country} onChange={update('country')} className={fieldClass}>
                <option value="">{t.selectCountry}</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={update('phone')} className={fieldClass} placeholder="+86 000 000 0000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t.interestedProducts}</label>
            <div className="flex flex-wrap gap-2">
              {productOptions.map(p => (
                <button key={p} type="button" onClick={() => toggleInterest(p)}
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
              <label className="block text-sm font-medium mb-1.5">Application</label>
              <select value={form.application} onChange={update('application')} className={fieldClass}>
                <option value="">Select...</option>
                <option>Layer (egg) farm</option>
                <option>Broiler farm</option>
                <option>Breeder / hatchery</option>
                <option>Pig farm</option>
                <option>Cattle farm</option>
                <option>Feed processing plant</option>
                <option>Distributor / reseller</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Current Setup</label>
              <select value={form.currentSetup} onChange={update('currentSetup')} className={fieldClass}>
                <option value="">Select...</option>
                <option>New project</option>
                <option>Replacing old equipment</option>
                <option>Expanding existing farm</option>
                <option>Upgrading for automation</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Purchase Type</label>
              <select value={form.purchaseType} onChange={update('purchaseType')} className={fieldClass}>
                <option value="">Select...</option>
                <option>Need a quote for comparison</option>
                <option>Ready to order</option>
                <option>Researching options</option>
                <option>Long-term partnership</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.message} *</label>
            <textarea required rows={5} value={form.message} onChange={update('message')} className={`${fieldClass} resize-y`} placeholder={t.messagePlaceholder} />
          </div>
          {status === 'success' && (
            <div className="p-5 bg-[var(--color-primary)]/6 border border-[var(--color-primary)]/20 rounded-md text-[var(--color-primary)]">
              <div className="font-semibold">{successTitle}</div>
              <p className="mt-1 text-sm opacity-90">{successDesc}</p>
              <a href={`/${locale}/products`} className="inline-block mt-3 text-sm font-semibold underline">{successBrowse}</a>
            </div>
          )}
          {status === 'error' && <div className="p-5 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
          <button type="submit" disabled={status === 'submitting'}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[52px] press tap-target disabled:opacity-50 transition-colors hover:bg-[var(--color-primary-dark)]"
          >{status === 'submitting' ? t.submitting : t.submit}{status !== 'submitting' && <Icon name="arrow-right" size={16} />}</button>
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
            <a href="https://wa.me/00000000" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 mt-4 px-6 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-md min-h-[44px] tap-target transition-colors hover:brightness-110"
            ><Icon name="whatsapp" size={16} />{whatsappOpen}</a>
          </div>
        </aside>
      </div>
    </>
  )
}
