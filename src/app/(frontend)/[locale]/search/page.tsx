import type { Locale } from '@/i18n/config'
import { getTranslations } from '@/i18n/config'
import SearchForm from '@/components/SearchForm'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return pageMetadata(locale as Locale, {
    namespace: 'search',
    path: '/search',
    title: "Search",
    description: "Search Agricon products, solutions and guides to find the right equipment for your farm.",
  })
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
