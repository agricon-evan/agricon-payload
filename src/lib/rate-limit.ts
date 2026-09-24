/**
 * Minimal in-process fixed-window rate limiter for public write endpoints
 * (inquiries, newsletter signup) and the login route.
 *
 * WHY: `/api/inquiries` and `/api/newsletterSubscribers` are intentionally
 * world-writable (`create: () => true`) so the contact form works for anonymous
 * visitors. Without a limiter a trivial script can flood the database and, via
 * the inquiry `afterChange` hook, flood the sales inbox with notification mail.
 *
 * IMPORTANT LIMITATION — per-instance only:
 * The counter map lives in module memory, so on a serverless platform (Vercel)
 * each concurrent lambda instance keeps its own counts. This bounds abuse to
 * `max × <number of warm instances>` per window rather than a hard global cap.
 * That is a large improvement over "unlimited" and needs no external service.
 * If you need a strict global limit, replace `consume()` with a shared store
 * (Upstash Redis / Vercel KV / Postgres) — the call sites do not change.
 */

interface Window {
  count: number
  /** Epoch ms at which this window expires and the count resets. */
  resetAt: number
}

const buckets = new Map<string, Window>()

/** Hard cap on tracked keys, so a spoofed-IP flood cannot exhaust memory. */
const MAX_TRACKED_KEYS = 10_000

let lastPrune = 0

/**
 * Drops expired windows. Runs at most once per `PRUNE_INTERVAL_MS` so the
 * common path stays O(1) instead of sweeping the whole map per request.
 */
const PRUNE_INTERVAL_MS = 60_000

function prune(now: number): void {
  if (now - lastPrune < PRUNE_INTERVAL_MS && buckets.size < MAX_TRACKED_KEYS) return
  lastPrune = now
  for (const [key, win] of buckets) {
    if (win.resetAt <= now) buckets.delete(key)
  }
  // Still oversized after dropping expired entries (e.g. a burst within one
  // window): drop oldest insertions. Map preserves insertion order.
  if (buckets.size >= MAX_TRACKED_KEYS) {
    const excess = buckets.size - MAX_TRACKED_KEYS + 1
    let i = 0
    for (const key of buckets.keys()) {
      if (i++ >= excess) break
      buckets.delete(key)
    }
  }
}

export interface RateLimitResult {
  ok: boolean
  /** Requests still available in the current window. */
  remaining: number
  /** Seconds until the window resets — suitable for a `Retry-After` header. */
  retryAfterSeconds: number
}

/**
 * Records one request against `key` and reports whether it is allowed.
 *
 * @param key    Stable identity, normally `"<scope>:<client-ip>"`.
 * @param max    Allowed requests per window.
 * @param windowMs Window length in milliseconds.
 */
export function consume(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  prune(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) }
  }

  existing.count += 1
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
  if (existing.count > max) {
    return { ok: false, remaining: 0, retryAfterSeconds }
  }
  return { ok: true, remaining: max - existing.count, retryAfterSeconds }
}

/**
 * Best-effort client IP from proxy headers.
 *
 * `x-forwarded-for` is a comma-separated chain; the *first* entry is the
 * original client. Note these headers are client-spoofable unless the hosting
 * proxy overwrites them — Vercel does, and this is only used for rate limiting,
 * so a forged value degrades to "a different bucket", not an auth bypass.
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return (
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-vercel-forwarded-for') ||
    'unknown'
  )
}

/** Test-only: clears all counters so specs do not leak state between cases. */
export function __resetRateLimit(): void {
  buckets.clear()
  lastPrune = 0
}
