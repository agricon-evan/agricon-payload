/**
 * Repair product descriptions that were stored truncated mid-word, and decode
 * literal `\uXXXX` escapes that were stored as text instead of characters.
 *
 * Two data defects, both introduced by the original catalogue import:
 *
 *  1. **Truncated descriptions.** `shortDesc()` took a hard 260-character slice
 *     of the supplier blurb and only backed off to a sentence end when one
 *     happened to appear after character 80. Supplier copy is written as
 *     "Label: body Label: body" with few full stops, so 22 of 43 products shipped
 *     a header sentence such as "…significantly reducing", "…by up to 80 perce"
 *     or, worst case, just "This 4.".
 *     The complete text is still available: the product's own `overviewHtml` is
 *     the full detail article, so the summary is re-derived from it with
 *     `summarizeCopy()` (sentence- then word-boundary aware).
 *
 *  2. **Literal `\uXXXX` escapes.** 65 feature strings store the 12-character
 *     text `\uD83C\uDFED` rather than the emoji, which is what the product page
 *     rendered. `decodeLiteralUnicodeEscapes()` converts them back.
 *
 *   pnpm tsx scripts/repair-product-copy.ts            # dry run
 *   pnpm tsx scripts/repair-product-copy.ts --apply    # write
 *   pnpm tsx scripts/repair-product-copy.ts --check    # exit 1 while either defect remains
 *
 * Runs against whatever database `DATABASE_URI` / `POSTGRES_URL` points at, so
 * the production instance can be repaired with the same command. Idempotent.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import {
  decodeLiteralUnicodeEscapes,
  hasLiteralUnicodeEscapes,
  htmlToPlainText,
  summarizeCopy,
} from '../src/lib/supplier-text'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const checkOnly = args.has('--check')

/**
 * A description is considered broken when it is implausibly short or stops
 * without closing punctuation.
 *
 * Length matters: "This 4." *does* end with a period, so a punctuation-only
 * check called it healthy and left one product page showing seven characters.
 */
const MIN_SANE_LENGTH = 60
const isBrokenDescription = (text: string): boolean =>
  text.trim().length < MIN_SANE_LENGTH || !/[.!?…]$/.test(text.trim())

async function main() {
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  const { docs: products } = await payload.find({
    collection: 'products',
    locale: 'en',
    depth: 0,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })

  let broken = 0
  let descRepaired = 0
  let alreadyClean = 0
  let escapes = 0
  let featuresRepaired = 0
  let unresolved = 0
  const samples: string[] = []
  const escapeSamples: string[] = []

  for (const product of products as Array<Record<string, unknown>>) {
    const slug = String(product.slug)
    const current = typeof product.description === 'string' ? product.description : ''

    // ── 1. description ──────────────────────────────────────────────────────
    // Re-derived from the product's own overviewHtml (the full detail article),
    // which makes the repair deterministic and idempotent: running it twice
    // produces the same value.
    const source = htmlToPlainText(typeof product.overviewHtml === 'string' ? product.overviewHtml : '')
    const next = summarizeCopy(source)

    if (!next) {
      unresolved++
      if (isBrokenDescription(current)) {
        broken++
        console.log(`  ! ${slug}: no usable source text and the current description looks truncated`)
      }
    } else if (next !== current) {
      if (isBrokenDescription(current)) broken++
      if (samples.length < 6) {
        samples.push(
          `  ${slug}\n      before: ${JSON.stringify(current)}\n      after : ${JSON.stringify(next)}`,
        )
      }
      if (apply) {
        await payload.update({
          collection: 'products',
          id: product.id as never,
          locale: 'en',
          depth: 0,
          overrideAccess: true,
          data: { description: next },
        })
        descRepaired++
      }
    } else {
      // Already derived from the current overviewHtml — nothing to do.
      alreadyClean++
    }

    // ── 2. features with literal \uXXXX escapes ─────────────────────────────
    const features = (product.features as Array<{ id?: string; feature?: string }>) || []
    const dirtyFeatures = features
      .map((f, index) => ({ index, id: f.id, value: f.feature || '' }))
      .filter((f) => hasLiteralUnicodeEscapes(f.value))

    if (dirtyFeatures.length) {
      escapes += dirtyFeatures.length
      if (escapeSamples.length < 4) {
        escapeSamples.push(`  ${slug}: ${JSON.stringify(dirtyFeatures[0].value)}`)
      }
      if (apply) {
        const nextFeatures = features.map((f) => ({
          ...f,
          feature: decodeLiteralUnicodeEscapes(f.feature || ''),
        }))
        await payload.update({
          collection: 'products',
          id: product.id as never,
          locale: 'en',
          depth: 0,
          overrideAccess: true,
          data: { features: nextFeatures },
        })
        featuresRepaired += dirtyFeatures.length
      }
    }
  }

  console.log(`\nproducts scanned: ${products.length}`)
  console.log(`descriptions repaired or still truncated: ${broken}${unresolved ? ` (${unresolved} without source text)` : ''}`)
  console.log(`feature strings holding literal \\uXXXX escapes: ${escapes}`)
  if (samples.length) {
    console.log('\ndescription samples:')
    for (const s of samples) console.log(s)
  }
  if (escapeSamples.length) {
    console.log('\nescape samples:')
    for (const s of escapeSamples) console.log(s)
  }
  console.log(`descriptions already up to date: ${alreadyClean}`)
  if (apply) {
    console.log(`\ndescriptions rewritten: ${descRepaired}`)
    console.log(`features decoded: ${featuresRepaired}`)
  } else {
    console.log('\ndry run — re-run with --apply to write the repairs')
  }

  if (checkOnly && (broken > 0 || escapes - (featuresRepaired ? escapes : 0) > 0)) {
    console.error('\n--check: product copy defects are still present')
    process.exit(1)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

