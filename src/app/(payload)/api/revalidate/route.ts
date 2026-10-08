import { NextResponse } from 'next/server'
import { PAYLOAD_TAGS, revalidatePayloadCaches } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/**
 * Drops every cached CMS read, so an edit made in the admin appears immediately
 * instead of after the six-hour cache window.
 *
 * WHY THIS IS A ROUTE AND NOT A COLLECTION HOOK
 * ---------------------------------------------
 * See the header of `src/lib/revalidate.ts`: wiring `next/cache` into
 * `payload.config.ts` breaks the admin panel, because the config is loaded
 * through a module graph that does not go through Next's resolver. A route is
 * the one place where `revalidateTag` is guaranteed to resolve and run in the
 * right process.
 *
 * USAGE — after publishing changes in /admin:
 *
 *   curl -X POST "https://www.agricon.cn/api/revalidate" \
 *        -H "x-revalidate-secret: $PAYLOAD_SECRET"
 *
 * The secret is the existing `PAYLOAD_SECRET` env var, so there is nothing new
 * to configure. It is required: an open endpoint that forces a full cache
 * rebuild would let anyone generate database wake-ups at will, which is exactly
 * the resource the plan's quota meters.
 *
 * Cost is one burst of queries, not one per visitor — the cache is repopulated
 * on the next request for each page.
 */
export async function POST(req: Request) {
  const expected = process.env.PAYLOAD_SECRET
  const provided =
    req.headers.get('x-revalidate-secret') ?? new URL(req.url).searchParams.get('secret')

  if (!expected || provided !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  revalidatePayloadCaches()
  return NextResponse.json({
    ok: true,
    revalidated: PAYLOAD_TAGS.length,
    at: new Date().toISOString(),
  })
}

/** GET is refused so the secret cannot be left in a browser history or crawler log. */
export async function GET() {
  return NextResponse.json({ ok: false, error: 'use POST' }, { status: 405 })
}
