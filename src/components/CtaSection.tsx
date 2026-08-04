import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'

interface Props {
  locale: Locale
}

export default function CtaSection({ locale }: Props) {
  const t = getTranslations(locale, 'productDetail')

  return (
    <section className="bg-[var(--color-primary)] text-white py-16 md:py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <Reveal>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
            {t.finalCtaTitle || 'Ready to Modernize Your Farm?'}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-4 text-base md:text-lg opacity-85 leading-relaxed max-w-xl mx-auto">
            {t.finalCtaDescription || 'Get a customized quotation including shipping to your port.'}
          </p>
        </Reveal>
        <Reveal delay={200}>
          <a
            href={`/${locale}/contact`}
            className="inline-flex items-center justify-center gap-2 mt-8 px-10 py-4 bg-[var(--color-accent)] text-white font-semibold rounded-md min-h-[52px] press tap-target text-lg transition-colors hover:brightness-110"
          >
            {t.finalCtaButton || 'Request a Quote'}
            <Icon name="arrow-right" size={18} />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
