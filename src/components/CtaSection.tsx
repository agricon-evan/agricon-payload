import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'

interface Props {
  locale: Locale
  /** Optional overrides — fall back to the `productDetail` translation block */
  title?: string
  description?: string
  buttonLabel?: string
}

export default function CtaSection({ locale, title, description, buttonLabel }: Props) {
  const t = getTranslations(locale, 'productDetail')

  const ctaTitle = title || t.finalCtaTitle || 'Ready to Modernize Your Farm?'
  const ctaDescription = description || t.finalCtaDescription || 'Get a customized quotation including shipping to your port.'
  const ctaButton = buttonLabel || t.finalCtaButton || 'Request a Quote'

  return (
    <section className="relative bg-[var(--color-surface-brand)] text-white py-20 md:py-24 px-6">
      <div className="relative max-w-3xl mx-auto text-center">
        <Reveal>
          <h2 className="split-color-title text-2xl md:text-4xl font-bold tracking-[-0.015em] text-white">
            {ctaTitle}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-4 text-base md:text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            {ctaDescription}
          </p>
        </Reveal>
        <Reveal delay={200}>
          <a
            href={`/${locale}/contact`}
            className="inline-flex items-center justify-center gap-2 mt-8 px-10 py-4 bg-white text-[var(--color-primary)] font-semibold rounded-sm min-h-[52px] press tap-target text-lg transition-all hover:bg-white/90"
          >
            {ctaButton}
            <Icon name="arrow-right" size={18} className="text-[var(--color-accent)]" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
