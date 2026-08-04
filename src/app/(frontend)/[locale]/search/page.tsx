import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import SearchForm from '@/components/SearchForm'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params
  const t = getTranslations(locale as Locale, 'search')
  const tNav = getTranslations(locale as Locale, 'common')

  return (
    <SearchForm
      locale={locale}
      searchTitle={t.title || 'Search'}
      searchPlaceholder={t.placeholder || 'Search products, solutions...'}
      searchLabel={t.title || 'Search'}
      brandDesc={tNav.footer?.brandDescription || ''}
      noResultsTitle={t.noResults?.title || 'No results found'}
      noResultsDesc={t.noResults?.description || 'Try different keywords or contact us directly.'}
      contactCta={tNav.cta?.getQuote || 'Contact Us'}
    />
  )
}
