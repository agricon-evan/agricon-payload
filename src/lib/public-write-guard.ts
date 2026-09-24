/**
 * Shared enforcement for the two world-writable public collections
 * (`inquiries`, `newsletterSubscribers`).
 *
 * WHY THIS IS A `beforeValidate` HOOK AND NOT `access.create`:
 * Payload does not only run `access.create` when a document is actually being
 * created — it also evaluates every collection's access functions to build the
 * permission set the admin panel receives on *every* admin request. Putting the
 * rate limiter and the spam heuristics inside `access.create` therefore had two
 * consequences, both of them live bugs:
 *
 *   1. Loading any `/admin` page consumed an anonymous rate-limit token for the
 *      visitor's IP. An unauthenticated `/admin/login` has no honeypot or
 *      timing token either, so the guard threw `This submission was rejected`
 *      during render and the whole admin panel answered **500** — the CMS was
 *      unreachable.
 *   2. Even signed-in staff were charged tokens, so after five admin page loads
 *      in ten minutes the guard threw its 429 and the panel broke for them too.
 *
 * Access functions must stay pure predicates; anything with side effects or that
 * can throw belongs in a hook, which only runs for a real create operation.
 *
 * The two anonymous form endpoints keep exactly the protection they had: a
 * per-IP fixed window (`lib/rate-limit.ts`) plus the honeypot/timing/content
 * heuristics (`lib/anti-spam.ts`). Authenticated users are exempt — they
 * legitimately submit without a honeypot/timing token.
 */

import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'
import { checkSpam } from '@/lib/anti-spam'
import { consume, getClientIP } from '@/lib/rate-limit'

export interface PublicWriteGuardOptions {
  /** Rate-limit bucket prefix, normally the collection slug. */
  scope: string
  /** Allowed submissions per IP per window. */
  max?: number
  /** Window length in milliseconds. */
  windowMs?: number
  /** Message returned when this IP is over the limit. */
  rateLimitedMessage: string
  /** Message returned when a spam heuristic rejects the submission. */
  rejectedMessage: string
  /** Label used in server-side log lines. */
  label: string
}

/**
 * Builds a `beforeValidate` hook that rate-limits and spam-checks anonymous
 * creates. Returns the data untouched for updates and for authenticated users.
 */
export const publicWriteGuard = ({
  scope,
  max = 5,
  windowMs = 10 * 60 * 1000,
  rateLimitedMessage,
  rejectedMessage,
  label,
}: PublicWriteGuardOptions): CollectionBeforeValidateHook => {
  return ({ data, operation, req }) => {
    // Only real creations are guarded — admin edits must never be touched.
    if (operation !== 'create') return data
    // Staff bypass the guard: they have no honeypot/timing token and must not be
    // rate limited out of their own CMS.
    if (req.user) return data

    const ip = getClientIP(req.headers)
    const limit = consume(`${scope}:${ip}`, max, windowMs)
    if (!limit.ok) {
      req.payload.logger.warn({ ip, scope }, `${label} rate limited`)
      throw new APIError(rateLimitedMessage, 429)
    }

    const verdict = checkSpam({ data: (data ?? {}) as Record<string, unknown>, ip })
    if (verdict.spam) {
      req.payload.logger.warn({ ip, reason: verdict.reason }, `${label} rejected as spam`)
      // Deliberately generic: telling a bot which signal fired lets it adapt.
      throw new APIError(rejectedMessage, 400)
    }

    return data
  }
}
