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

export function localizedPath(p: string, locale: Locale): string {
  if (locale === defaultLocale) return p;
  return `/${locale}${p}`;
}

// Inline translations to avoid Node.js dependencies
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic nested translation structure
const translations: Record<Locale, Record<string, any>> = {
  en: {
    common: {
      nav: {
        products: "Products",
        solutions: "Solutions",
        tradeSupport: "Trade Support",
        caseStudies: "Case Studies",
        videos: "Videos",
        blog: "Blog",
        about: "About",
      },
      cta: {
        getQuote: "Get Quote",
        chatWhatsApp: "Chat on WhatsApp",
      },
      footer: {
        brandDescription: "Poultry & Livestock Equipment Solutions. Durable, export-ready equipment for commercial farms worldwide.",
        email: "",
        phone: "",
        copyright: "Agricon. Poultry & Livestock Equipment Solutions.",
        columns: {
          products: "Products",
          solutions: "Solutions",
          company: "Company",
          support: "Support",
        },
        links: {
          poultrySolutions: "Poultry Solutions",
          livestockSolutions: "Livestock Solutions",
          feedProcessing: "Feed Processing",
          farmInfrastructure: "Farm Infrastructure",
          viewAllProducts: "View All Products",
          poultryFarmSetup: "Poultry Farm Setup",
          livestockFarmSetup: "Livestock Farm Setup",
          feedProcessingSetup: "Feed Processing Setup",
          tradeSupport: "Trade Support",
          aboutAgricon: "About Agricon",
          caseStudies: "Case Studies",
          videos: "Videos",
          blog: "Blog",
          distributors: "Distributors",
          contact: "Contact",
          faq: "FAQ",
          technicalSupport: "Technical Support",
          privacyPolicy: "Privacy Policy",
          termsOfService: "Terms of Service",
        },
      },
      home: {
        breadcrumb: {
          home: "Home",
        },
      },
      aria: {
        toggleNavigation: "Toggle navigation",
        switchToLightMode: "Switch to light mode",
        switchToDarkMode: "Switch to dark mode",
        backToTop: "Back to top",
        chatOnWhatsApp: "Chat on WhatsApp",
        switchLanguage: "Switch language",
      },
      meta: {
        siteTitle: "Agricon - Poultry & Livestock Equipment Solutions",
        siteDescription: "Poultry & Livestock Equipment Solutions",
      },
    },
    privacy: {
      breadcrumb: { home: "Home", privacy: "Privacy Policy" },
      hero: { title: "Privacy Policy", description: "How we collect, use, and protect your data." },
      lastUpdated: "Last updated: January 1, 2026",
    },
    terms: {
      breadcrumb: { home: "Home", terms: "Terms of Service" },
      hero: { title: "Terms of Service", description: "Terms governing use of the Agricon website and services." },
      lastUpdated: "Last updated: January 1, 2026",
    },
    search: {
      breadcrumb: { home: "Home", search: "Search" },
      hero: { title: "Search", description: "Search Agricon products, solutions, and resources." },
      placeholder: "Search products, solutions, and resources...",
    },
    videos: {
      breadcrumb: { home: "Home", videos: "Videos" },
      hero: {
        title: "Video Library",
        description: "See Agricon equipment in action — installation walkthroughs, farm projects, product demonstrations and manufacturing insights.",
      },
      watchOnYoutube: "Watch on YouTube",
      watchOnTiktok: "Watch on TikTok",
      noVideos: "Videos are being prepared. Please check back soon or contact us for a product demonstration.",
      ctaTitle: "Want a Live Demonstration?",
      ctaDescription: "Contact our team to arrange a live video call or send you recorded demonstrations of specific equipment.",
      ctaButton: "Request a Demo",
    },
    productDetail: {
      breadcrumb: { home: "Home", products: "Products" },
      tabs: { overview: "Overview", specifications: "Specifications", downloads: "Downloads" },
      featured: "Featured",
      tradeInfo: {
        minimumOrder: "Minimum Order",
        leadTime: "Lead Time",
        paymentTerms: "Payment Terms",
        shippingPort: "Shipping Port",
        packaging: "Packaging",
        certification: "Certification",
      },
      keySpecifications: "Key Specifications",
      requestQuote: "Request Quote",
      whatsapp: "WhatsApp",
      tradeInformation: "Trade Information",
      paybackPeriod: "Payback Period",
      noOverview: "No overview available for this product.",
      technicalSpecifications: "Technical Specifications",
      parameter: "Parameter",
      specification: "Specification",
      downloadsResources: "Downloads & Resources",
      fileType: "File",
      relatedCaseStudies: "Related Case Studies",
      readFullCaseStudy: "Read Full Case Study →",
      relatedProducts: "Related Products",
      finalCtaTitle: "Ready to Modernize Your Farm?",
      finalCtaDescription: "Get a customized quotation including shipping to your port. Our engineers will help you design the optimal layout for your facility.",
      finalCtaButton: "Request a Quote",
      finalCtaWhatsapp: "Chat on WhatsApp",
      product: "Product",
      contactForPrice: "Contact for price",
    },
  },
  ru: {
    common: {
      nav: {
        products: "Продукция",
        solutions: "Решения",
        tradeSupport: "Торговая поддержка",
        caseStudies: "Кейсы",
        videos: "Видео",
        blog: "Блог",
        about: "О нас",
      },
      cta: {
        getQuote: "Запросить цену",
        chatWhatsApp: "Написать в WhatsApp",
      },
      footer: {
        brandDescription: "Оборудование для птицеводства и животноводства. Надёжное оборудование для коммерческих ферм по всему миру.",
        email: "",
        phone: "",
        copyright: "Agricon. Оборудование для птицеводства и животноводства.",
        columns: {
          products: "Продукция",
          solutions: "Решения",
          company: "Компания",
          support: "Поддержка",
        },
        links: {
          poultrySolutions: "Птицеводство",
          livestockSolutions: "Животноводство",
          feedProcessing: "Производство кормов",
          farmInfrastructure: "Инфраструктура ферм",
          viewAllProducts: "Вся продукция",
          poultryFarmSetup: "Оборудование для птицефабрик",
          livestockFarmSetup: "Оборудование для ферм",
          feedProcessingSetup: "Линии по производству кормов",
          tradeSupport: "Торговая поддержка",
          aboutAgricon: "О компании Agricon",
          caseStudies: "Кейсы",
          videos: "Видео",
          blog: "Блог",
          distributors: "Дистрибьюторы",
          contact: "Контакты",
          faq: "Вопросы и ответы",
          technicalSupport: "Техническая поддержка",
          privacyPolicy: "Политика конфиденциальности",
          termsOfService: "Условия использования",
        },
      },
      home: {
        breadcrumb: {
          home: "Главная",
        },
      },
      aria: {
        toggleNavigation: "Переключить навигацию",
        switchToLightMode: "Переключиться на светлую тему",
        switchToDarkMode: "Переключиться на тёмную тему",
        backToTop: "Наверх",
        chatOnWhatsApp: "Чат в WhatsApp",
        switchLanguage: "Переключить язык",
      },
      meta: {
        siteTitle: "Agricon - Оборудование для птицеводства и животноводства",
        siteDescription: "Оборудование для птицеводства и животноводства",
      },
    },
    privacy: {
      breadcrumb: { home: "Главная", privacy: "Политика конфиденциальности" },
      hero: { title: "Политика конфиденциальности", description: "Как мы собираем, используем и защищаем ваши данные." },
      lastUpdated: "Последнее обновление: 1 января 2026 г.",
    },
    terms: {
      breadcrumb: { home: "Главная", terms: "Условия использования" },
      hero: { title: "Условия использования", description: "Условия использования сайта и услуг Agricon." },
      lastUpdated: "Последнее обновление: 1 января 2026 г.",
    },
    search: {
      breadcrumb: { home: "Главная", search: "Поиск" },
      hero: { title: "Поиск", description: "Поиск продуктов, решений и ресурсов Agricon." },
      placeholder: "Поиск продуктов, решений и ресурсов...",
    },
    videos: {
      breadcrumb: { home: "Главная", videos: "Видео" },
      hero: {
        title: "Видеотека",
        description: "Оборудование Agricon в действии — монтаж, фермерские проекты, демонстрации продукции и производство.",
      },
      watchOnYoutube: "Смотреть на YouTube",
      watchOnTiktok: "Смотреть в TikTok",
      noVideos: "Видео готовятся. Загляните позже или свяжитесь с нами для демонстрации продукции.",
      ctaTitle: "Нужна живая демонстрация?",
      ctaDescription: "Свяжитесь с нашей командой, чтобы организовать видеозвонок или записанные демонстрации оборудования.",
      ctaButton: "Запросить демонстрацию",
    },
    productDetail: {
      breadcrumb: { home: "Главная", products: "Продукция" },
      tabs: { overview: "Обзор", specifications: "Характеристики", downloads: "Загрузки" },
      featured: "Рекомендуемый",
      tradeInfo: {
        minimumOrder: "Минимальный заказ",
        leadTime: "Срок изготовления",
        paymentTerms: "Условия оплаты",
        shippingPort: "Порт отгрузки",
        packaging: "Упаковка",
        certification: "Сертификация",
      },
      keySpecifications: "Ключевые характеристики",
      requestQuote: "Запросить цену",
      whatsapp: "WhatsApp",
      tradeInformation: "Торговая информация",
      paybackPeriod: "Срок окупаемости",
      noOverview: "Обзор для этого продукта недоступен.",
      technicalSpecifications: "Технические характеристики",
      parameter: "Параметр",
      specification: "Значение",
      downloadsResources: "Загрузки и материалы",
      fileType: "Файл",
      relatedCaseStudies: "Похожие кейсы",
      readFullCaseStudy: "Читать полностью →",
      relatedProducts: "Похожие продукты",
      finalCtaTitle: "Готовы модернизировать вашу ферму?",
      finalCtaDescription: "Получите индивидуальную смету с доставкой в ваш порт. Наши инженеры помогут спроектировать оптимальную планировку.",
      finalCtaButton: "Запросить предложение",
      finalCtaWhatsapp: "Написать в WhatsApp",
      product: "Продукт",
      contactForPrice: "Цена по запросу",
    },
  },
  fr: {
    common: {
      nav: {
        products: "Produits",
        solutions: "Solutions",
        tradeSupport: "Support commercial",
        caseStudies: "Études de cas",
        videos: "Vidéos",
        blog: "Blog",
        about: "À propos",
      },
      cta: {
        getQuote: "Demander un devis",
        chatWhatsApp: "Chatter sur WhatsApp",
      },
      footer: {
        brandDescription: "Solutions d'équipements avicoles et d'élevage. Équipement durable prêt à l'export pour les fermes commerciales du monde entier.",
        email: "",
        phone: "",
        copyright: "Agricon. Solutions d'équipements avicoles et d'élevage.",
        columns: {
          products: "Produits",
          solutions: "Solutions",
          company: "Entreprise",
          support: "Support",
        },
        links: {
          poultrySolutions: "Solutions avicoles",
          livestockSolutions: "Solutions élevage",
          feedProcessing: "Production d'aliments",
          farmInfrastructure: "Infrastructure agricole",
          viewAllProducts: "Tous les produits",
          poultryFarmSetup: "Installation avicole",
          livestockFarmSetup: "Installation élevage",
          feedProcessingSetup: "Ligne de production d'aliments",
          tradeSupport: "Support commercial",
          aboutAgricon: "À propos d'Agricon",
          caseStudies: "Études de cas",
          videos: "Vidéos",
          blog: "Blog",
          distributors: "Distributeurs",
          contact: "Contact",
          faq: "FAQ",
          technicalSupport: "Support technique",
          privacyPolicy: "Confidentialité",
          termsOfService: "Conditions",
        },
      },
      home: {
        breadcrumb: {
          home: "Accueil",
        },
      },
      aria: {
        toggleNavigation: "Basculer la navigation",
        switchToLightMode: "Passer au mode clair",
        switchToDarkMode: "Passer au mode sombre",
        backToTop: "Retour en haut",
        chatOnWhatsApp: "Chatter sur WhatsApp",
        switchLanguage: "Changer de langue",
      },
      meta: {
        siteTitle: "Agricon - Solutions d'équipements avicoles et d'élevage",
        siteDescription: "Solutions d'équipements avicoles et d'élevage",
      },
    },
    privacy: {
      breadcrumb: { home: "Accueil", privacy: "Politique de confidentialité" },
      hero: { title: "Politique de confidentialité", description: "Comment nous collectons, utilisons et protégeons vos données." },
      lastUpdated: "Dernière mise à jour : 1er janvier 2026",
    },
    terms: {
      breadcrumb: { home: "Accueil", terms: "Conditions d'utilisation" },
      hero: { title: "Conditions d'utilisation", description: "Conditions régissant l'utilisation du site Web et des services d'Agricon." },
      lastUpdated: "Dernière mise à jour : 1er janvier 2026",
    },
    search: {
      breadcrumb: { home: "Accueil", search: "Rechercher" },
      hero: { title: "Rechercher", description: "Recherchez des produits, solutions et ressources Agricon." },
      placeholder: "Rechercher des produits, solutions et ressources...",
    },
    videos: {
      breadcrumb: { home: "Accueil", videos: "Vidéos" },
      hero: {
        title: "Vidéothèque",
        description: "Voyez l'équipement Agricon en action — installations, projets agricoles, démonstrations produits et fabrication.",
      },
      watchOnYoutube: "Regarder sur YouTube",
      watchOnTiktok: "Regarder sur TikTok",
      noVideos: "Les vidéos sont en préparation. Revenez bientôt ou contactez-nous pour une démonstration.",
      ctaTitle: "Besoin d'une démonstration en direct ?",
      ctaDescription: "Contactez notre équipe pour organiser un appel vidéo ou des démonstrations enregistrées d'équipements spécifiques.",
      ctaButton: "Demander une démo",
    },
    productDetail: {
      breadcrumb: { home: "Accueil", products: "Produits" },
      tabs: { overview: "Aperçu", specifications: "Spécifications", downloads: "Téléchargements" },
      featured: "En vedette",
      tradeInfo: {
        minimumOrder: "Commande minimum",
        leadTime: "Délai de livraison",
        paymentTerms: "Conditions de paiement",
        shippingPort: "Port d'expédition",
        packaging: "Emballage",
        certification: "Certification",
      },
      keySpecifications: "Spécifications clés",
      requestQuote: "Demander un devis",
      whatsapp: "WhatsApp",
      tradeInformation: "Informations commerciales",
      paybackPeriod: "Période de récupération",
      noOverview: "Aucun aperçu disponible pour ce produit.",
      technicalSpecifications: "Spécifications techniques",
      parameter: "Paramètre",
      specification: "Spécification",
      downloadsResources: "Téléchargements et ressources",
      fileType: "Fichier",
      relatedCaseStudies: "Études de cas connexes",
      readFullCaseStudy: "Lire l'étude complète →",
      relatedProducts: "Produits connexes",
      finalCtaTitle: "Prêt à moderniser votre ferme ?",
      finalCtaDescription: "Obtenez un devis personnalisé incluant la livraison à votre port. Nos ingénieurs vous aideront à concevoir l'aménagement optimal.",
      finalCtaButton: "Demander un devis",
      finalCtaWhatsapp: "Chatter sur WhatsApp",
      product: "Produit",
      contactForPrice: "Contacter pour le prix",
    },
  },
  es: {
    common: {
      nav: {
        products: "Productos",
        solutions: "Soluciones",
        tradeSupport: "Soporte comercial",
        caseStudies: "Casos de éxito",
        videos: "Videos",
        blog: "Blog",
        about: "Nosotros",
      },
      cta: {
        getQuote: "Solicitar cotización",
        chatWhatsApp: "Chatear por WhatsApp",
      },
      footer: {
        brandDescription: "Soluciones de equipos avícolas y ganaderos. Equipos duraderos listos para exportación para granjas comerciales en todo el mundo.",
        email: "",
        phone: "",
        copyright: "Agricon. Soluciones de equipos avícolas y ganaderos.",
        columns: {
          products: "Productos",
          solutions: "Soluciones",
          company: "Empresa",
          support: "Soporte",
        },
        links: {
          poultrySolutions: "Soluciones avícolas",
          livestockSolutions: "Soluciones ganaderas",
          feedProcessing: "Procesamiento de alimentos",
          farmInfrastructure: "Infraestructura agrícola",
          viewAllProducts: "Ver todos los productos",
          poultryFarmSetup: "Instalación avícola",
          livestockFarmSetup: "Instalación ganadera",
          feedProcessingSetup: "Línea de producción de alimentos",
          tradeSupport: "Soporte comercial",
          aboutAgricon: "Sobre Agricon",
          caseStudies: "Casos de éxito",
          videos: "Videos",
          blog: "Blog",
          distributors: "Distribuidores",
          contact: "Contacto",
          faq: "FAQ",
          technicalSupport: "Soporte técnico",
          privacyPolicy: "Privacidad",
          termsOfService: "Términos",
        },
      },
      home: {
        breadcrumb: {
          home: "Inicio",
        },
      },
      aria: {
        toggleNavigation: "Alternar navegación",
        switchToLightMode: "Cambiar a modo claro",
        switchToDarkMode: "Cambiar a modo oscuro",
        backToTop: "Volver arriba",
        chatOnWhatsApp: "Chatear por WhatsApp",
        switchLanguage: "Cambiar idioma",
      },
      meta: {
        siteTitle: "Agricon - Soluciones de equipos avícolas y ganaderos",
        siteDescription: "Soluciones de equipos avícolas y ganaderos",
      },
    },
    privacy: {
      breadcrumb: { home: "Inicio", privacy: "Política de privacidad" },
      hero: { title: "Política de privacidad", description: "Cómo recopilamos, usamos y protegemos sus datos." },
      lastUpdated: "Última actualización: 1 de enero de 2026",
    },
    terms: {
      breadcrumb: { home: "Inicio", terms: "Términos de servicio" },
      hero: { title: "Términos de servicio", description: "Condiciones que rigen el uso del sitio web y los servicios de Agricon." },
      lastUpdated: "Última actualización: 1 de enero de 2026",
    },
    search: {
      breadcrumb: { home: "Inicio", search: "Buscar" },
      hero: { title: "Buscar", description: "Busque productos, soluciones y recursos de Agricon." },
      placeholder: "Buscar productos, soluciones y recursos...",
    },
    videos: {
      breadcrumb: { home: "Inicio", videos: "Videos" },
      hero: {
        title: "Videoteca",
        description: "Vea el equipo Agricon en acción — instalaciones, proyectos agrícolas, demostraciones de productos y fabricación.",
      },
      watchOnYoutube: "Ver en YouTube",
      watchOnTiktok: "Ver en TikTok",
      noVideos: "Los videos están en preparación. Vuelva pronto o contáctenos para una demostración.",
      ctaTitle: "¿Necesita una demostración en vivo?",
      ctaDescription: "Contáctenos para organizar una videollamada o enviarle demostraciones grabadas de equipos específicos.",
      ctaButton: "Solicitar una demo",
    },
    productDetail: {
      breadcrumb: { home: "Inicio", products: "Productos" },
      tabs: { overview: "Resumen", specifications: "Especificaciones", downloads: "Descargas" },
      featured: "Destacado",
      tradeInfo: {
        minimumOrder: "Pedido mínimo",
        leadTime: "Plazo de entrega",
        paymentTerms: "Condiciones de pago",
        shippingPort: "Puerto de envío",
        packaging: "Embalaje",
        certification: "Certificación",
      },
      keySpecifications: "Especificaciones clave",
      requestQuote: "Solicitar cotización",
      whatsapp: "WhatsApp",
      tradeInformation: "Información comercial",
      paybackPeriod: "Período de recuperación",
      noOverview: "No hay descripción disponible para este producto.",
      technicalSpecifications: "Especificaciones técnicas",
      parameter: "Parámetro",
      specification: "Especificación",
      downloadsResources: "Descargas y recursos",
      fileType: "Archivo",
      relatedCaseStudies: "Casos de éxito relacionados",
      readFullCaseStudy: "Leer caso completo →",
      relatedProducts: "Productos relacionados",
      finalCtaTitle: "¿Listo para modernizar su granja?",
      finalCtaDescription: "Obtenga una cotización personalizada con envío a su puerto. Nuestros ingenieros le ayudarán a diseñar la distribución óptima.",
      finalCtaButton: "Solicitar cotización",
      finalCtaWhatsapp: "Chatear por WhatsApp",
      product: "Producto",
      contactForPrice: "Consultar precio",
    },
  },
  sw: {
    common: {
      nav: {
        products: "Bidhaa",
        solutions: "Suluhisho",
        tradeSupport: "Msaada wa Biashara",
        caseStudies: "Mafunzo ya Kesi",
        videos: "Video",
        blog: "Blogu",
        about: "Kuhusu",
      },
      cta: {
        getQuote: "Omba Bei",
        chatWhatsApp: "Ongea kwenye WhatsApp",
      },
      footer: {
        brandDescription: "Suluhisho za vifaa vya ufugaji wa kuku na mifugo. Vifaa vya kudumu vinavyoweza kusafirishwa kwa mashamba ya kibiashara duniani kote.",
        email: "",
        phone: "",
        copyright: "Agricon. Suluhisho za vifaa vya ufugaji wa kuku na mifugo.",
        columns: {
          products: "Bidhaa",
          solutions: "Suluhisho",
          company: "Kampuni",
          support: "Usaidizi",
        },
        links: {
          poultrySolutions: "Suluhisho za Kuku",
          livestockSolutions: "Suluhisho za Mifugo",
          feedProcessing: "Uzalishaji wa Chakula",
          farmInfrastructure: "Miundombinu ya Shamba",
          viewAllProducts: "Bidhaa Zote",
          poultryFarmSetup: "Uanzishaji wa Shamba la Kuku",
          livestockFarmSetup: "Uanzishaji wa Shamba la Mifugo",
          feedProcessingSetup: "Kiwanda cha Chakula",
          tradeSupport: "Msaada wa Biashara",
          aboutAgricon: "Kuhusu Agricon",
          caseStudies: "Mafunzo ya Kesi",
          videos: "Video",
          blog: "Blogu",
          distributors: "Wasambazaji",
          contact: "Wasiliana",
          faq: "Maswali Yanayoulizwa Mara kwa Mara",
          technicalSupport: "Usaidizi wa Kiufundi",
          privacyPolicy: "Sera ya Faragha",
          termsOfService: "Masharti ya Huduma",
        },
      },
      home: {
        breadcrumb: {
          home: "Nyumbani",
        },
      },
      aria: {
        toggleNavigation: "Geuza urambazaji",
        switchToLightMode: "Badilisha hadi mwonekano mwepesi",
        switchToDarkMode: "Badilisha hadi mwonekano mweusi",
        backToTop: "Rudi juu",
        chatOnWhatsApp: "Ongea kwenye WhatsApp",
        switchLanguage: "Badilisha lugha",
      },
      meta: {
        siteTitle: "Agricon - Suluhisho za vifaa vya ufugaji wa kuku na mifugo",
        siteDescription: "Suluhisho za vifaa vya ufugaji wa kuku na mifugo",
      },
    },
    privacy: {
      breadcrumb: { home: "Nyumbani", privacy: "Sera ya Faragha" },
      hero: { title: "Sera ya Faragha", description: "Jinsi tunavyokusanya, kutumia, na kulinda data yako." },
      lastUpdated: "Imesasishwa mwisho: Januari 1, 2026",
    },
    terms: {
      breadcrumb: { home: "Nyumbani", terms: "Masharti ya Huduma" },
      hero: { title: "Masharti ya Huduma", description: "Masharti yanayosimamia matumizi ya tovuti na huduma za Agricon." },
      lastUpdated: "Imesasishwa mwisho: Januari 1, 2026",
    },
    search: {
      breadcrumb: { home: "Nyumbani", search: "Tafuta" },
      hero: { title: "Tafuta", description: "Tafuta bidhaa, suluhisho, na rasilimali za Agricon." },
      placeholder: "Tafuta bidhaa, suluhisho, na rasilimali...",
    },
    videos: {
      breadcrumb: { home: "Nyumbani", videos: "Video" },
      hero: {
        title: "Maktaba ya Video",
        description: "Ona vifaa vya Agricon vikifanya kazi — miongozo ya ufungaji, miradi ya shambani, maonyesho ya bidhaa na utengenezaji.",
      },
      watchOnYoutube: "Tazama kwenye YouTube",
      watchOnTiktok: "Tazama kwenye TikTok",
      noVideos: "Video zinaandaliwa. Tafadhali rudi baadaye au wasiliana nasi kwa maonyesho ya bidhaa.",
      ctaTitle: "Unahitaji Maonyesho ya Moja kwa Moja?",
      ctaDescription: "Wasiliana na timu yetu kupanga simu ya video au kutuma maonyesho yaliyorekodiwa ya vifaa maalum.",
      ctaButton: "Omba Maonyesho",
    },
    productDetail: {
      breadcrumb: { home: "Nyumbani", products: "Bidhaa" },
      tabs: { overview: "Maelezo", specifications: "Vipimo", downloads: "Vipakuliwa" },
      featured: "Iliyopendekezwa",
      tradeInfo: {
        minimumOrder: "Agizo la Chini",
        leadTime: "Muda wa Uzalishaji",
        paymentTerms: "Masharti ya Malipo",
        shippingPort: "Bandari ya Usafirishaji",
        packaging: "Ufungashaji",
        certification: "Uthibitisho",
      },
      keySpecifications: "Vipimo Muhimu",
      requestQuote: "Omba Bei",
      whatsapp: "WhatsApp",
      tradeInformation: "Taarifa za Biashara",
      paybackPeriod: "Kipindi cha Kurejesha",
      noOverview: "Hakuna maelezo yanayopatikana kwa bidhaa hii.",
      technicalSpecifications: "Vipimo vya Kiufundi",
      parameter: "Kigezo",
      specification: "Kipimo",
      downloadsResources: "Vipakuliwa na Nyenzo",
      fileType: "Faili",
      relatedCaseStudies: "Mafunzo ya Kesi Yanayohusiana",
      readFullCaseStudy: "Soma Mafunzo Kamili →",
      relatedProducts: "Bidhaa Zinazohusiana",
      finalCtaTitle: "Uko Tayari Kuboresha Shamba Lako?",
      finalCtaDescription: "Pata bei maalum ikijumuisha usafirishaji hadi bandari yako. Wahandisi wetu watakusaidia kubuni mpangilio bora wa kituo chako.",
      finalCtaButton: "Omba Bei",
      finalCtaWhatsapp: "Ongea kwenye WhatsApp",
      product: "Bidhaa",
      contactForPrice: "Wasiliana kwa bei",
    },
  },
  ar: {
    common: {
      nav: {
        products: "المنتجات",
        solutions: "الحلول",
        tradeSupport: "دعم التجارة",
        caseStudies: "دراسات الحالة",
        videos: "الفيديوهات",
        blog: "المدونة",
        about: "من نحن",
      },
      cta: {
        getQuote: "اطلب عرض سعر",
        chatWhatsApp: "تحدث عبر واتساب",
      },
      footer: {
        brandDescription: "حلول معدات الدواجن والثروة الحيوانية. معدات متينة جاهزة للتصدير للمزارع التجارية حول العالم.",
        email: "",
        phone: "",
        copyright: "Agricon. حلول معدات الدواجن والثروة الحيوانية.",
        columns: {
          products: "المنتجات",
          solutions: "الحلول",
          company: "الشركة",
          support: "الدعم",
        },
        links: {
          poultrySolutions: "حلول الدواجن",
          livestockSolutions: "حلول الثروة الحيوانية",
          feedProcessing: "تصنيع الأعلاف",
          farmInfrastructure: "البنية التحتية للمزرعة",
          viewAllProducts: "جميع المنتجات",
          poultryFarmSetup: "إنشاء مزرعة دواجن",
          livestockFarmSetup: "إنشاء مزرعة مواشي",
          feedProcessingSetup: "خط إنتاج الأعلاف",
          tradeSupport: "دعم التجارة",
          aboutAgricon: "عن Agricon",
          caseStudies: "دراسات الحالة",
          videos: "الفيديوهات",
          blog: "المدونة",
          distributors: "الموزعون",
          contact: "اتصل بنا",
          faq: "الأسئلة الشائعة",
          technicalSupport: "الدعم الفني",
          privacyPolicy: "سياسة الخصوصية",
          termsOfService: "شروط الخدمة",
        },
      },
      home: {
        breadcrumb: {
          home: "الرئيسية",
        },
      },
      aria: {
        toggleNavigation: "تبديل التنقل",
        switchToLightMode: "التبديل إلى الوضع الفاتح",
        switchToDarkMode: "التبديل إلى الوضع الداكن",
        backToTop: "العودة للأعلى",
        chatOnWhatsApp: "تحدث عبر واتساب",
        switchLanguage: "تغيير اللغة",
      },
      meta: {
        siteTitle: "Agricon - حلول معدات الدواجن والثروة الحيوانية",
        siteDescription: "حلول معدات الدواجن والثروة الحيوانية",
      },
    },
    privacy: {
      breadcrumb: { home: "الرئيسية", privacy: "سياسة الخصوصية" },
      hero: { title: "سياسة الخصوصية", description: "كيف نجمع بياناتك ونستخدمها ونحميها." },
      lastUpdated: "آخر تحديث: 1 يناير 2026",
    },
    terms: {
      breadcrumb: { home: "الرئيسية", terms: "شروط الخدمة" },
      hero: { title: "شروط الخدمة", description: "الشروط التي تحكم استخدام موقع وخدمات Agricon." },
      lastUpdated: "آخر تحديث: 1 يناير 2026",
    },
    search: {
      breadcrumb: { home: "الرئيسية", search: "بحث" },
      hero: { title: "بحث", description: "ابحث عن منتجات وحلول وموارد Agricon." },
      placeholder: "ابحث عن المنتجات والحلول والموارد...",
    },
    videos: {
      breadcrumb: { home: "الرئيسية", videos: "الفيديوهات" },
      hero: {
        title: "مكتبة الفيديو",
        description: "شاهد معدات Agricon أثناء العمل — أدلة التركيب، مشاريع المزارع، عروض المنتجات والتصنيع.",
      },
      watchOnYoutube: "شاهد على يوتيوب",
      watchOnTiktok: "شاهد على تيك توك",
      noVideos: "يتم تجهيز الفيديوهات. يرجى العودة قريباً أو الاتصال بنا لعرض المنتجات.",
      ctaTitle: "تريد عرضاً مباشراً؟",
      ctaDescription: "تواصل مع فريقنا لترتيب مكالمة فيديو أو إرسال عروض مسجلة لمعدات محددة.",
      ctaButton: "اطلب عرضاً",
    },
    productDetail: {
      breadcrumb: { home: "الرئيسية", products: "المنتجات" },
      tabs: { overview: "نظرة عامة", specifications: "المواصفات", downloads: "التنزيلات" },
      featured: "مميز",
      tradeInfo: {
        minimumOrder: "الحد الأدنى للطلب",
        leadTime: "مدة التصنيع",
        paymentTerms: "شروط الدفع",
        shippingPort: "ميناء الشحن",
        packaging: "التغليف",
        certification: "الشهادات",
      },
      keySpecifications: "المواصفات الرئيسية",
      requestQuote: "طلب عرض سعر",
      whatsapp: "واتساب",
      tradeInformation: "معلومات تجارية",
      paybackPeriod: "فترة الاسترداد",
      noOverview: "لا توجد نظرة عامة متاحة لهذا المنتج.",
      technicalSpecifications: "المواصفات التقنية",
      parameter: "المعلمة",
      specification: "المواصفة",
      downloadsResources: "التنزيلات والموارد",
      fileType: "ملف",
      relatedCaseStudies: "دراسات الحالة ذات الصلة",
      readFullCaseStudy: "قراءة الدراسة كاملة ←",
      relatedProducts: "منتجات ذات صلة",
      finalCtaTitle: "هل أنت مستعد لتحديث مزرعتك؟",
      finalCtaDescription: "احصل على عرض سعر مخصص يشمل الشحن إلى مينائك. سيساعدك مهندسونا في تصميم التخطيط الأمثل لمنشأتك.",
      finalCtaButton: "طلب عرض سعر",
      finalCtaWhatsapp: "تحدث عبر واتساب",
      product: "منتج",
      contactForPrice: "اتصل لمعرفة السعر",
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic nested translation structure
const jsonTranslations: Record<string, Record<string, any>> = {
  "en": {
    "common": {
      "nav": {
        "products": "Products",
        "solutions": "Solutions",
        "tradeSupport": "Trade Support",
        "caseStudies": "Case Studies",
          "videos": "Videos",
          "blog": "Blog",
        "about": "About"
      },
      "cta": {
        "getQuote": "Get Quote",
        "chatWhatsApp": "Chat on WhatsApp",
        "viewDetails": "View Details",
        "requestQuote": "Request Quote",
        "viewAll": "View All",
        "learnMore": "Learn More",
        "contactUs": "Contact Us",
        "subscribe": "Subscribe",
        "backToTop": "Back to top"
      },
      "footer": {
        "brandDescription": "Poultry & Livestock Equipment Solutions. Durable, export-ready equipment for commercial farms worldwide.",
        "email": "",
        "phone": "",
        "copyright": "Agricon. Poultry & Livestock Equipment Solutions.",
        "columns": {
          "products": "Products",
          "solutions": "Solutions",
          "company": "Company",
          "support": "Support"
        },
        "links": {
          "poultrySolutions": "Poultry Solutions",
          "livestockSolutions": "Livestock Solutions",
          "feedProcessing": "Feed Processing",
          "farmInfrastructure": "Farm Infrastructure",
          "viewAllProducts": "View All Products",
          "poultryFarmSetup": "Poultry Farm Setup",
          "livestockFarmSetup": "Livestock Farm Setup",
          "feedProcessingSetup": "Feed Processing Setup",
          "tradeSupport": "Trade Support",
          "aboutAgricon": "About Agricon",
          "caseStudies": "Case Studies",
          "videos": "Videos",
          "blog": "Blog",
          "distributors": "Distributors",
          "contact": "Contact",
          "faq": "FAQ",
          "technicalSupport": "Technical Support",
          "privacyPolicy": "Privacy Policy",
          "termsOfService": "Terms of Service"
        }
      },
      "home": {},
      "aria": {
        "toggleNavigation": "Toggle navigation",
        "switchToLightMode": "Switch to light mode",
        "switchToDarkMode": "Switch to dark mode",
        "backToTop": "Back to top",
        "chatOnWhatsApp": "Chat on WhatsApp",
        "switchLanguage": "Switch language"
      }
    },
    "contact": {
      "breadcrumb": {
        "home": "Home",
        "contact": "Contact"
      },
      "hero": {
        "title": "Contact Us",
        "description": "Get in touch with our team for product inquiries, pricing, technical support, or partnership opportunities."
      },
      "contactMethods": {
        "email": {
          "title": "Email",
          "description": "Send your inquiry using the published email address. Response timing depends on business hours and request complexity.",
          "actionText": "Send Email"
        },
        "phone": {
          "title": "Phone",
          "description": "Available Monday to Saturday, 8:00 AM - 6:00 PM (GMT+8).",
          "actionText": "Call Now"
        },
        "whatsapp": {
          "title": "WhatsApp",
          "description": "Quick responses for product inquiries, pricing, and order updates.",
          "actionText": "Chat Now"
        }
      },
      "inquiryForm": {
        "title": "Send Us Your Inquiry",
        "description": "Complete the form below. The team will review the requirements and contact you using the details provided.",
        "companyName": "Company Name",
        "contactName": "Contact Name",
        "emailAddress": "Email Address",
        "country": "Country",
        "selectCountry": "Select your country",
        "interestedProducts": "Interested Products",
        "selectProductsHint": "Select all products you are interested in:",
        "message": "Message",
        "messagePlaceholder": "Tell us about your project requirements, expected quantities, or any questions you have...",
        "submit": "Submit Inquiry",
        "submitting": "Submitting...",
        "errorGeneric": "Something went wrong. Please try again or contact us directly.",
        "errorNetwork": "Network error. Please try again or contact us via WhatsApp."
      },
      "success": {
        "title": "Inquiry Submitted Successfully",
        "description": "Thank you. Your inquiry has been submitted for technical and commercial review.",
        "browseProducts": "Browse Products"
      },
      "whatsappPrompt": {
        "title": "Prefer to Chat Directly?",
        "description": "Send us a WhatsApp message for quick responses on product availability, pricing, and order status. We typically reply within minutes during business hours.",
        "openChat": "Open WhatsApp Chat"
      },
      "responseInfo": {
        "title": "What to Expect",
        "items": {
          "response": {
            "title": "24-Hour Response",
            "description": "Each inquiry is reviewed according to its technical and commercial requirements."
          },
          "consultation": {
            "title": "Requirements Review",
            "description": "Get expert advice on equipment selection and farm layout planning at no cost."
          },
          "quotation": {
            "title": "Detailed Quotation",
            "description": "Receive a comprehensive quotation with pricing, specifications, and shipping details."
          }
        }
      },
      "countries": [
        "Nigeria",
        "Kenya",
        "Tanzania",
        "South Africa",
        "Ghana",
        "Ethiopia",
        "Uganda",
        "Vietnam",
        "Philippines",
        "Indonesia",
        "Thailand",
        "Myanmar",
        "Cambodia",
        "Brazil",
        "Colombia",
        "Peru",
        "Ecuador",
        "Argentina",
        "India",
        "Pakistan",
        "Bangladesh",
        "Egypt",
        "Sudan",
        "Other"
      ],
      "productOptions": [
        "H-Type Layer Cage",
        "A-Type Layer Cage",
        "Broiler Cage",
        "Chick Cage",
        "Automatic Feeding System",
        "Egg Collection System",
        "Manure Removal System",
        "Ventilation Fan",
        "Cooling Pad",
        "Feed Pellet Machine",
        "Feed Mixer",
        "Grinding Machine",
        "Green House",
        "Farm Fence",
        "Cattle Panel",
        "Other"
      ]
    },
    "distributors": {
      "breadcrumb": {
        "home": "Home",
        "distributors": "Distribution Partnership"
      },
      "hero": {
        "badge": "Partnership Application",
        "title": "Apply for Distribution Partnership Review",
        "description": "Submit your company profile for partnership review. Territory, pricing, branding, training, support, and warranty arrangements are valid only when confirmed in writing.",
        "applyNow": "Submit Company Profile"
      },
      "benefits": {
        "title": "Partnership Discussion Topics",
        "description": "The following areas may be discussed during due diligence. They are not commitments until included in an approved written agreement.",
        "items": {
          "territory": {
            "title": "Market Scope Review",
            "description": "Proposed territory and channel scope are reviewed against product fit, compliance requirements, and existing agreements. No exclusivity applies unless confirmed in a signed agreement."
          },
          "marketing": {
            "title": "Approved Commercial Materials",
            "description": "Current catalogs, specifications, brand assets, and quotation information may be provided according to the approved cooperation scope and availability."
          },
          "training": {
            "title": "Technical Coordination",
            "description": "Product training, installation guidance, escalation responsibilities, and service boundaries are defined for the relevant partner agreement and project."
          }
        }
      },
      "requirements": {
        "title": "Information We Review",
        "description": "Applications are reviewed using verifiable company, market, compliance, sales, and service information.",
        "idealProfile": "Application Review Information",
        "items": [
          "Verifiable company registration and responsible contact details",
          "Relevant market, agricultural, industrial, or equipment experience",
          "Ability to handle customer inquiries and maintain accurate product information",
          "Applicable import, tax, licensing, and compliance capability",
          "A transparent market and service plan for the proposed territory",
          "Disclosure of warehouse, showroom, installation, or service resources where relevant",
          "Agreement to due diligence and written commercial terms before representing Agricon"
        ]
      },
      "regions": {
        "title": "Market Coverage",
        "description": "Applications may be considered from different markets, subject to compliance, product fit, existing agreements, and written approval.",
        "items": {
          "availability": {
            "name": "Market Availability",
            "countries": "Applications may be submitted from any market. Availability depends on trade compliance, product fit, existing agreements, service capability, and written approval."
          }
        }
      },
      "support": {
        "title": "Possible Cooperation Scope",
        "description": "The exact cooperation scope is agreed case by case. Website descriptions do not create inventory, territory, marketing, training, warranty, or service obligations.",
        "items": {
          "inventory": {
            "title": "Product & Pricing Information",
            "description": "Approved product data, quotation terms, minimum order quantities, and availability are provided for the specific opportunity and may change before written confirmation."
          },
          "salesTraining": {
            "title": "Onboarding Scope",
            "description": "Any sales, product, installation, or service training is defined by the approved onboarding plan and written partner agreement."
          },
          "coBranding": {
            "title": "Brand Use",
            "description": "Logos, catalogs, campaign materials, and public claims may be used only in their approved form and within the written authorization granted to the partner."
          },
          "warranty": {
            "title": "Warranty & Service Coordination",
            "description": "Warranty scope, spare-parts responsibilities, escalation paths, and response arrangements apply only as stated in the applicable product and partner agreements."
          }
        }
      },
      "applicationForm": {
        "title": "Submit a Partnership Application",
        "description": "Complete the form for review. Response timing depends on the information provided, market, and current review capacity.",
        "companyName": "Company Name *",
        "companyPlaceholder": "Registered company name",
        "contactName": "Contact Name *",
        "contactPlaceholder": "Responsible contact",
        "email": "Business Email *",
        "emailPlaceholder": "name@company.com",
        "phone": "Phone *",
        "phonePlaceholder": "Include country code",
        "country": "Country / Market *",
        "countryPlaceholder": "Country or market",
        "businessType": "Business Type *",
        "interestedCategories": "Product Categories of Interest *",
        "introduction": "Company Profile",
        "introductionPlaceholder": "Describe your company, market, relevant experience, sales and service capabilities, and proposed cooperation scope.",
        "submit": "Submit Application",
        "submitting": "Submitting...",
        "errorGeneric": "Failed to submit the application. Please try again.",
        "errorNetwork": "Network error. Please check your connection and try again."
      },
      "success": {
        "title": "Application Submitted",
        "description": "Thank you for submitting your company profile. Submission does not create an appointment, exclusivity, pricing right, or other commercial commitment."
      },
      "businessTypes": [
        "Agricultural Equipment Dealer",
        "Farm Supply Business",
        "Industrial Equipment Business",
        "Installation or Service Provider",
        "Import / Export Trading Company",
        "Other"
      ],
      "categories": [
        "Poultry Housing Equipment",
        "Feeding Systems",
        "Livestock Housing & Fencing",
        "Feed Processing Equipment",
        "Ventilation & Climate Equipment",
        "Manure Management Equipment"
      ]
    },
    "faq": {
      "breadcrumb": {
        "home": "Home",
        "support": "Support",
        "faq": "FAQ"
      },
      "hero": {
        "title": "Frequently Asked Questions",
        "description": "Find answers to common questions about our products, shipping, installation, payment terms, and trade support."
      },
      "allCategory": "All",
      "noQuestions": "No questions found in this category.",
      "relatedSupport": {
        "title": "Additional Support Resources",
        "items": {
          "documentation": {
            "title": "Product Documentation",
            "description": "Access installation guides, technical specifications, and product catalogs for all Agricon equipment.",
            "href": "/support#download-center"
          },
          "videoTutorials": {
            "title": "Video Tutorials",
            "description": "Watch step-by-step installation and maintenance videos for cage systems, feeding equipment, and more.",
            "href": "/support#video-tutorials"
          },
          "contactSupport": {
            "title": "Contact Support",
            "description": "Connect with our technical team via email, phone, or WhatsApp for personalized assistance.",
            "href": "/contact"
          }
        }
      },
      "cta": {
        "title": "Still Have Questions?",
        "description": "Send us your question and our team will review it using the contact details you provide.",
        "contactUs": "Contact Us",
        "chatWhatsApp": "Chat on WhatsApp"
      },
      "learnMore": "Learn More →"
    },
    "trade-support": {
      "hero": {
        "title": "Trade Support",
        "description": "Review documentation, logistics, inspection, installation, and service requirements before order confirmation."
      }
    }
  },
  "es": {
    "common": {
      "nav": {
        "products": "Productos",
        "solutions": "Soluciones",
        "tradeSupport": "Soporte comercial",
        "caseStudies": "Casos de éxito",
          "videos": "Videos",
          "blog": "Blog",
        "about": "Nosotros"
      },
      "cta": {
        "getQuote": "Solicitar cotización",
        "chatWhatsApp": "Chatear por WhatsApp",
        "viewDetails": "Ver detalles",
        "requestQuote": "Solicitar cotización",
        "viewAll": "Ver todo",
        "learnMore": "Más información",
        "contactUs": "Contáctenos",
        "subscribe": "Suscribirse",
        "backToTop": "Volver arriba"
      },
      "footer": {
        "brandDescription": "Soluciones de equipos avícolas y ganaderos. Equipos duraderos listos para exportación para granjas comerciales en todo el mundo.",
        "email": "",
        "phone": "",
        "copyright": "Agricon. Soluciones de equipos avícolas y ganaderos.",
        "columns": {
          "products": "Productos",
          "solutions": "Soluciones",
          "company": "Empresa",
          "support": "Soporte"
        },
        "links": {
          "poultrySolutions": "Soluciones avícolas",
          "livestockSolutions": "Soluciones ganaderas",
          "feedProcessing": "Procesamiento de alimentos",
          "farmInfrastructure": "Infraestructura agrícola",
          "viewAllProducts": "Ver todos los productos",
          "poultryFarmSetup": "Instalación avícola",
          "livestockFarmSetup": "Instalación ganadera",
          "feedProcessingSetup": "Línea de producción de alimentos",
          "tradeSupport": "Soporte comercial",
          "aboutAgricon": "Sobre Agricon",
          "caseStudies": "Casos de éxito",
          "videos": "Videos",
          "blog": "Blog",
          "distributors": "Distribuidores",
          "contact": "Contacto",
          "faq": "FAQ",
          "technicalSupport": "Soporte técnico",
          "privacyPolicy": "Privacidad",
          "termsOfService": "Términos"
        }
      },
      "home": {},
      "aria": {
        "toggleNavigation": "Alternar navegación",
        "switchToLightMode": "Cambiar a modo claro",
        "switchToDarkMode": "Cambiar a modo oscuro",
        "backToTop": "Volver arriba",
        "chatOnWhatsApp": "Chatear por WhatsApp",
        "switchLanguage": "Cambiar idioma"
      }
    }
  },
  "fr": {
    "blog": {
      "breadcrumb": {
        "blog": "Blogue"
      },
      "hero": {
        "title": "Centre de connaissances Agricon",
        "description": "Avis d'experts sur l'elevage de volailles, les equipements pour le betail et l'agriculture commerciale pour les marches emergents.",
        "ctaBrowseProducts": "Voir les produits",
        "ctaContactUs": "Nous contacter"
      },
      "categories": [
        "Tous",
        "Conseils agricoles",
        "Guides d'achat",
        "Etudes de cas",
        "Actualites du secteur"
      ],
      "featuredArticle": "Article en vedette",
      "latestArticles": "Derniers articles",
      "readMore": "Lire la suite",
      "newsletter": {
        "title": "Restez informe",
        "description": "Recevez les derniers conseils agricoles, guides d'equipements et analyses de marche dans votre boite de reception chaque semaine.",
        "emailPlaceholder": "Entrez votre adresse e-mail",
        "submit": "S'abonner",
        "disclaimer": "Pas de spam. Desabonnement a tout moment. Rejoignez plus de 2 400 agriculteurs."
      }
    },
    "common": {
      "nav": {
        "products": "Produits",
        "solutions": "Solutions",
        "tradeSupport": "Support commercial",
        "caseStudies": "Études de cas",
          "videos": "Vidéos",
          "blog": "Blog",
        "about": "À propos"
      },
      "cta": {
        "getQuote": "Demander un devis",
        "chatWhatsApp": "Chatter sur WhatsApp",
        "viewDetails": "Voir les détails",
        "requestQuote": "Demander un devis",
        "viewAll": "Voir tout",
        "learnMore": "En savoir plus",
        "contactUs": "Contactez-nous",
        "subscribe": "S'abonner",
        "backToTop": "Retour en haut"
      },
      "footer": {
        "brandDescription": "Solutions d'équipements avicoles et d'élevage. Équipement durable prêt à l'export pour les fermes commerciales du monde entier.",
        "email": "",
        "phone": "",
        "copyright": "Agricon. Solutions d'équipements avicoles et d'élevage.",
        "columns": {
          "products": "Produits",
          "solutions": "Solutions",
          "company": "Entreprise",
          "support": "Support"
        },
        "links": {
          "poultrySolutions": "Solutions avicoles",
          "livestockSolutions": "Solutions élevage",
          "feedProcessing": "Production d'aliments",
          "farmInfrastructure": "Infrastructure agricole",
          "viewAllProducts": "Tous les produits",
          "poultryFarmSetup": "Installation avicole",
          "livestockFarmSetup": "Installation élevage",
          "feedProcessingSetup": "Ligne de production d'aliments",
          "tradeSupport": "Support commercial",
          "aboutAgricon": "À propos d'Agricon",
          "caseStudies": "Études de cas",
          "videos": "Vidéos",
          "blog": "Blog",
          "distributors": "Distributeurs",
          "contact": "Contact",
          "faq": "FAQ",
          "technicalSupport": "Support technique",
          "privacyPolicy": "Confidentialité",
          "termsOfService": "Conditions"
        }
      },
      "home": {},
      "aria": {
        "toggleNavigation": "Basculer la navigation",
        "switchToLightMode": "Passer au mode clair",
        "switchToDarkMode": "Passer au mode sombre",
        "backToTop": "Retour en haut",
        "chatOnWhatsApp": "Chatter sur WhatsApp",
        "switchLanguage": "Changer de langue"
      }
    },
    "search": {
      "title": "Recherche",
      "placeholder": "Rechercher des produits, solutions, articles de blog...",
      "tabs": {
        "all": "Tous",
        "product": "Produits",
        "solution": "Solutions",
        "blog": "Blogue",
        "caseStudy": "Etudes de cas"
      },
      "badges": {
        "product": "Produit",
        "solution": "Solution",
        "blog": "Blogue",
        "caseStudy": "Etude de cas"
      },
      "noResults": {
        "title": "Aucun resultat trouve",
        "description": "Nous n'avons rien trouve correspondant a \"{query}\". Essayez des mots-cles differents ou parcourez nos categories.",
        "ctaBrowseProducts": "Voir les produits",
        "ctaContactUs": "Nous contacter"
      },
      "sidebar": {
        "title": "Liens recommandes"
      }
    }
  },
  "ar": {
    "common": {
      "nav": {
        "products": "المنتجات",
        "solutions": "الحلول",
        "tradeSupport": "دعم التجارة",
        "caseStudies": "دراسات الحالة",
          "videos": "الفيديوهات",
          "blog": "المدونة",
        "about": "من نحن"
      },
      "cta": {
        "getQuote": "اطلب عرض سعر",
        "chatWhatsApp": "تحدث عبر واتساب",
        "viewDetails": "عرض التفاصيل",
        "requestQuote": "طلب عرض سعر",
        "viewAll": "عرض الكل",
        "learnMore": "اعرف المزيد",
        "contactUs": "اتصل بنا",
        "subscribe": "اشترك",
        "backToTop": "العودة للأعلى"
      },
      "footer": {
        "brandDescription": "حلول معدات الدواجن والثروة الحيوانية. معدات متينة جاهزة للتصدير للمزارع التجارية حول العالم.",
        "email": "",
        "phone": "",
        "copyright": "Agricon. حلول معدات الدواجن والثروة الحيوانية.",
        "columns": {
          "products": "المنتجات",
          "solutions": "الحلول",
          "company": "الشركة",
          "support": "الدعم"
        },
        "links": {
          "poultrySolutions": "حلول الدواجن",
          "livestockSolutions": "حلول الثروة الحيوانية",
          "feedProcessing": "تصنيع الأعلاف",
          "farmInfrastructure": "البنية التحتية للمزرعة",
          "viewAllProducts": "جميع المنتجات",
          "poultryFarmSetup": "הקמת مزرعة دواجن",
          "livestockFarmSetup": "הקמת مزرعة مواشي",
          "feedProcessingSetup": "خط إنتاج الأعلاف",
          "tradeSupport": "دعم التجارة",
          "aboutAgricon": "عن Agricon",
          "caseStudies": "دراسات الحالة",
          "videos": "الفيديوهات",
          "blog": "المدونة",
          "distributors": "الموزعون",
          "contact": "اتصل بنا",
          "faq": "الأسئلة الشائعة",
          "technicalSupport": "الدعم الفني",
          "privacyPolicy": "سياسة الخصوصية",
          "termsOfService": "شروط الخدمة"
        }
      },
      "home": {},
      "aria": {
        "toggleNavigation": "تبديل التنقل",
        "switchToLightMode": "التبديل إلى الوضع الفاتح",
        "switchToDarkMode": "التبديل إلى الوضع الداكن",
        "backToTop": "العودة للأعلى",
        "chatOnWhatsApp": "تحدث عبر واتساب",
        "switchLanguage": "تغيير اللغة"
      }
    }
  },
  "ru": {
    "common": {
      "nav": {
        "products": "Продукция",
        "solutions": "Решения",
        "tradeSupport": "Торговая поддержка",
        "caseStudies": "Кейсы",
          "videos": "Видео",
          "blog": "Блог",
        "about": "О нас"
      },
      "cta": {
        "getQuote": "Запросить цену",
        "chatWhatsApp": "Написать в WhatsApp",
        "viewDetails": "Подробнее",
        "requestQuote": "Запросить цену",
        "viewAll": "Смотреть все",
        "learnMore": "Узнать больше",
        "contactUs": "Связаться с нами",
        "subscribe": "Подписаться",
        "backToTop": "Наверх"
      },
      "footer": {
        "brandDescription": "Оборудование для птицеводства и животноводства. Надёжное оборудование для коммерческих ферм по всему миру.",
        "email": "",
        "phone": "",
        "copyright": "Agricon. Оборудование для птицеводства и животноводства.",
        "columns": {
          "products": "Продукция",
          "solutions": "Решения",
          "company": "Компания",
          "support": "Поддержка"
        },
        "links": {
          "poultrySolutions": "Птицеводство",
          "livestockSolutions": "Животноводство",
          "feedProcessing": "Производство кормов",
          "farmInfrastructure": "Инфраструктура ферм",
          "viewAllProducts": "Вся продукция",
          "poultryFarmSetup": "Оборудование для птицефабрик",
          "livestockFarmSetup": "Оборудование для ферм",
          "feedProcessingSetup": "Линии по производству кормов",
          "tradeSupport": "Торговая поддержка",
          "aboutAgricon": "О компании Agricon",
          "caseStudies": "Кейсы",
          "videos": "Видео",
          "blog": "Блог",
          "distributors": "Дистрибьюторы",
          "contact": "Контакты",
          "faq": "Вопросы и ответы",
          "technicalSupport": "Техническая поддержка",
          "privacyPolicy": "Политика конфиденциальности",
          "termsOfService": "Условия использования"
        }
      },
      "home": {},
      "aria": {
        "toggleNavigation": "Переключить навигацию",
        "switchToLightMode": "Переключить на светлый режим",
        "switchToDarkMode": "Переключить на тёмный режим",
        "backToTop": "Наверх",
        "chatOnWhatsApp": "Написать в WhatsApp",
        "switchLanguage": "Переключить язык"
      }
    }
  },
  "sw": {
    "common": {
      "nav": {
        "products": "Bidhaa",
        "solutions": "Suluhisho",
        "tradeSupport": "Msaada wa Biashara",
        "caseStudies": "Mafunzo ya Kesi",
          "videos": "Video",
          "blog": "Blogu",
        "about": "Kuhusu"
      },
      "cta": {
        "getQuote": "Omba Bei",
        "chatWhatsApp": "Ongea kwenye WhatsApp",
        "viewDetails": "Angalia Maelezo",
        "requestQuote": "Omba Bei",
        "viewAll": "Angalia Zote",
        "learnMore": "Soma Zaidi",
        "contactUs": "Wasiliana Nasi",
        "subscribe": "Jiandikishe",
        "backToTop": "Rudi Juu"
      },
      "footer": {
        "brandDescription": "Suluhisho za vifaa vya ufugaji wa kuku na mifugo. Vifaa vya kudumu vinavyoweza kusafirishwa kwa mashamba ya kibiashara duniani kote.",
        "email": "",
        "phone": "",
        "copyright": "Agricon. Suluhisho za vifaa vya ufugaji wa kuku na mifugo.",
        "columns": {
          "products": "Bidhaa",
          "solutions": "Suluhisho",
          "company": "Kampuni",
          "support": "Usaidizi"
        },
        "links": {
          "poultrySolutions": "Suluhisho za Kuku",
          "livestockSolutions": "Suluhisho za Mifugo",
          "feedProcessing": "Uzalishaji wa Chakula",
          "farmInfrastructure": "Miundombinu ya Shamba",
          "viewAllProducts": "Bidhaa Zote",
          "poultryFarmSetup": "Uanzishaji wa Shamba la Kuku",
          "livestockFarmSetup": "Uanzishaji wa Shamba la Mifugo",
          "feedProcessingSetup": "Kiwanda cha Chakula",
          "tradeSupport": "Msaada wa Biashara",
          "aboutAgricon": "Kuhusu Agricon",
          "caseStudies": "Mafunzo ya Kesi",
          "videos": "Video",
          "blog": "Blogu",
          "distributors": "Wasambazaji",
          "contact": "Wasiliana",
          "faq": "Maswali Yanayoulizwa Mara kwa Mara",
          "technicalSupport": "Usaidizi wa Kiufundi",
          "privacyPolicy": "Sera ya Faragha",
          "termsOfService": "Masharti ya Huduma"
        }
      },
      "home": {},
      "aria": {
        "toggleNavigation": "Geuza urambazaji",
        "switchToLightMode": "Badilisha hadi mwonekano mwepesi",
        "switchToDarkMode": "Badilisha hadi mwonekano mweusi",
        "backToTop": "Rudi juu",
        "chatOnWhatsApp": "Ongea kwenye WhatsApp",
        "switchLanguage": "Badilisha lugha"
      }
    },
    "solutions": {
      "breadcrumb": {
        "solutions": "Suluhisho"
      },
      "hero": {
        "title": "Suluhisho kamili za kilimo",
        "description": "Vifurushi kamili vya vifaa vilivyoundwa, vilivyosanidiwa na kusaidiwa kwa mashamba ya biashara katika Afrika, Kusini mwa Asia na Amerika Kusini.",
        "ctaGetSolution": "Pata suluhisho maalum",
        "ctaBrowseProducts": "Vinjari bidhaa"
      },
      "categories": {
        "title": "Kategoria zetu za suluhisho",
        "description": "Kutoka vifaa vya mtu binafsi hadi miradi kamili ya mashamba, tunatoa suluhisho zilizounganishwa zinazofaa kiwango cha shamba lako na hali za ndani."
      },
      "whyChoose": {
        "title": "Kwa nini chose suluhisho kamili",
        "description": "Vifurushi vilivyounganishwa vya vifaa vinaondoa matatizo ya ushirikiano na kuhakikisha kila kipengele kinafanya kazi pamoja bila matatizo.",
        "cards": [
          {
            "title": "Imetengenezwa mapema kwa eneo lako",
            "description": "Kila suluhisho linaundwa kwa kuzingatia hali ya hewa ya ndani, miundombinu inayopatikana na hali za soko. Hakuna miundo ya jumla."
          },
          {
            "title": "Uwajibikaji wa chanzo kimoja",
            "description": "Mtoaji mmoja kwa vifaa vyote, dhamana moja, mwasiliani mmoja wa msaada. Hakuna taabu ya kusawazisha kati ya watoa huduma wengi."
          },
          {
            "title": "Imethibitishwa katika nchi 30+",
            "description": "Zaidi ya uunganishaji 5,000 katika Afrika, Kusini mwa Asia na Amerika Kusini. Suluhisho zetu zimethibitishwa katika hali halisi unazofanya kazi."
          }
        ]
      },
      "comparison": {
        "title": "Vifaa vya jadi dhidi ya vifaa vya kisasa",
        "description": "Ona faida zinazoweza kupimwa za kuboresha kutoka mbinu za kilimo za jadi hadi mifumo ya kisasa ya vifaa ya Agricon.",
        "headers": [
          "Kipimo",
          "Jadi",
          "Kisasa (Agricon)",
          "Faida"
        ],
        "rows": [
          {
            "feature": "Uwekezaji wa awali",
            "traditional": "Chini",
            "modern": "Ya Wastani-Idle",
            "advantage": "Gharama za awali zaidi, lakini kurejesa mara 3x haraka"
          },
          {
            "feature": "Uwezo wa kuku kwa m2",
            "traditional": "5-7 kuku",
            "modern": "12-20 kuku",
            "advantage": "Matumizi ya nafasi mara 3x bora"
          },
          {
            "feature": "Uwiano wa uongofu wa chakula",
            "traditional": "2.5-3.0",
            "modern": "1.8-2.2",
            "advantage": "Kuokoa gharama za chakula kwa 25%"
          },
          {
            "feature": "Kazi inayohitajika",
            "traditional": "Nyingi (ya mkono)",
            "modern": "Chache (iliyoendeshwa kiotomatiki)",
            "advantage": "Uwezekano wa kupunguza kazi kulingana na usanidi"
          },
          {
            "feature": "Kiwango cha uvunjaji wa mayai",
            "traditional": "3-5%",
            "modern": "<0.5%",
            "advantage": "Upunguzaji wa hasara mara 5-10"
          },
          {
            "feature": "Kiwango cha vifo",
            "traditional": "8-15%",
            "modern": "3-5%",
            "advantage": "Kundi lenye afya bora zaidi"
          },
          {
            "feature": "Udhibiti wa magonjwa",
            "traditional": "Ngumu",
            "modern": "Rahisi (iliyolindwa kibiolojia)",
            "advantage": "Utofautishaji na usafi bora"
          }
        ]
      },
      "caseStudies": {
        "title": "Mifano",
        "description": "Matokeo ya kweli kutoka mashamba yaliyochagua suluhisho kamili za Agricon."
      },
      "process": {
        "title": "Tunavyofanya kazi nawe",
        "description": "Kutoka ushauri wa kwanza hadi msaada wa baada ya usakinishaji, timu yetu inakuongoza katika kila hatua ya kuboresha shamba lako.",
        "steps": [
          {
            "step": "01",
            "title": "Ushauri",
            "desc": "Shiriki malengo yako, bajeti na maelezo ya eneo na wataalamu wetu."
          },
          {
            "step": "02",
            "title": "Muundo",
            "desc": "Tunaunda mpangilio na mpango wa vifaa maalum kwa shamba lako."
          },
          {
            "step": "03",
            "title": "Utoaji",
            "desc": "Ufungaji wa viwango vya usafirishaji, usimamizi wa usafirishaji na nyaraka."
          },
          {
            "step": "04",
            "title": "Msaada",
            "desc": "Mwongozo wa usakinishaji, mafunzo na msaada wa kiufundi Endelevu."
          }
        ],
        "cta": "Anza mradi wako leo"
      }
    }
  }
};

// getTranslations merges: JSON files (page-specific) + inline translations (common UI)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic translation access
export function getTranslations(locale: Locale, namespace: string): Record<string, any> {
  const jsonData = jsonTranslations[locale]?.[namespace] ?? {};
  const inlineData = translations[locale]?.[namespace] ?? {};
  const fallbackJson = jsonTranslations[defaultLocale]?.[namespace] ?? {};
  const fallbackInline = translations[defaultLocale]?.[namespace] ?? {};

  // Also check if namespace exists as a nested key inside "common" JSON
  const commonJson = jsonTranslations[locale]?.common?.[namespace] ?? {};
  const fallbackCommonJson = jsonTranslations[defaultLocale]?.common?.[namespace] ?? {};

  return { ...fallbackInline, ...fallbackCommonJson, ...fallbackJson, ...inlineData, ...commonJson, ...jsonData };
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
