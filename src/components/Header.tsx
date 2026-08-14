"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { getUiString, uiLocaleNames as localeNames, uiLocales as locales } from '@/i18n/ui'
import Icon from '@/components/ui/Icon'

interface Props {
  locale: Locale
}

export default function Header({ locale }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const pathname = usePathname()
  const lp = `/${locale}`
  const u = (key: string) => getUiString(locale, key)

  // 切换语言时保留当前页面路径（/en/about → /ru/about）
  const localizedHref = (target: string): string => {
    let rest = pathname
    for (const l of locales) {
      if (pathname === `/${l}`) { rest = ''; break }
      if (pathname.startsWith(`/${l}/`)) { rest = pathname.slice(l.length + 1); break }
    }
    return `/${target}${rest}`
  }

  const navItems = [
    { label: u('navProducts'), href: `${lp}/products` },
    { label: u('navSolutions'), href: `${lp}/solutions` },
    { label: u('navCaseStudies'), href: `${lp}/case-studies` },
    { label: u('navVideos'), href: `${lp}/videos` },
    { label: u('navAbout'), href: `${lp}/about` },
    { label: u('navBlog'), href: `${lp}/blog` },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-[72px]">
        {/* Brand mark */}
        <Link href={lp || '/en'} className="flex items-center gap-3 tap-target" aria-label="Agricon Home">
          <Image
            src="/company-logo.svg"
            alt="Agricon symbol"
            width={78}
            height={45}
            priority
            className="h-10 w-auto object-contain"
          />
          <span className="font-display text-base sm:text-lg font-bold tracking-[0.16em] text-[var(--color-primary)]">AGRICON</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-8 text-sm font-medium text-[var(--color-text-secondary)]">
          {navItems.map(item => (
            <li key={item.href}>
              <Link href={item.href} className="link-underline hover:text-[var(--color-primary)] transition-colors py-2">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/${locale}/contact`}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[var(--color-primary)] text-white text-sm font-semibold transition-all hover:bg-[var(--color-primary-dark)] hover:-translate-y-0.5 tap-target"
          >
            {u('getQuote')}
            <Icon name="arrow-right" size={15} />
          </Link>
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(!langOpen); setMobileOpen(false) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm hover:bg-[var(--color-muted)] text-sm font-medium tap-target transition-colors"
              aria-label={u('switchLanguage')}
            >
              <Icon name="globe" size={16} />
              {localeNames[locale as keyof typeof localeNames] || locale}
              <Icon name="chevron-down" size={14} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-[var(--color-surface)] rounded-sm border border-[var(--color-border)] min-w-[170px] py-1.5 z-50">
                {locales.map(loc => (
                  <Link
                    key={loc}
                    href={localizedHref(loc)}
                    onClick={() => setLangOpen(false)}
                    className={`block px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] transition-colors tap-target ${loc === locale ? 'text-[var(--color-primary)] font-semibold' : ''}`}
                  >
                    {localeNames[loc as keyof typeof localeNames]}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => { setMobileOpen(!mobileOpen); setLangOpen(false) }}
            className="lg:hidden p-2.5 tap-target text-[var(--color-text)]"
            aria-label={u('toggleNav')}
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <ul className="px-4 py-3 space-y-1">
            {navItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-[var(--color-text)] font-medium hover:bg-[var(--color-muted)] rounded-md transition-colors tap-target"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 border-t border-[var(--color-border)]">
              <Link
                href={`/${locale}/contact`}
                className="flex items-center justify-between px-4 py-3 text-[var(--color-accent)] font-semibold hover:bg-[var(--color-muted)] rounded-md transition-colors tap-target"
              >
                {u('getQuote')}
                <Icon name="arrow-right" size={16} />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}