/** Homepage section copy, read from the shared `common.home` translations. */
import { getTranslations, type Locale } from '@/i18n/config'

export interface HomeCopy {
  heroStats?: { categories?: string; markets?: string; projects?: string }
  series?: { poultry?: string; livestock?: string; machinery?: string; vehicles?: string }
  categories?: Section
  featured?: Section
  solutions?: Section
  stats?: Section
  value?: Section
  howWeWork?: Section
  whyChooseUs?: Section
  trust?: Section
  coverage?: Section
  testimonials?: Section & { starRating?: string }
  news?: Section
  finalCta?: Section & { primary?: string; secondary?: string }
  newsletter?: Section & { chips?: { product?: string; insights?: string; export?: string } }
}

export interface Section {
  eyebrow?: string
  /** First half of a two-tone heading (`<span className="split-accent">` gets the accent half). */
  titleLead?: string
  titleAccent?: string
  /** Optional tail after the accented half. */
  titleTail?: string
  description?: string
}

/**
 * The homepage sections used to hardcode their eyebrows, headings and
 * descriptions in English, so a fully translated `common.json` still produced an
 * English homepage in five of six languages. All of it now lives under
 * `common.home.*` (see src/i18n/locales/<locale>/common.json) with the English
 * text kept here as the fallback.
 */
export function homeCopy(locale: string): HomeCopy {
  return (getTranslations(locale as Locale, 'common').home ?? {}) as HomeCopy
}
