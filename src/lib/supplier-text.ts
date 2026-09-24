/**
 * Supplier-page boilerplate scrubbing.
 *
 * Product copy was originally captured from Alibaba supplier pages. Those pages
 * wrap their real content in widget labels and cross-sell blocks, and a few of
 * those labels ended up *inside* our stored copy — most visibly the chain
 *
 *   "Product descriptions from the supplier Report abuse Highlights at a glance …"
 *
 * which was rendering as the opening sentence of 31 of the 43 product overview
 * articles. None of these strings can occur in legitimate Agricon copy, so they
 * are removed rather than rewritten.
 *
 * Two consumers, one source of truth:
 *   - `scripts/import-alibaba-catalogue.ts` — scrubs at import time, so a
 *     re-import can never reintroduce the text;
 *   - `scripts/cleanup-supplier-copy.ts` — scrubs rows that are already stored
 *     (dev SQLite or production Postgres).
 *
 * `findSupplierArtifacts()` is the shared assertion used by both the cleanup
 * script's `--check` mode and `tests/int/supplier-text.int.spec.ts`.
 */

/** Labels that are always boilerplate, wherever they appear in a value. */
const BOILERPLATE_LABELS = [
  'product descriptions from the supplier',
  'product description from the supplier',
  'report abuse',
  'highlights at a glance',
  // Scraped page furniture that sits directly above the real article in some
  // products ("Suitable Applications Product Details HAMMER MILL CRUSHER
  // Cyclone Outlet, Dust-Free Integrated cyclone dust collection…"). These are
  // section headings of the supplier page, not part of any sentence.
  'suitable applications',
  'product details',
  'product description',
  'company profile',
  // The supplier page's own section menu, captured as a single run of text at
  // the top of the article ("Product Overview Complete Farm Solution Proof of
  // Execution Project Cases PREMIUM H-TYPE BROILER CAGE SYSTEMS …").
  'product overview',
  'complete farm solution',
  'proof of execution',
  'project cases',
] as const

/**
 * Markers that mean "everything from here on belongs to a different product" —
 * Alibaba's cross-sell widgets. Detected, never silently trimmed mid-article;
 * see `isCrossSellText()`.
 */
const CROSS_SELL_MARKERS = [
  'frequently bought together',
  'you may also like',
  'video description',
  'recommended for you',
] as const

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const labelsRe = () => new RegExp(BOILERPLATE_LABELS.map(escapeRegExp).join('|'), 'gi')

/** True when the captured block is a cross-sell widget rather than a description. */
export function isCrossSellText(raw: string | null | undefined): boolean {
  const head = (raw || '').slice(0, 400).toLowerCase()
  return CROSS_SELL_MARKERS.some((marker) => head.includes(marker))
}

/**
 * Which boilerplate/marker strings are still present. Empty array means clean.
 * Used as the pass/fail assertion after scrubbing.
 */
export function findSupplierArtifacts(value: string | null | undefined): string[] {
  if (!value) return []
  const lower = value.toLowerCase()
  const found = [...BOILERPLATE_LABELS, ...CROSS_SELL_MARKERS].filter((label) => lower.includes(label))
  // "product description" is a substring of "product descriptions from the
  // supplier"; reporting both would double-count one artifact.
  return found.filter((label) => !found.some((other) => other !== label && other.includes(label)))
}

/**
 * Removes the boilerplate labels from plain text or HTML.
 *
 * Tags are never consumed — only the label text is replaced with a single space —
 * so `<p>Product descriptions from the supplier Report abuse Highlights at a
 * glance Hot dip…</p>` becomes `<p>Hot dip…</p>` and the markup stays balanced.
 */
export function stripSupplierBoilerplate(input: string | null | undefined): string {
  if (!input) return ''
  let out = input.replace(labelsRe(), ' ')

  out = out
    // collapse the gaps the removals left behind
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/(<(?:p|h2|h3|li|div)[^>]*>)\s+/gi, '$1')
    .replace(/\s+(<\/(?:p|h2|h3|li|div)>)/gi, '$1')
    // drop paragraphs that are now empty (e.g. a <p> that held only a label)
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/^\s+|\s+$/g, '')

  return out
}

/**
 * Plain-text variant: same scrubbing plus whitespace normalisation, for
 * `description` / `seoDescription`-style single-line fields.
 */
