"use client"

/**
 * Injects the Agricon brand theme into the admin panel.
 * Payload 3.x has no `admin.css` option, so a style tag is rendered
 * on every admin page instead (component registered under `afterNav`).
 *
 * Covers:
 *  - Brand colors (AGRICON green / Harvest orange)
 *  - Left sidebar: group badges, link hover/active states, spacing
 *  - Single-language editing: hides the content locale switcher (admin stays in English)
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

/* ─────────────────────────────────────────────
   Left sidebar
   ───────────────────────────────────────────── */
.nav {
  background: var(--theme-elevation-50, #ffffff);
  border-right: 1px solid var(--theme-elevation-150, #e6e4de);
}
.nav__wrap { padding: 6px 10px 16px; }

/* Group headers — brand green badge */
.nav-group__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 7px;
  width: 100%;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-bottom: 1px solid var(--theme-elevation-100, #f0eee8);
  margin-bottom: 4px;
}
.nav-group__toggle:hover { background: rgba(12, 93, 63, 0.05); }
.nav-group__label {
  color: var(--agricon-green);
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 10.5px;
  flex: 1;
  text-align: left;
}
/* Orange square badge before the group title */
.nav-group__toggle::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--agricon-orange);
  flex-shrink: 0;
}
.nav-group__indicator { flex-shrink: 0; }

/* Nav links */
.nav__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px 7px 16px;
  margin: 1px 0;
  border-radius: 6px;
  color: var(--theme-elevation-700, #52525b);
  font-size: 13px;
  font-weight: 500;
  transition: background .12s ease, color .12s ease;
}
.nav__link:hover {
  background: rgba(12, 93, 63, 0.07);
  color: var(--agricon-green);
}
.nav__link--active {
  background: rgba(12, 93, 63, 0.09);
  color: var(--agricon-green);
  font-weight: 700;
}
/* Active indicator — Harvest orange left rule */
.nav__link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 2px;
  background: var(--agricon-orange);
}
/* Per-collection glyph — small green dot */
.nav__link-label::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.55;
  margin-right: 2px;
  vertical-align: middle;
}

/* Nav bottom controls */
.nav__controls {
  border-top: 1px solid var(--theme-elevation-100, #f0eee8);
  padding-top: 8px;
  margin-top: 8px;
}
.nav__log-out { color: var(--theme-elevation-600, #71717a); }
.nav__log-out:hover { color: #b3261e; }

/* ─────────────────────────────────────────────
   Single-language editing — hide locale switcher
   (content stays English in the admin; storefront
   keeps its localized data via fallback)
   ───────────────────────────────────────────── */
.localizer,
.app-header__localizer,
[class*='localizer'] {
  display: none !important;
}

/* ─────────────────────────────────────────────
   Misc brand touches
   ───────────────────────────────────────────── */
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
