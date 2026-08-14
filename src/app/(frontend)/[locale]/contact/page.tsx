import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import { getSiteSettings, getCountries, getProducts } from '@/lib/payload'
import ContactForm from '@/components/ContactForm'
import MediaImage from '@/components/ui/MediaImage'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ product?: string }>
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { product: productSlug } = await searchParams
  const t = getTranslations(locale as Locale, 'contact')
  const tHome = getTranslations(locale as Locale, 'home')
  const settings = await getSiteSettings()
  const dbCountries = await getCountries()

  // 产品详情页的 “Request Quote” 带 ?product=slug — 解析成产品名并预选到询盘表单
  let initialProduct: string | undefined
  if (productSlug) {
    const products = await getProducts(locale as Locale)
    const match = products.find((p) => p.slug === productSlug)
    initialProduct = match?.name || productSlug
  }

  // Countries come from the CMS Countries collection (single source of truth),
  // falling back to the bundled i18n list while the admin list is empty.
  const countryNames = dbCountries.map((c) => c.name).filter(Boolean)
  const countries =
    countryNames.length > 0
      ? (countryNames.includes('Other') ? countryNames : [...countryNames, 'Other'])
      : (t.countries || [])

  const methods = (t.contactMethods || {}) as Record<string, { title: string; description: string }>
  const responseItems = (t.responseInfo?.items ?? {}) as Record<string, { title: string; description: string }>

  // Override contact methods with real data from SiteSettings (from company catalog)
  const realMethods = {
    email: { title: methods.email?.title || 'Email', description: settings?.contactEmail || methods.email?.description || '' },
    phone: { title: methods.phone?.title || 'Phone', description: settings?.contactPhone || methods.phone?.description || '' },
    whatsapp: { title: methods.whatsapp?.title || 'WhatsApp', description: settings?.whatsappNumber || methods.whatsapp?.description || '' },
  }

  return (
    <>
      <section className="hero-standard relative overflow-hidden bg-[var(--color-primary-dark)] text-white px-6">
        <MediaImage src="/images/heroes/farm-landscape.jpg" alt="Agricon customer support" width={1600} height={700} priority className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 photo-overlay-green" />
        <div className="hero-standard-content relative max-w-7xl mx-auto py-12 md:py-20">
          <div className="eyebrow !text-[var(--color-accent-soft)] mb-3">Agricon</div>
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
          contactMethods={realMethods}
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
          countries={countries}
          productOptions={t.productOptions || []}
          initialProduct={initialProduct}
          successTitle={t.success?.title || 'Inquiry Submitted'}
          successDesc={t.success?.description || 'Thank you for your inquiry.'}
          successBrowse={t.success?.browseProducts || 'Browse Products'}
          whatsappTitle={t.whatsappPrompt?.title || 'Prefer to Chat Directly?'}
          whatsappDesc={t.whatsappPrompt?.description || ''}
          whatsappOpen={t.whatsappPrompt?.openChat || 'Open WhatsApp Chat'}
          responseLabel={t.responseInfo?.title || 'What to Expect'}
          whatsappNumber={settings?.whatsappNumber || ''}
        />
      </section>
    </>
  )
}
