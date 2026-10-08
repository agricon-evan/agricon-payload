'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { locales } from '@/i18n/config'
import { useLocationSearch } from '@/lib/use-location-search'

/**
 * The footer's language links, as a client component.
 *
 * WHY THIS IS A SEPARATE CLIENT COMPONENT
 * ---------------------------------------
 * The links must keep the visitor on the same page when they switch language
 * (`/en/search?q=cage` → `/ru/search?q=cage`). The page path and query string are
 * per-REQUEST data, and this used to be solved by injecting them into the request
 * from middleware (`src/proxy.ts` sets `x-pathname` / `x-search`) and reading
 * them with `headers()` in the layout.
 *
 * `headers()` is a dynamic API: it forces the whole route tree to render on every
 * request, which is why every storefront page was `force-dynamic`. Removing it is
 * what lets these pages be statically generated. `usePathname()` and
 * `window.location` give the same information on the client, where the language
 * links are actually clicked, without opting the page out of static rendering.
 *
 * The query string is read in an effect rather than during render because it does
 * not exist during static generation — rendering it from state keeps the markup
 * hydration-safe and still yields a real `<Link href>` (so middle-click and
 * "copy link address" keep working, which an onClick-only handler would break).
 */
interface Props {
  locale: string
  /** Classes for every link; the active locale adds `activeClassName`. */
  className?: string
  activeClassName?: string
}

export default function LanguageLinks({ locale, className = '', activeClassName = '' }: Props) {
  const pathname = usePathname() || `/${locale}`
  const search = useLocationSearch()

  const localizedHref = (target: string): string => {
    let rest = pathname
    for (const l of locales) {
      if (pathname === `/${l}`) {
        rest = ''
        break
      }
      if (pathname.startsWith(`/${l}/`)) {
        rest = pathname.slice(l.length + 1)
        break
      }
    }
    return `/${target}${rest}${search}`
  }

  return (
    <div className="flex gap-4">
      {locales.map((loc) => (
        <Link
          key={loc}
          href={localizedHref(loc)}
          className={`${className}${loc === locale ? ` ${activeClassName}` : ''}`}
        >
          {loc}
        </Link>
      ))}
    </div>
  )
}
