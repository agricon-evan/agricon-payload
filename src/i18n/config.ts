/**
 * Locale metadata and translation lookup.
 *
 * TRANSLATION CONTENT LIVES IN `./locales/<locale>/<namespace>.json` — one file
 * per locale per namespace. This module only declares which locales exist and
 * how a namespace is resolved; it deliberately holds no copy of the strings.
 *
 * Previously the same content existed in three places (a ~840-line inline object
 * here, a second inline `jsonTranslations` object, and a set of JSON files that
 * nothing imported). They drifted — the Arabic `common` strings carried Hebrew
 * text in two of the copies — and the inline object was duplicated into the
 * server bundle regardless of which namespace a page asked for. Adding a
 * namespace now means adding a JSON file, not editing this module.
 */

export const locales = ["en", "ru", "fr", "es", "sw", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  fr: "Français",
  es: "Español",
  sw: "Kiswahili",
  ar: "العربية",
};

export const rtlLocales: Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (locales.includes(segment as Locale)) return segment as Locale;
  return defaultLocale;
}

// ── Namespace registry ──────────────────────────────────────────────────────
// Static imports (not dynamic `import()`) so bundlers can trace and tree-shake
// each namespace JSON individually.

import en_common from './locales/en/common.json'
import en_nav from './locales/en/nav.json'
import en_cta from './locales/en/cta.json'
import en_privacy from './locales/en/privacy.json'
import en_terms from './locales/en/terms.json'
import en_search from './locales/en/search.json'
import en_videos from './locales/en/videos.json'
import en_productDetail from './locales/en/productDetail.json'
import en_blog from './locales/en/blog.json'
import en_pages from './locales/en/pages.json'
import en_contact from './locales/en/contact.json'
import en_distributors from './locales/en/distributors.json'
import en_faq from './locales/en/faq.json'
import en_trade_support from './locales/en/trade-support.json'
import ru_common from './locales/ru/common.json'
import ru_nav from './locales/ru/nav.json'
import ru_cta from './locales/ru/cta.json'
import ru_privacy from './locales/ru/privacy.json'
import ru_terms from './locales/ru/terms.json'
import ru_search from './locales/ru/search.json'
import ru_videos from './locales/ru/videos.json'
import ru_productDetail from './locales/ru/productDetail.json'
import ru_blog from './locales/ru/blog.json'
import ru_pages from './locales/ru/pages.json'
import ru_contact from './locales/ru/contact.json'
import ru_distributors from './locales/ru/distributors.json'
import ru_faq from './locales/ru/faq.json'
import ru_trade_support from './locales/ru/trade-support.json'
import fr_common from './locales/fr/common.json'
import fr_nav from './locales/fr/nav.json'
import fr_cta from './locales/fr/cta.json'
import fr_privacy from './locales/fr/privacy.json'
import fr_terms from './locales/fr/terms.json'
import fr_search from './locales/fr/search.json'
import fr_videos from './locales/fr/videos.json'
import fr_productDetail from './locales/fr/productDetail.json'
import fr_blog from './locales/fr/blog.json'
import fr_pages from './locales/fr/pages.json'
import fr_contact from './locales/fr/contact.json'
import fr_distributors from './locales/fr/distributors.json'
import fr_faq from './locales/fr/faq.json'
import fr_trade_support from './locales/fr/trade-support.json'
import es_common from './locales/es/common.json'
import es_nav from './locales/es/nav.json'
import es_cta from './locales/es/cta.json'
import es_privacy from './locales/es/privacy.json'
import es_terms from './locales/es/terms.json'
import es_search from './locales/es/search.json'
import es_videos from './locales/es/videos.json'
import es_productDetail from './locales/es/productDetail.json'
import es_blog from './locales/es/blog.json'
import es_pages from './locales/es/pages.json'
import es_contact from './locales/es/contact.json'
import es_distributors from './locales/es/distributors.json'
import es_faq from './locales/es/faq.json'
import es_trade_support from './locales/es/trade-support.json'
import sw_common from './locales/sw/common.json'
import sw_nav from './locales/sw/nav.json'
import sw_cta from './locales/sw/cta.json'
import sw_privacy from './locales/sw/privacy.json'
import sw_terms from './locales/sw/terms.json'
import sw_search from './locales/sw/search.json'
import sw_videos from './locales/sw/videos.json'
import sw_productDetail from './locales/sw/productDetail.json'
import sw_blog from './locales/sw/blog.json'
import sw_pages from './locales/sw/pages.json'
import sw_contact from './locales/sw/contact.json'
import sw_distributors from './locales/sw/distributors.json'
import sw_faq from './locales/sw/faq.json'
import sw_trade_support from './locales/sw/trade-support.json'
import ar_common from './locales/ar/common.json'
import ar_nav from './locales/ar/nav.json'
import ar_cta from './locales/ar/cta.json'
import ar_privacy from './locales/ar/privacy.json'
import ar_terms from './locales/ar/terms.json'
import ar_search from './locales/ar/search.json'
import ar_videos from './locales/ar/videos.json'
import ar_productDetail from './locales/ar/productDetail.json'
import ar_blog from './locales/ar/blog.json'
import ar_pages from './locales/ar/pages.json'
import ar_contact from './locales/ar/contact.json'
import ar_distributors from './locales/ar/distributors.json'
import ar_faq from './locales/ar/faq.json'
import ar_trade_support from './locales/ar/trade-support.json'

/**
 * Every namespace file that exists, per locale.
 *
 * All locales carry the same set — the translation pipeline
 * (`scripts/i18n-extract-todo.ts` → `scripts/i18n-apply-todo.ts`) is what keeps
 * them in step, and `tests/int/i18n-parity.int.spec.ts` fails the build when a
 * namespace or key drifts. Historically this table was ragged: `blog` existed
 * only for `fr` and `solutions` only for `sw`, and because no page ever asked for
 * those namespaces the two files were dead weight while French and Swahili
 * visitors still saw English chrome.
 */
