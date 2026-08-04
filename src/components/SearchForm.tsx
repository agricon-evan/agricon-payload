'use client'

import { useState, useEffect, Suspense, useCallback, useTransition } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Icon from '@/components/ui/Icon'

interface SearchPageProps {
  locale: string
  searchTitle: string
  searchPlaceholder: string
  searchLabel: string
  brandDesc: string
  noResultsTitle: string
  noResultsDesc: string
  contactCta: string
}

interface PayloadDoc { id: string; name?: string; title?: string; description?: string; slug?: string; images?: { image?: { url?: string } }[]; subcategory?: { slug?: string; category?: { slug?: string } } }
interface SearchResult {
  id: string; title: string; description: string; url: string; type: string; image?: string
}

function SearchContent(props: SearchPageProps) {
  const { locale, searchTitle, searchPlaceholder, searchLabel, brandDesc, noResultsTitle, noResultsDesc, contactCta } = props
  const params = useParams()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const doSearch = useCallback(async (kw: string) => {
    if (!kw.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const hits: SearchResult[] = []
      const prodRes = await fetch(`/api/products?limit=10&locale=${locale}&where[name][contains]=${encodeURIComponent(kw)}`, { credentials: 'include' })
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        ;(prodData.docs || []).forEach((p: PayloadDoc) => {
          const sub = p.subcategory; const cat = sub?.category
          hits.push({ id: p.id, title: p.name || '', description: p.description || '', url: `/${locale}/products/${cat?.slug || ''}/${sub?.slug || ''}/${p.slug || ''}`, type: 'Product', image: p.images?.[0]?.image?.url })
        })
      }
      const solRes = await fetch(`/api/solutions?limit=5&locale=${locale}&where[name][contains]=${encodeURIComponent(kw)}`, { credentials: 'include' })
      if (solRes.ok) {
        const solData = await solRes.json()
        ;(solData.docs || []).forEach((s: PayloadDoc) => hits.push({ id: s.id, title: s.name || '', description: s.description || '', url: `/${locale}/solutions/${s.slug || ''}`, type: 'Solution' }))
      }
      setResults(hits.slice(0, 20))
    } catch { setResults([]) } finally { setLoading(false) }
  }, [locale])

  useEffect(() => {
    const t = setTimeout(() => { startTransition(() => { doSearch(q) }) }, 0)
    return () => clearTimeout(t)
  }, [q, doSearch, startTransition])

  return (
    <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">{searchTitle}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{brandDesc}</p>
      <form className="mt-6 flex flex-col sm:flex-row gap-3" onSubmit={e => {
        e.preventDefault(); const url = new URL(window.location.href); url.searchParams.set('q', query); window.history.pushState({}, '', url.toString()); doSearch(query)
      }}>
        <div className="relative flex-1">
          <Icon name="search" size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md min-h-[48px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
        </div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]">
          {searchLabel} <Icon name="search" size={15} />
        </button>
      </form>
      <div className="mt-8 space-y-4">
        {loading && <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Searching...</div>}
        {!loading && query && results.length === 0 && (
          <div className="p-10 text-center card">
            <div className="w-12 h-12 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4"><Icon name="search" size={22} /></div>
            <p className="font-semibold text-[var(--color-text)]">{noResultsTitle}</p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{noResultsDesc}</p>
            <a href={`/${locale}/contact`} className="inline-flex items-center justify-center mt-5 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[44px] tap-target transition-colors hover:bg-[var(--color-primary-dark)]">{contactCta}</a>
          </div>
        )}
        {results.map(r => (
          <a key={r.id} href={r.url} className="flex items-start gap-4 p-5 card card-hover">
            {r.image ? <img src={r.image} alt={r.title} className="w-14 h-14 rounded-md object-cover flex-shrink-0" /> : <div className="w-14 h-14 rounded-md bg-[var(--color-muted)] flex items-center justify-center flex-shrink-0"><Icon name={r.type === 'Product' ? 'box' : 'building'} size={22} className="text-[var(--color-text-secondary)]/40" /></div>}
            <div className="min-w-0">
              <div className="text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wide">{r.type}</div>
              <div className="mt-1 font-semibold text-[var(--color-text)] truncate">{r.title}</div>
              {r.description && <div className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">{r.description}</div>}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function SearchPage(props: SearchPageProps) {
  return <Suspense fallback={<div className="p-10 text-center text-sm text-[var(--color-text-secondary)]">Loading...</div>}><SearchContent {...props} /></Suspense>
}
