import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Liveness probe for the storefront's database.
 *
 * WHY: the 2026-10-08 outage was not detected until a visitor hit a 500. The
 * production database is a Neon free-plan project whose compute-hour quota
 * (100 CU-hours per project per month) can run out at any moment, and when it
 * does Neon refuses EVERY connection with `SQLSTATE 53000` — no partial
 * degradation, no warning, no slow queries beforehand.
 *
 * This endpoint makes that state machine-checkable, so a free uptime monitor can
 * alert on it (and on the site generally) before a customer notices. Point the
 * monitor at `https://www.agricon.cn/api/health` and treat anything other than
 * HTTP 200 as down.
 *
 * The query is deliberately trivial — one row, one column — so polling it does
 * not itself consume compute. Still, do not poll faster than every few minutes:
 * each request wakes the Neon compute, which is the very thing that ran out.
 * Once an hour is plenty for a quota that resets monthly; every 5 minutes is a
 * reasonable compromise for uptime alerting.
 *
 * NOTE: this route is deliberately NOT listed in `sitemap.ts`, and `/api/` is
 * disallowed in `robots.ts`.
 */
export async function GET() {
  const started = Date.now()
  try {
    const payload = await getPayloadClient()
    await payload.find({ collection: 'products', limit: 1, depth: 0, select: { slug: true } })
    return NextResponse.json(
      { ok: true, db: 'up', ms: Date.now() - started },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    const e = (err ?? {}) as { code?: string; name?: string }
    // Report the SQLSTATE only — enough to distinguish "quota exhausted" (53000)
    // from a real bug, without echoing connection strings or query text.
    return NextResponse.json(
      { ok: false, db: 'down', code: e.code ?? e.name ?? 'unknown', ms: Date.now() - started },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
