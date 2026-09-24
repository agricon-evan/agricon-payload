'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import MediaImage from '@/components/ui/MediaImage'

interface SearchPageProps {
  locale: string
  searchTitle: string
  searchPlaceholder: string
  searchLabel: string
  brandDesc: string
  noResultsTitle: string
  noResultsDesc: string
  contactCta: string
  searchingLabel: string
  loadingLabel: string
  typeProduct: string
  typeSolution: string
}

interface PayloadDoc { id: string; name?: string; title?: string; description?: string; slug?: string; images?: { image?: { url?: string } }[]; subcategory?: { slug?: string; category?: { slug?: string } } }
interface SearchResult {
  id: string; title: string; description: string; url: string; type: string; image?: string
}

function SearchContent(props: SearchPageProps) {
  const {
    locale, searchTitle, searchPlaceholder, searchLabel, brandDesc,
    noResultsTitle, noResultsDesc, contactCta,
    searchingLabel, typeProduct, typeSolution,
  } = props
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  // The URL is the source of truth for `q`; this only keeps the input in sync
  // when the visitor navigates with back/forward. Adjusting state during render
  // is React's documented alternative to a syncing effect.
  const [lastSyncedQ, setLastSyncedQ] = useState(q)
  if (q !== lastSyncedQ) {
    setLastSyncedQ(q)
    setQuery(q)
  }

  useEffect(() => {
    // Each run owns an AbortController: a new query (or unmount) aborts the
    // previous request pair, so a slow earlier response can never overwrite the
    // results of a newer one — the bug this guard replaced relied on a request
    // counter, which still let the stale response render for one frame.
    const controller = new AbortController()
    const kw = q.trim()

    // Deferred to a timeout so this effect does not call setState synchronously
    // during the commit phase (cascading render), and so a fast typist only
    // fires one request per settled keystroke.
    const timer = setTimeout(async () => {
      if (!kw) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const [prodRes, solRes] = await Promise.all([
          fetch(`/api/products?limit=10&locale=${locale}&where[name][contains]=${encodeURIComponent(kw)}`, { credentials: 'include', signal: controller.signal }),
          fetch(`/api/solutions?limit=5&locale=${locale}&where[name][contains]=${encodeURIComponent(kw)}`, { credentials: 'include', signal: controller.signal }),
        ])
        const hits: SearchResult[] = []
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          ;(prodData.docs || []).forEach((p: PayloadDoc) => {
            const sub = p.subcategory; const cat = sub?.category
            // A result link needs all three segments; without them the URL would
            // read `/en/products//sub/slug` and 404. Drop such a hit instead of
            // offering a dead link. (`/api/products` returns depth-2 docs, so
            // `sub.category` is normally expanded here.)
            if (!cat?.slug || !sub?.slug || !p.slug) return
            hits.push({ id: p.id, title: p.name || '', description: p.description || '', url: `/${locale}/products/${cat.slug}/${sub.slug}/${p.slug}`, type: typeProduct, image: p.images?.[0]?.image?.url })
          })
        }
        if (solRes.ok) {
          const solData = await solRes.json()
          ;(solData.docs || []).forEach((s: PayloadDoc) => {
            if (!s.slug) return
            hits.push({ id: s.id, title: s.name || '', description: s.description || '', url: `/${locale}/solutions/${s.slug}`, type: typeSolution })
          })
        }
        if (controller.signal.aborted) return
        setResults(hits.slice(0, 20))
      } catch {
        if (controller.signal.aborted) return
        setResults([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 0)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q, locale, typeProduct, typeSolution])

  return (
    <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">{searchTitle}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{brandDesc}</p>
      <form className="mt-6 flex flex-col sm:flex-row gap-3" onSubmit={e => {
        e.preventDefault()
        // `router.replace` instead of `history.pushState`: pushState leaves the
        // Next router (and therefore `useSearchParams`) unaware of the new URL,
        // so the results effect never re-ran and a reload lost the query.
        const params = new URLSearchParams(searchParams.toString())
        const trimmed = query.trim()
        if (trimmed) params.set('q', trimmed)
        else params.delete('q')
        const qs = params.toString()
        router.replace(qs ? `/${locale}/search?${qs}` : `/${locale}/search`)
      }}>
        <div className="relative flex-1">
          <Icon name="search" size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder || searchTitle}
            className="w-full pl-11 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md min-h-[48px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
        </div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px] press tap-target transition-colors hover:bg-[var(--color-primary-dark)]">
          {searchLabel} <Icon name="search" size={15} />
        </button>
      </form>
      <div className="mt-8 space-y-4" aria-live="polite" aria-busy={loading}>
        {loading && <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">{searchingLabel}</div>}
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
            {r.image ? <MediaImage src={r.image} alt={r.title} width={56} height={56} className="w-14 h-14 rounded-md object-cover flex-shrink-0" /> : <div className="w-14 h-14 rounded-md bg-[var(--color-muted)] flex items-center justify-center flex-shrink-0"><Icon name={r.type === typeProduct ? 'box' : 'building'} size={22} className="text-[var(--color-text-secondary)]/40" /></div>}
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
  return <Suspense fallback={<div className="p-10 text-center text-sm text-[var(--color-text-secondary)]">{props.loadingLabel}</div>}><SearchContent {...props} /></Suspense>
}