export function sanitizeSupplierText(input: string | null | undefined): string {
  return stripSupplierBoilerplate(input)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Matches a literal `\uXXXX` (backslash, u, four hex digits) in stored text. */
const LITERAL_ESCAPE_RE = /\\u([0-9a-fA-F]{4})/g

/**
 * Decodes literal `\uXXXX` sequences that were stored as *text* rather than as
 * characters.
 *
 * The supplier scrape holds emoji as escaped JSON (`\uD83C\uDFED`), and one pass
 * through the importer escaped the backslash again, so 65 product features ended
 * up storing the 12-character string `\uD83C\uDFED` — which is what the product
 * page rendered next to the feature name instead of the emoji.
 *
 * Only well-formed `\uXXXX` pairs are touched, so ordinary copy containing a
 * backslash is left alone. Surrogate pairs (`\uD83C\uDFED`) are decoded as two
 * code units, which is exactly what the original JSON escape meant.
 */
export function decodeLiteralUnicodeEscapes(input: string | null | undefined): string {
  if (!input || !input.includes('\\u')) return input || ''
  return input.replace(LITERAL_ESCAPE_RE, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
}

/** True when the value still carries literal `\uXXXX` escapes. */
export function hasLiteralUnicodeEscapes(input: string | null | undefined): boolean {
  if (!input) return false
  LITERAL_ESCAPE_RE.lastIndex = 0
  return LITERAL_ESCAPE_RE.test(input)
}

/**
 * Flattens stored overview HTML into readable plain text.
 *
 * `toOverviewHtml()` turns the supplier's "Heading: body" run into
 * `<h3>Heading</h3><p>body</p>`. When that is flattened for a summary, the
 * heading must keep a terminator or it runs into the body ("Multiple Capacity
 * Options Available in six models…"), so headings become sentences.
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<\s*(h[1-6])[^>]*>/gi, ' ')
    .replace(/<\s*\/\s*h[1-6]\s*>/gi, '. ')
    .replace(/<\s*(br|li|\/p|\/div|\/li)\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Builds a short marketing summary that always ends on a sentence or word
 * boundary.
 *
 * `shortDesc()` in the importer used to take a hard 260-character slice and only
 * back off to a sentence end when one happened to appear after character 80.
 * Supplier copy is written as "Label: body Label: body" with few full stops, so
 * the fallback fired constantly: 22 of 43 product descriptions were stored cut
 * mid-word ("…significantly reducing", "…by up to 80 perce", one was just
 * "This 4."), and those fragments are what the product header and the meta
 * description showed.
 *
 * Behaviour: prefer the last sentence end inside `maxChars`; if the text has no
 * usable sentence end, cut at the last word boundary instead of mid-word and
 * mark the truncation with an ellipsis. Never returns a partial word.
 */
export function summarizeCopy(raw: string | null | undefined, maxChars = 260, minChars = 80): string | null {
  const decoded = decodeLiteralUnicodeEscapes(raw)
  // The supplier blurb is a run of "Heading: body" blocks, and the overview HTML
  // preserves the heading. A header sentence should start with the claim, not
  // with the label, so a leading label (short, no sentence punctuation) is
  // dropped: "Hot Dip Galvanized Surface Treatment For Long Lasting Durability:
  // Each cage frame…" → "Each cage frame…".
  const labelled = sanitizeSupplierText(decoded)
  const labelMatch = labelled.match(/^([^.!?]{4,80}?):\s+(?=\S)/)
  const unlabelled = labelMatch ? labelled.slice(labelMatch[0].length).trim() : labelled

  // Some articles run the section heading straight into the first sentence with
  // no separator at all — "Hot Dip Galvanized Steel Wire Construction The rabbit
  // cage frame is manufactured from…". The heading is page furniture, so the
  // summary opens on the claim instead.
  const gluedHeading = unlabelled.match(
    /^([A-Z][^.!?:;]{8,70}?)\s+(?=(?:The|This|These|Those|It|Our|Each|All|With|Made|Available|Designed|Built|Integrated|Precision|Handles|Provides)\b)/,
  )
  const text = gluedHeading ? unlabelled.slice(gluedHeading[0].length).trim() : unlabelled
  if (!text) return null

  // Sentence-aware path, scanning slightly past the limit so a 265-character
  // sentence is kept whole rather than truncated at 260. A terminator counts
  // when it is followed by whitespace *or* ends the scanned window (a sentence
  // that ends exactly at the boundary must not be treated as unterminated).
  const window = text.slice(0, maxChars + 40)
  const sentenceRe = /[.!?](?=\s|$)/g
  let lastEnd = -1
  for (let m = sentenceRe.exec(window); m; m = sentenceRe.exec(window)) lastEnd = m.index
  if (lastEnd >= minChars) return text.slice(0, lastEnd + 1).trim()

  if (text.length <= maxChars) {
    // Short copy that simply has no final punctuation — return it whole rather
    // than pretending it was truncated.
    return text
  }

  const cut = text.slice(0, maxChars)
  // Always fall back to the last complete word. (An earlier version kept the raw
  // cut whenever the word boundary fell before `minChars`, which is exactly how
  // "…significantly reducing" and "This 4." got stored.)
  const wordBoundary = cut.lastIndexOf(' ')
  const body = (wordBoundary > 0 ? cut.slice(0, wordBoundary) : cut).trim()
  return `${body.replace(/[,;:.\s]+$/, '')}…`
}

/**
 * A short factual header line for products whose supplier page carries no
 * description at all. **Only spec values are used — nothing is invented**; the
 * sentence template is fixed.
 *
 * Two shapes, because the catalogue has two kinds of product:
 *
 *  1. cages — described by `animal cage type` / `type` plus capacity and animal;
 *  2. machines and incubators — no cage type, and their own `type` is a generic
 *     word ("Automatic", "Home", "Digital"), so the feature/application spec is
 *     the noun instead and capacity carries the size.
 *
 * Returns null when neither shape has enough to say, in which case the page keeps
 * its own generic copy (a keyword-stuffed product name reads badly mid-sentence).
 */
export function describeFromSpecs(specs: Array<{ label?: string; value?: string }>): string | null {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const hit = specs.find((s) => (s.label || '').toLowerCase().trim() === k.toLowerCase())
      if (hit?.value) return hit.value.trim()
    }
    return ''
  }

  // Spec values arrive in Title Case; mid-sentence they must be lowercased, but
  // keep acronyms (ABS, PVC, H). Split on spaces AND slashes so "Diesel/Gasoline"
  // lowercases.
  const smartLower = (s: string) =>
    s
      .split(/([ /])/)
      .map((chunk) => {
        if (!chunk.trim() || chunk === '/') return chunk
        const core = chunk.replace(/[^A-Za-z]/g, '')
        if (core.length >= 1 && core === core.toUpperCase()) return chunk
        return chunk.charAt(0).toLowerCase() + chunk.slice(1)
      })
      .join('')

  const GENERIC = /^(home|other|new|none|automatic|digital|manual|yes|no)$/i
  const type = get('type', 'animal cage type')
  const cageType = get('animal cage type')
  // Spec values are typed by hand upstream: "48--96 Eggs", "98" for a percentage.
  // Normalise ranges and percentages so the sentence reads like prose.
  const normalise = (s: string) => s.replace(/(\d)\s*-{2,}\s*(\d)/g, '$1–$2').replace(/\s+/g, ' ').trim()
  const capacity = normalise(get('capacity', 'egg capacity'))
  const selling = get('key selling points')
  const engine = get('engine type')
  const use = get('use', 'usage')
  const condition = get('condition')
  const warranty = get('warranty')
  const rawRate = normalise(get('hatching rate'))
  const hatchingRate = rawRate && /^\d+(\.\d+)?$/.test(rawRate) ? `${rawRate}%` : rawRate

  const typeUseful = type && type.length > 3 && !GENERIC.test(type)

  let subject = ''
  if (cageType) {
    subject = [capacity, smartLower(cageType), use ? smartLower(use) : '', 'cage'].filter(Boolean).join(' ')
  } else if (typeUseful) {
    subject = [capacity, smartLower(type), use ? `for ${smartLower(use)}` : ''].filter(Boolean).join(' ')
  } else {
    // Shape 2 — machines and incubators. The feature/application spec names the
    // product ("Full-automatic Digital Eggs Incubator"), capacity sizes it.
    const noun = get('feature', 'application')
    if (!noun || !capacity) return null
    subject = `${capacity} ${smartLower(noun)}`.replace(/\s+/g, ' ')
  }

  const clauses: string[] = []
  if (selling && !GENERIC.test(selling)) clauses.push(smartLower(selling))
  if (hatchingRate) clauses.push(`${smartLower(hatchingRate)} hatching rate`)
  if (engine) clauses.push(`powered by ${smartLower(engine)}`)
  if (condition && warranty) clauses.push(`${smartLower(condition)} and supplied with a ${smartLower(warranty)} warranty`)
  else if (warranty) clauses.push(`supplied with a ${smartLower(warranty)} warranty`)
  else if (condition) clauses.push(smartLower(condition))

  let text = subject
  if (clauses.length) text += ', ' + clauses.join(', ')
  text += '. Send your capacity and site requirements for a matched quotation.'

  text = text.replace(/\s+/g, ' ').replace(/,\s*\./g, '.').replace(/\s+,/g, ',').trim()
  text = text.charAt(0).toUpperCase() + text.slice(1)
  return text.length > 40 ? text : null
}
