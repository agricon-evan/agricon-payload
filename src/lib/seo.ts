import type { Metadata } from 'next'
import { getTranslations, locales, type Locale } from '@/i18n/config'

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

/**
 * 页面级 metadata。
 *
 * **每个页面都必须调用它**：`[locale]/layout.tsx` 只提供兜底 title/description，
 * 页面若不覆盖就会原样继承 —— 这正是之前 14 个页面 `<title>` 完全相同的根因
 * （搜索引擎无法区分这些页面）。
 *
 * 若传入的 `namespace` 里有 `hero.title` / `hero.description`，优先用它们
 * （因此 metadata 会跟随页面文案自动多语言）；否则用传入的英文兜底。
 */
export function pageMetadata(
  locale: Locale,
  {
    path,
    namespace,
    title,
    description,
  }: { path: string; namespace?: string; title: string; description: string },
): Metadata {
  let hero: { title?: string; description?: string } = {}
  if (namespace) {
    const t = getTranslations(locale, namespace) as { hero?: { title?: string; description?: string } }
    hero = t.hero ?? {}
  }
  return {
    title: hero.title || title,
    description: hero.description || description,
    alternates: localizedAlternates(locale, path),
  }
}

/** 从 /{locale}/xxx 形式的 pathname 提取 locale 之外的相对路径（如 /about） */
export function stripLocaleFromPath(pathname: string, locale: string): string {
  const segs = pathname.split('/').filter(Boolean)
  if (segs.length > 0 && segs[0] === locale) segs.shift()
  return segs.length ? `/${segs.join('/')}` : ''
}
