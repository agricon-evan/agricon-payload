// Lightweight i18n for CLIENT components only.
// Server components should use the full @/i18n/config.
// This module is intentionally small to keep client bundles lean.

export const uiLocales = ['en', 'ru', 'fr', 'es', 'sw', 'ar'] as const
export type UiLocale = (typeof uiLocales)[number]
export const uiDefaultLocale: UiLocale = 'en'

export const uiLocaleNames: Record<UiLocale, string> = {
  en: 'English',
  ru: 'Русский',
  fr: 'Français',
  es: 'Español',
  sw: 'Kiswahili',
  ar: 'العربية',
}

export const rtlUiLocales: UiLocale[] = ['ar']
export function isRtlUi(locale: UiLocale): boolean {
  return rtlUiLocales.includes(locale)
}

// Minimal UI strings used by client components (Header, Newsletter, etc.)
// Keyed by locale. Falls back to English.
const uiStrings: Record<UiLocale, Record<string, string>> = {
  en: {
    navProducts: 'Products',
    navSolutions: 'Solutions',
    navCaseStudies: 'Case Studies',
    navVideos: 'Videos',
    navAbout: 'About',
    navBlog: 'Blog',
    getQuote: 'Get Quote',
    toggleNav: 'Toggle navigation',
    switchLanguage: 'Switch language',
    newsletterTitle: 'Stay Updated',
    newsletterDesc: 'Industry insights, new equipment launches, and farm tips — straight to your inbox.',
    newsletterPlaceholder: 'Your email address',
    newsletterSubscribe: 'Subscribe',
    newsletterSuccess: 'Thanks for subscribing!',
    newsletterError: 'Please try again.',
    backToHome: 'Back to Home',
  },
  ru: {
    navProducts: 'Продукция',
    navSolutions: 'Решения',
    navCaseStudies: 'Кейсы',
    navVideos: 'Видео',
    navAbout: 'О нас',
    navBlog: 'Блог',
    getQuote: 'Запросить цену',
    toggleNav: 'Переключить навигацию',
    switchLanguage: 'Переключить язык',
    newsletterTitle: 'Будьте в курсе',
    newsletterDesc: 'Отраслевые инсайты, новые продукты и советы — прямо на вашу почту.',
    newsletterPlaceholder: 'Ваш email',
    newsletterSubscribe: 'Подписаться',
    newsletterSuccess: 'Спасибо за подписку!',
    newsletterError: 'Попробуйте ещё раз.',
    backToHome: 'На главную',
  },
  fr: {
    navProducts: 'Produits',
    navSolutions: 'Solutions',
    navCaseStudies: 'Études de cas',
    navVideos: 'Vidéos',
    navAbout: 'À propos',
    navBlog: 'Blog',
    getQuote: 'Demander un devis',
    toggleNav: 'Basculer la navigation',
    switchLanguage: 'Changer de langue',
    newsletterTitle: 'Restez informé',
    newsletterDesc: 'Analyses du secteur, nouveaux équipements et conseils — directement dans votre boîte mail.',
    newsletterPlaceholder: 'Votre adresse e-mail',
    newsletterSubscribe: "S'abonner",
    newsletterSuccess: 'Merci pour votre abonnement !',
    newsletterError: 'Veuillez réessayer.',
    backToHome: "Retour à l'accueil",
  },
  es: {
    navProducts: 'Productos',
    navSolutions: 'Soluciones',
    navCaseStudies: 'Casos de éxito',
    navVideos: 'Videos',
    navAbout: 'Nosotros',
    navBlog: 'Blog',
    getQuote: 'Solicitar cotización',
    toggleNav: 'Alternar navegación',
    switchLanguage: 'Cambiar idioma',
    newsletterTitle: 'Mantente al día',
    newsletterDesc: 'Perspectivas del sector, nuevos equipos y consejos — directo a tu bandeja de entrada.',
    newsletterPlaceholder: 'Tu correo electrónico',
    newsletterSubscribe: 'Suscribirse',
    newsletterSuccess: '¡Gracias por suscribirte!',
    newsletterError: 'Inténtalo de nuevo.',
    backToHome: 'Volver al inicio',
  },
  sw: {
    navProducts: 'Bidhaa',
    navSolutions: 'Suluhisho',
    navCaseStudies: 'Mafunzo ya Kesi',
    navVideos: 'Video',
    navAbout: 'Kuhusu',
    navBlog: 'Blogu',
    getQuote: 'Omba Bei',
    toggleNav: 'Geuza urambazaji',
    switchLanguage: 'Badilisha lugha',
    newsletterTitle: 'Endelea Kufahamishwa',
    newsletterDesc: 'Uchambuzi wa tasnia, vifaa vipya na vidokezo — moja kwa moja kwenye barua pepe yako.',
    newsletterPlaceholder: 'Barua pepe yako',
    newsletterSubscribe: 'Jisajili',
    newsletterSuccess: 'Asante kwa kujisajili!',
    newsletterError: 'Tafadhali jaribu tena.',
    backToHome: 'Rudi Nyumbani',
  },
  ar: {
    navProducts: 'المنتجات',
    navSolutions: 'الحلول',
    navCaseStudies: 'دراسات الحالة',
    navVideos: 'الفيديوهات',
    navAbout: 'من نحن',
    navBlog: 'المدونة',
    getQuote: 'اطلب عرض سعر',
    toggleNav: 'تبديل التنقل',
    switchLanguage: 'تغيير اللغة',
    newsletterTitle: 'ابق على اطلاع',
    newsletterDesc: 'رؤى الصناعة ومعدات جديدة ونصائح — مباشرة إلى بريدك الإلكتروني.',
    newsletterPlaceholder: 'بريدك الإلكتروني',
    newsletterSubscribe: 'اشترك',
    newsletterSuccess: 'شكراً لاشتراكك!',
    newsletterError: 'حاول مرة أخرى.',
    backToHome: 'العودة للرئيسية',
  },
}

export function getUiString(locale: UiLocale, key: string): string {
  return uiStrings[locale]?.[key] || uiStrings[uiDefaultLocale][key] || key
}


// ─────────────────────────────────────────────
// Header needs: full locale list + names + rtl check
// These live here (not in config.ts) so client bundles
// never pull the 64KB translations object.
// ─────────────────────────────────────────────
export const headerLocales = uiLocales
export const headerLocaleNames = uiLocaleNames
export const isRtlLocale = isRtlUi
