import { notFound } from 'next/navigation'

/**
 * Catch-all for unknown paths under a locale prefix.
 *
 * Why this file exists: `[locale]/not-found.tsx` only renders when a page
 * *calls* `notFound()`. A URL that matches no route at all (`/en/typo`) never
 * enters the `[locale]` tree, so Next falls back to its built-in 404 — an
 * unbranded English page with no header, no footer and no language switcher.
 * Matching the remainder here routes those URLs through `notFound()` so they
 * render the localized boundary inside the locale layout.
 *
 * This is the lowest-priority route in the segment: every real page
 * (`[locale]/products/[category]/…`, `[locale]/search`, …) has a more specific
 * match and is unaffected.
 *
 * Nothing is rendered — `notFound()` throws before this returns.
 */
export default function LocaleCatchAll(): never {
  notFound()
}
