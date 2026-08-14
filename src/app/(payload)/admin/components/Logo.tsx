"use client"

/**
 * AGRICON brand mark for the admin panel header & login screen.
 * Flat, print-standard: AGRICON green + Harvest orange rule.
 */
export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="8" fill="#0C5D3F" />
        <path
          d="M24 36V22m0-3a10 10 0 00-10-10h-1.5C12.5 17 17 20 24 20s11.5-3 11.5-11H34a10 10 0 00-10 10zm0 17V28"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="6" y="40" width="36" height="3" rx="1.5" fill="#EE9230" />
      </svg>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 800, fontSize: 17, letterSpacing: '0.14em', color: '#0C5D3F' }}>
          AGRICON
        </div>
        <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b6b63' }}>
          Content Management
        </div>
      </div>
    </div>
  )
}