export const localeNamespaces: Record<Locale, string[]> = {
  en: ["common","nav","cta","privacy","terms","search","videos","productDetail","blog","pages","contact","distributors","faq","trade-support"],
  ru: ["common","nav","cta","privacy","terms","search","videos","productDetail","blog","pages","contact","distributors","faq","trade-support"],
  fr: ["common","nav","cta","privacy","terms","search","videos","productDetail","blog","pages","contact","distributors","faq","trade-support"],
  es: ["common","nav","cta","privacy","terms","search","videos","productDetail","blog","pages","contact","distributors","faq","trade-support"],
  sw: ["common","nav","cta","privacy","terms","search","videos","productDetail","blog","pages","contact","distributors","faq","trade-support"],
  ar: ["common","nav","cta","privacy","terms","search","videos","productDetail","blog","pages","contact","distributors","faq","trade-support"],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic nested translation data
type NamespaceData = Record<string, any>

const namespaceTable: Record<Locale, Record<string, NamespaceData>> = {
  en: {
    'common': en_common,
    'nav': en_nav,
    'cta': en_cta,
    'privacy': en_privacy,
    'terms': en_terms,
    'search': en_search,
    'videos': en_videos,
    'productDetail': en_productDetail,
    'blog': en_blog,
    'pages': en_pages,
    'contact': en_contact,
    'distributors': en_distributors,
    'faq': en_faq,
    'trade-support': en_trade_support,
  },
  ru: {
    'common': ru_common,
    'nav': ru_nav,
    'cta': ru_cta,
    'privacy': ru_privacy,
    'terms': ru_terms,
    'search': ru_search,
    'videos': ru_videos,
    'productDetail': ru_productDetail,
    'blog': ru_blog,
    'pages': ru_pages,
    'contact': ru_contact,
    'distributors': ru_distributors,
    'faq': ru_faq,
    'trade-support': ru_trade_support,
  },
  fr: {
    'common': fr_common,
    'nav': fr_nav,
    'cta': fr_cta,
    'privacy': fr_privacy,
    'terms': fr_terms,
    'search': fr_search,
    'videos': fr_videos,
    'productDetail': fr_productDetail,
    'blog': fr_blog,
    'pages': fr_pages,
    'contact': fr_contact,
    'distributors': fr_distributors,
    'faq': fr_faq,
    'trade-support': fr_trade_support,
  },
  es: {
    'common': es_common,
    'nav': es_nav,
    'cta': es_cta,
    'privacy': es_privacy,
    'terms': es_terms,
    'search': es_search,
    'videos': es_videos,
    'productDetail': es_productDetail,
    'blog': es_blog,
    'pages': es_pages,
    'contact': es_contact,
    'distributors': es_distributors,
    'faq': es_faq,
    'trade-support': es_trade_support,
  },
  sw: {
    'common': sw_common,
    'nav': sw_nav,
    'cta': sw_cta,
    'privacy': sw_privacy,
    'terms': sw_terms,
    'search': sw_search,
    'videos': sw_videos,
    'productDetail': sw_productDetail,
    'blog': sw_blog,
    'pages': sw_pages,
    'contact': sw_contact,
    'distributors': sw_distributors,
    'faq': sw_faq,
    'trade-support': sw_trade_support,
  },
  ar: {
    'common': ar_common,
    'nav': ar_nav,
    'cta': ar_cta,
    'privacy': ar_privacy,
    'terms': ar_terms,
    'search': ar_search,
    'videos': ar_videos,
    'productDetail': ar_productDetail,
    'blog': ar_blog,
    'pages': ar_pages,
    'contact': ar_contact,
    'distributors': ar_distributors,
    'faq': ar_faq,
    'trade-support': ar_trade_support,
  },
}

/** Deep merge; later sources win. Arrays are replaced, never concatenated. */
function deepMerge(...sources: Array<NamespaceData | undefined>): NamespaceData {
  const out: NamespaceData = {}
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        out[key] = deepMerge(out[key], value)
      } else {
        out[key] = value
      }
    }
  }
  return out
}

/**
 * Resolves a namespace (e.g. `'common'`, `'productDetail'`) for a locale.
 *
 * Resolution order, matching the behaviour this replaces:
 *   English namespace  →  locale namespace
 * so a key missing from a translation falls back to English rather than
 * rendering blank. English is also the merge base, which means a partially
 * translated namespace keeps its English siblings instead of losing them.
 *
 * Two lookup shapes are supported because both are used across the codebase:
 *   getTranslations(locale, 'common').footer.links.contact
 *   getTranslations(locale, 'contact').hero.title
 * A few call sites also read a namespace out of `common` itself
 * (e.g. `common.home`), so that table is checked as a secondary source.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic translation access
export function getTranslations(locale: Locale, namespace: string): Record<string, any> {
  const localeNs = namespaceTable[locale] || {}
  const baseNs = namespaceTable[defaultLocale] || {}

  const direct = deepMerge(baseNs[namespace], localeNs[namespace])
  if (Object.keys(direct).length > 0) return direct

  // Fall back to a namespace nested inside `common` (legacy shape).
  const nestedBase = (baseNs.common || {})[namespace]
  const nestedLocale = (localeNs.common || {})[namespace]
  return deepMerge(nestedBase, nestedLocale)
}

// Flatten a nested translation object into dot-notation keys: { a: { b: 'x' } } -> { 'a.b': 'x' }
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive flattening
export function flattenTranslations(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      Object.assign(result, flattenTranslations(value, path));
    } else {
      result[path] = String(value);
    }
  }
  return result;
}
