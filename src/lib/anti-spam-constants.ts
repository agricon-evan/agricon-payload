/**
 * Anti-spam field names shared by the client forms and the server checks.
 *
 * This module MUST stay dependency-free and side-effect-free: client components
 * (`ContactForm`, `Newsletter`) import it to build their payloads, while
 * `lib/anti-spam.ts` imports it for the server-side heuristics. Keeping the
 * names in one place is why the honeypot cannot silently drift out of sync.
 */

/** Hidden field. Real users never see or fill it; naive bots fill everything. */
export const HONEYPOT_FIELD = 'companyWebsite'

/** Field carrying the epoch-ms timestamp of when the form was first rendered. */
export const RENDERED_AT_FIELD = 'renderedAt'
