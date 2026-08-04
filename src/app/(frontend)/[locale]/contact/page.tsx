import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import ContactForm from '@/components/ContactForm'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'contact')
  const tHome = getTranslations(locale as Locale, 'home')

  const methods = (t.contactMethods || {}) as Record<string, { title: string; description: string }>
  const responseItems = (t.responseInfo?.items ?? {}) as Record<string, { title: string; description: string }>

  return (
    <>
      <section className="bg-[var(--color-primary-dark)] text-white py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="text-xs md:text-sm opacity-70 mb-3">
            {tHome.breadcrumb?.home || 'Home'} / {t.breadcrumb?.contact || 'Contact'}
          </nav>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{t.hero?.title || 'Contact Us'}</h1>
          <p className="mt-4 max-w-2xl opacity-85 text-sm md:text-base leading-relaxed">
            {t.hero?.description || 'Get in touch with our team for inquiries, pricing, and support.'}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <ContactForm
          locale={locale}
          contactMethods={methods}
          inquiryLabels={{
            title: t.inquiryForm?.title || 'Send Us Your Inquiry',
            description: t.inquiryForm?.description || '',
            contactName: t.inquiryForm?.contactName || 'Name',
            emailAddress: t.inquiryForm?.emailAddress || 'Email',
            companyName: t.inquiryForm?.companyName || 'Company',
            country: t.inquiryForm?.country || 'Country',
            selectCountry: t.inquiryForm?.selectCountry || 'Select your country',
            interestedProducts: t.inquiryForm?.interestedProducts || 'Interested Products',
            message: t.inquiryForm?.message || 'Message',
            messagePlaceholder: t.inquiryForm?.messagePlaceholder || 'Tell us about your project...',
            submit: t.inquiryForm?.submit || 'Submit Inquiry',
            submitting: t.inquiryForm?.submitting || 'Submitting...',
            errorNetwork: t.inquiryForm?.errorNetwork || 'Network error. Please try again.',
          }}
          responseInfo={{
            title: t.responseInfo?.title || 'What to Expect',
            items: Object.values(responseItems),
          }}
          countries={t.countries || []}
          productOptions={t.productOptions || []}
          successTitle={t.success?.title || 'Inquiry Submitted'}
          successDesc={t.success?.description || 'Thank you for your inquiry.'}
          successBrowse={t.success?.browseProducts || 'Browse Products'}
          ctaGetQuote={t.cta?.getQuote || 'Get Quote'}
          whatsappTitle={t.whatsappPrompt?.title || 'Prefer to Chat Directly?'}
          whatsappDesc={t.whatsappPrompt?.description || ''}
          whatsappOpen={t.whatsappPrompt?.openChat || 'Open WhatsApp Chat'}
          responseLabel={t.responseInfo?.title || 'What to Expect'}
          homeLabel={tHome.breadcrumb?.home || 'Home'}
          contactLabel={t.breadcrumb?.contact || 'Contact'}
        />
      </section>
    </>
  )
}
