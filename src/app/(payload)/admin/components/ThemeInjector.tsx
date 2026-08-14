"use client"

/**
 * Injects the Agricon brand theme into the admin panel.
 * Payload 3.x has no `admin.css` option, so a style tag is rendered
 * on every admin page instead (component registered under `afterNav`).
 */
const BRAND_CSS = `
:root {
  --agricon-green: #0c5d3f;
  --agricon-green-dark: #0a4d34;
  --agricon-orange: #ee9230;
  --agricon-ink: #16342a;
  --agricon-bg: #fbfaf7;
}

/* Warm paper background (light mode) */
html[data-theme='light'] body { background: var(--agricon-bg); }

/* Primary accent — AGRICON green */
html[data-theme='light'] {
  --theme-color-500: var(--agricon-green);
  --theme-color-550: var(--agricon-green-dark);
  --theme-color-600: var(--agricon-green-dark);
  --theme-color: var(--agricon-green);
}
html[data-theme='dark'] {
  --theme-color-500: #2e9c6c;
  --theme-color-550: #38ad78;
  --theme-color-600: #42bd85;
  --theme-color: #2e9c6c;
}

/* Nav groups — brand green small caps */
.nav__group {
  color: var(--agricon-green);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 10.5px;
}

/* Buttons */
.btn--style-primary { background: var(--agricon-green); border-color: var(--agricon-green); }
.btn--style-primary:hover { background: var(--agricon-green-dark); border-color: var(--agricon-green-dark); }
.btn--style-secondary { color: var(--agricon-green); border-color: var(--agricon-green); }
.btn--style-secondary:hover { background: rgba(12, 93, 63, 0.08); }

/* Active tabs — Harvest orange underline */
.tabs__tab--active,
.table tbody tr.row--selected { box-shadow: inset 0 -2px 0 var(--agricon-orange); }

/* Dashboard cards */
.collection-card:hover .collection-card__title { color: var(--agricon-green); }

/* Login screen accent rule */
.auth__wrap { border-top: 4px solid var(--agricon-orange); }

/* Document title */
.doc-header__title { color: var(--agricon-ink); }
`

export default function ThemeInjector() {
  return <style dangerouslySetInnerHTML={{ __html: BRAND_CSS }} />
}
