/**
 * Lightweight, dependency-free anti-spam checks for the two publicly writable
 * collections (`inquiries`, `newsletterSubscribers`).
 *
 * These are deliberately *cheap heuristics*, not a security boundary. They stop
 * the overwhelming majority of drive-by form spam (which is automated, generic
 * and does not execute JavaScript) at zero cost and with no third-party service.
 * They are paired with `lib/rate-limit.ts`, which bounds request volume.
 *
 * Threat model note: a determined attacker who reads this file can defeat every
 * check here. The goal is to make mass automated abuse unattractive, not to make
 * it impossible. If spam ever gets through, add a CAPTCHA — the checks below
 * remain useful as a first filter that avoids paying for CAPTCHA verification on
 * obvious junk.
 */

import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from '@/lib/anti-spam-constants'

export { HONEYPOT_FIELD, RENDERED_AT_FIELD }

/** A human cannot read and complete the form faster than this. */
const MIN_FILL_MS = 2_500

/** Beyond this, the token is stale (tab left open overnight) — treat as replay. */
const MAX_FILL_MS = 12 * 60 * 60 * 1000

export interface SpamCheckInput {
  /** Raw submitted data. Unknown keys are expected — this is a honeypot probe. */
  data: Record<string, unknown>
  /** Client IP, used only for logging so operators can spot a campaign. */
  ip?: string
}

export interface SpamCheckResult {
  spam: boolean
  /** Machine-readable reason, logged server-side. Never shown to the submitter. */
  reason?: string
}

/** Substrings that essentially never appear in a legitimate Agricon inquiry. */
const SPAM_KEYWORDS = [
  'seo services',
  'backlink',
  'guest post',
  'buy now cheap',
  'viagra',
  'casino',
  'crypto investment',
  'loan offer',
  'bitcoin doubler',
  'work from home',
  'mass email',
  'telegram @',
]

/**
 * Matches an inline URL or bare `www.` host.
 *
 * NOTE: no `g` flag. A global regex is stateful (`lastIndex` persists between
 * `String.match` calls), which makes `countLinks` return different answers for
 * the same input on successive invocations — a latent bug that only shows up
 * under repeated submissions. `String.match` with a non-global regex returns all
 * capture groups for the first match, so counting is done with `matchAll` below.
 */
const SPAM_LINK_PATTERN = /https?:\/\/|www\./i

const countLinks = (value: string): number => {
  let count = 0
  const re = new RegExp(SPAM_LINK_PATTERN.source, 'gi')
  while (re.exec(value) !== null) count++
  return count
}

/**
 * Evaluates a submission. Returns `{ spam: false }` for anything that looks
 * like a normal user, and `{ spam: true, reason }` otherwise.
 */
export function checkSpam({ data, ip }: SpamCheckInput): SpamCheckResult {
  // 1. Honeypot — must be absent or empty.
  const honeypot = data[HONEYPOT_FIELD]
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return { spam: true, reason: `honeypot filled ip=${ip ?? 'unknown'}` }
  }
  // A non-string honeypot (array/object) is also bot behaviour.
  if (honeypot !== undefined && honeypot !== null && typeof honeypot !== 'string') {
    return { spam: true, reason: `honeypot non-string ip=${ip ?? 'unknown'}` }
  }

  // 2. Timing — a token must be present and within a plausible human window.
  const renderedAtRaw = data[RENDERED_AT_FIELD]
  if (renderedAtRaw === undefined || renderedAtRaw === null || renderedAtRaw === '') {
    return { spam: true, reason: `missing ${RENDERED_AT_FIELD} ip=${ip ?? 'unknown'}` }
  }
  const renderedAt = Number(renderedAtRaw)
  if (!Number.isFinite(renderedAt) || renderedAt <= 0) {
    return { spam: true, reason: `invalid ${RENDERED_AT_FIELD} ip=${ip ?? 'unknown'}` }
  }
  const elapsed = Date.now() - renderedAt
  if (elapsed < MIN_FILL_MS) {
    return { spam: true, reason: `submitted in ${elapsed}ms (min ${MIN_FILL_MS}) ip=${ip ?? 'unknown'}` }
  }
  if (elapsed > MAX_FILL_MS) {
    return { spam: true, reason: `stale token ${elapsed}ms ip=${ip ?? 'unknown'}` }
  }

  // 3. Content heuristics over every string in the payload.
  const strings = collectStrings(data)
  const haystack = strings.join('\n').toLowerCase()

  for (const keyword of SPAM_KEYWORDS) {
    if (haystack.includes(keyword)) {
      return { spam: true, reason: `keyword "${keyword}" ip=${ip ?? 'unknown'}` }
    }
  }

  // Link flooding: no legitimate inquiry needs many URLs.
  if (countLinks(haystack) > 4) {
    return { spam: true, reason: 'link flood ip=' + (ip ?? 'unknown') }
  }

  // Cyrillic in a field that is expected to be Latin (company/product names).
  // Catches the very common "Russian link farm" contact-form blast.
  const latinOnlyFields = ['name', 'company', 'email']
  for (const field of latinOnlyFields) {
    const value = data[field]
    if (typeof value === 'string' && /[\u0400-\u04FF]/.test(value)) {
      return { spam: true, reason: `cyrillic in "${field}" ip=${ip ?? 'unknown'}` }
    }
  }

  return { spam: false }
}

/**
 * CMS field definitions for submissions made *without* JavaScript.
 *
 * The real site sends the honeypot value inside the POST body, which Payload
 * discards silently because these fields are `virtual`. That is what we want:
 * a bot that scrapes the rendered HTML sees a plausible "Company website" input
 * and fills it, but a browser-driven submission never carries the trip value
 * into the stored document.
 *
 * `virtual: true` is essential — without it a spammer could *store* the honeypot
 * text in the CMS, and the fields would also show up as noise in the admin list.
 * `admin.hidden` keeps them out of the edit form.
 */
export const antiSpamFields = [
  {
    name: HONEYPOT_FIELD,
    type: 'text' as const,
    virtual: true,
    label: 'Company website',
    admin: {
      hidden: true,
      description: 'Leave blank. Hidden anti-spam field — must not be filled in.',
    },
  },
  {
    name: RENDERED_AT_FIELD,
    type: 'text' as const,
    virtual: true,
    admin: { hidden: true, description: 'Hidden anti-spam timestamp set by the form.' },
  },
]

/**
 * Flattens every string value in a nested payload so heuristics do not miss
 * text nested inside arrays (e.g. `productInterest[].product`).
 */
function collectStrings(value: unknown, depth = 0): string[] {
  if (depth > 5) return []
  if (typeof value === 'string') return [value]
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)]
  if (Array.isArray(value)) return value.flatMap((v) => collectStrings(v, depth + 1))
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((v) => collectStrings(v, depth + 1))
  }
  return []
}
