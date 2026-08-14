import type { Metadata } from 'next'
import { locales, type Locale } from '@/i18n/config'

/** 站点规范域名（与 sitemap.ts 保持一致） */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.agricon.com').replace(/\/$/, '')

/**
 * 生成当前页面的 hreflang 与 canonical。
 * path 为相对 locale 的路径，如 ''（首页）或 '/about'。
 */
export function localizedAlternates(locale: Locale, path: string): Metadata['alternates'] {
  const rel = path === '' ? '' : path.startsWith('/') ? path : `/${path}`
  return {
    canonical: `/${locale}${rel}`,
    languages: Object.fromEntries(
      locales.map((l) => [`${l}`, `/${l}${rel}`]),
    ) as Record<string, string>,
  }
}

/** 从 /{locale}/xxx 形式的 pathname 提取 locale 之外的相对路径（如 /about） */
export function stripLocaleFromPath(pathname: string, locale: string): string {
  const segs = pathname.split('/').filter(Boolean)
  if (segs.length > 0 && segs[0] === locale) segs.shift()
  return segs.length ? `/${segs.join('/')}` : ''
}
