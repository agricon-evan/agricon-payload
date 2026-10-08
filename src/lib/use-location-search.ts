'use client'

import { useSyncExternalStore } from 'react'

/**
 * The current `window.location.search` (including the leading `?`), or `''` on the
 * server and during the first client render.
 *
 * WHY NOT `useSearchParams()`
 * ---------------------------
 * `useSearchParams()` is a dynamic API: while the layout rendered a component that
 * called it, every storefront page had to be `force-dynamic`, so nothing could be
 * statically generated and a database outage took the whole site down
 * (docs/MAINTENANCE.md §13). It is also the reason `next build` could not
 * prerender these routes.
 *
 * WHY NOT `useState` + `useEffect`
 * --------------------------------
 * Setting state synchronously inside an effect is exactly the "cascading render"
 * pattern the React compiler lint forbids. `useSyncExternalStore` is the API
 * intended for reading a value that lives outside React, and it gives the
 * hydration-safe server snapshot for free.
 *
 * The subscription is a no-op on purpose: every consumer already re-renders on
 * navigation through `usePathname()`, and the values are only used to build link
 * hrefs, so there is nothing to push. Passing a stable no-op keeps the hook from
 * resubscribing on each render.
 */
const subscribe = () => () => {}
const getSearch = () => window.location.search
const getServerSearch = () => ''

export function useLocationSearch(): string {
  return useSyncExternalStore(subscribe, getSearch, getServerSearch)
}
