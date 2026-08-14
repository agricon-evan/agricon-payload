"use client"

import { useEffect, useState } from 'react'

/**
 * Branded welcome panel rendered above the collection cards on the dashboard.
 * Includes a live content overview (collection counts) plus quick links and a
 * short editorial guide for the site team.
 */

interface Stats {
  products: number
  categories: number
  subcategories: number
  solutions: number
  caseStudies: number
  blogPosts: number
  faqs: number
  videos: number
  downloads: number
  inquiries: number
  newInquiries: number
  media: number
}

const initialStats: Stats = {
  products: 0, categories: 0, subcategories: 0, solutions: 0, caseStudies: 0,
  blogPosts: 0, faqs: 0, videos: 0, downloads: 0, inquiries: 0, newInquiries: 0, media: 0,
}

async function fetchCount(path: string): Promise<number> {
  try {
    const res = await fetch(path)
    if (!res.ok) return 0
    const data = await res.json()
    return data.totalDocs ?? 0
  } catch {
    return 0
  }
}

export default function BeforeDashboard() {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [products, categories, subcategories, solutions, caseStudies, blogPosts, faqs, videos, downloads, inquiries, media] = await Promise.all([
        fetchCount('/api/products?limit=1&depth=0'),
        fetchCount('/api/categories?limit=1&depth=0'),
        fetchCount('/api/subcategories?limit=1&depth=0'),
        fetchCount('/api/solutions?limit=1&depth=0'),
        fetchCount('/api/caseStudies?limit=1&depth=0'),
        fetchCount('/api/blogPosts?limit=1&depth=0'),
        fetchCount('/api/faqs?limit=1&depth=0'),
        fetchCount('/api/videos?limit=1&depth=0'),
        fetchCount('/api/downloads?limit=1&depth=0'),
        fetchCount('/api/inquiries?limit=1&depth=0'),
        fetchCount('/api/media?limit=1&depth=0'),
      ])
      let newInquiries = 0
      try {
        const res = await fetch('/api/inquiries?limit=1&depth=0&where[status][equals]=new')
        if (res.ok) newInquiries = (await res.json()).totalDocs ?? 0
      } catch { /* ignore */ }
      if (!cancelled) {
        setStats({ products, categories, subcategories, solutions, caseStudies, blogPosts, faqs, videos, downloads, inquiries, newInquiries, media })
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const quickLinks = [
    { label: '+ New Product', href: '/admin/collections/products/create', tone: 'primary' },
    { label: `Inquiries${stats.newInquiries > 0 ? ` (${stats.newInquiries} new)` : ''}`, href: '/admin/collections/inquiries', tone: 'dark' },
    { label: 'Videos', href: '/admin/collections/videos', tone: 'dark' },
    { label: 'Blog Posts', href: '/admin/collections/blogPosts', tone: 'dark' },
    { label: 'Site Settings', href: '/admin/collections/siteSettings', tone: 'dark' },
  ]

  const statCards: { label: string; value: number; href: string; accent?: boolean }[] = [
    { label: 'Products', value: stats.products, href: '/admin/collections/products' },
    { label: 'Categories', value: stats.categories, href: '/admin/collections/categories' },
    { label: 'Subcategories', value: stats.subcategories, href: '/admin/collections/subcategories' },
    { label: 'Solutions', value: stats.solutions, href: '/admin/collections/solutions' },
    { label: 'Case Studies', value: stats.caseStudies, href: '/admin/collections/caseStudies' },
    { label: 'Blog Posts', value: stats.blogPosts, href: '/admin/collections/blogPosts' },
    { label: 'FAQs', value: stats.faqs, href: '/admin/collections/faqs' },
    { label: 'Videos', value: stats.videos, href: '/admin/collections/videos' },
    { label: 'Downloads', value: stats.downloads, href: '/admin/collections/downloads' },
    { label: 'Inquiries', value: stats.inquiries, href: '/admin/collections/inquiries', accent: true },
    { label: 'Media', value: stats.media, href: '/admin/collections/media' },
  ]

  const guide = [
    'Products live in a 3-level tree: Categories → Subcategories → Products.',
    'Attach datasheets to a product from its “Downloads” tab — they appear on the product page.',
    'Add YouTube/TikTok links under Videos — thumbnails are generated automatically.',
    'The inquiry form country dropdown is powered by the Countries list.',
    'Keep Site Settings to exactly one document.',
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Brand hero panel */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 12,
          background: 'linear-gradient(120deg, #0C5D3F 0%, #0a4d34 60%, #083d2a 100%)',
          color: '#fff',
          padding: '26px 28px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'rgba(238,146,48,0.18)',
          }}
          aria-hidden="true"
        />
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#EE9230', fontWeight: 700 }}>
              Agricon CMS
            </div>
            <h1 style={{ margin: '6px 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>
              Welcome back, admin
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>
              Manage the Agricon storefront — product catalog, solutions, content, videos, downloads and leads —
              all in one place.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: link.tone === 'primary' ? '#0C5D3F' : '#fff',
                  background: link.tone === 'primary' ? '#EE9230' : 'rgba(255,255,255,0.14)',
                  border: link.tone === 'primary' ? '1px solid #EE9230' : '1px solid rgba(255,255,255,0.22)',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content overview — live counts from the API */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 12,
          border: '1px solid var(--theme-elevation-150, #e4e4e7)',
          background: 'var(--theme-elevation-50, #fafafa)',
          padding: '16px 18px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: '#0C5D3F', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Content Overview
          </div>
          {loading && (
            <span style={{ fontSize: 12, color: 'var(--theme-elevation-500, #71717a)' }}>Loading…</span>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
            gap: 10,
          }}
        >
          {statCards.map((card) => (
            <a
              key={card.label}
              href={card.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '12px 14px',
                borderRadius: 9,
                textDecoration: 'none',
                background: card.accent ? '#EE9230' : '#fff',
                border: card.accent ? '1px solid #EE9230' : '1px solid var(--theme-elevation-150, #e4e4e7)',
                boxShadow: card.accent ? '0 3px 10px rgba(238,146,48,0.22)' : 'none',
                transition: 'transform .12s ease, box-shadow .12s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(12,93,63,0.14)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = card.accent ? '0 3px 10px rgba(238,146,48,0.22)' : 'none' }}
            >
              <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: card.accent ? '#0C5D3F' : '#0C5D3F' }}>
                {card.value}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: card.accent ? 'rgba(12,93,63,0.85)' : 'var(--theme-elevation-600, #52525b)' }}>
                {card.label}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Quick guide */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 12,
          border: '1px solid var(--theme-elevation-150, #e4e4e7)',
          background: 'var(--theme-elevation-50, #fafafa)',
          padding: '14px 18px',
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 700, color: '#0C5D3F', marginBottom: 8, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Quick guide
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--theme-elevation-800, #3f3f46)', lineHeight: 1.75 }}>
          {guide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
