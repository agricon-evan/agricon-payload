/**
 * Remove Alibaba supplier-page boilerplate from content that is already stored.
 *
 * The labels ("Product descriptions from the supplier", "Report abuse",
 * "Highlights at a glance") were captured with the supplier copy and ended up as
 * the opening sentence of most product overview articles. The importer now
 * scrubs them (`src/lib/supplier-text.ts`); this script repairs rows that were
 * written before that, in **whatever database `DATABASE_URI` / `POSTGRES_URL`
 * points at** — the local SQLite file or the production Postgres instance.
 *
 * Every localized value is scrubbed too, so a language that has translations
 * cannot keep the junk in its own copy.
 *
 *   pnpm tsx scripts/cleanup-supplier-copy.ts            # dry run (default)
 *   pnpm tsx scripts/cleanup-supplier-copy.ts --apply    # write the fixes
 *   pnpm tsx scripts/cleanup-supplier-copy.ts --check    # exit 1 if junk exists (CI)
 *
 * Idempotent: re-running after `--apply` reports zero changes.
 *
 * NOTE on the dry-run count: Payload's local API serves the default-locale value
 * as a fallback when a locale has no translation of its own, so a record that is
 * only stored in English is reported once per locale (6×). That is why the
 * dry-run total is larger than the number of rows `--apply` actually rewrites —
 * the extra reports are fallbacks, not separate stored copies.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import {
  decodeLiteralUnicodeEscapes,
  findSupplierArtifacts,
  hasLiteralUnicodeEscapes,
  sanitizeSupplierText,
  stripSupplierBoilerplate,
} from '../src/lib/supplier-text'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const LOCALES = ['en', 'ru', 'fr', 'es', 'sw', 'ar'] as const

/** collection → which fields to scrub */
const TARGETS: Array<{
  collection: string
  text: string[]
  html: string[]
  /** array fields whose subfield holds the text, e.g. products[].features[].feature */
  arrays?: Array<{ field: string; sub: string; html?: boolean }>
}> = [
  {
    collection: 'products',
    text: ['description', 'seoDescription', 'seoTitle'],
    html: ['overviewHtml'],
    arrays: [
      { field: 'features', sub: 'feature' },
      { field: 'specs', sub: 'label' },
      { field: 'specs', sub: 'value' },
    ],
  },
  { collection: 'subcategories', text: ['name', 'subtitle', 'description'], html: [] },
  { collection: 'categories', text: ['name', 'description'], html: [] },
  { collection: 'solutions', text: ['name', 'description'], html: [] },
  { collection: 'caseStudies', text: ['title', 'subtitle', 'summary'], html: ['content'] },
  { collection: 'blogPosts', text: ['title', 'excerpt'], html: [] },
  { collection: 'faqs', text: ['question', 'answer'], html: [] },
]

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const checkOnly = args.has('--check')

async function main() {
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  let scanned = 0
  let dirty = 0
  let changed = 0
  let remaining = 0
  const samples: string[] = []

  for (const target of TARGETS) {
    for (const locale of LOCALES) {
      const { docs } = await payload.find({
        collection: target.collection as never,
        locale,
        depth: 0,
        limit: 1000,
        pagination: false,
        overrideAccess: true,
      })

      for (const doc of docs as Array<Record<string, unknown>>) {
        scanned++
        const data: Record<string, unknown> = {}
        const hits: string[] = []

        /** Records what was wrong with a value, for the log line. */
        const describe = (value: string): string[] => {
          const problems = findSupplierArtifacts(value)
          if (hasLiteralUnicodeEscapes(value)) problems.push('literal \\uXXXX escapes')
          return problems
        }

        for (const field of target.text) {
          const raw = doc[field]
          if (typeof raw !== 'string' || !raw) continue
          const found = describe(raw)
          if (!found.length) continue
          hits.push(`${field}(${found.join('/')})`)
          data[field] = sanitizeSupplierText(decodeLiteralUnicodeEscapes(raw))
        }
        for (const field of target.html) {
          const raw = doc[field]
          if (typeof raw !== 'string' || !raw) continue
          const found = describe(raw)
          if (!found.length) continue
          hits.push(`${field}(${found.join('/')})`)
          data[field] = stripSupplierBoilerplate(decodeLiteralUnicodeEscapes(raw))
        }

        // Array fields (product features / specs) hold one text value per row.
        for (const arrayField of target.arrays ?? []) {
          const rows = doc[arrayField.field]
          if (!Array.isArray(rows)) continue
          let arrayDirty = 0
          const next = rows.map((row) => {
            const record = row as Record<string, unknown>
            const raw = record[arrayField.sub]
            if (typeof raw !== 'string' || !raw) return row
            const found = describe(raw)
            if (!found.length) return row
            arrayDirty++
            hits.push(`${arrayField.field}[].${arrayField.sub}`)
            return { ...record, [arrayField.sub]: sanitizeSupplierText(decodeLiteralUnicodeEscapes(raw)) }
          })
          if (arrayDirty) data[arrayField.field] = next
        }

        if (!hits.length) continue
        dirty++
        const label = `${target.collection}/${String(doc.slug ?? doc.id)} [${locale}] → ${hits.slice(0, 4).join(', ')}`
        if (samples.length < 12) samples.push(label)

        if (!apply) continue

        await payload.update({
          collection: target.collection as never,
          id: doc.id as never,
          locale,
          depth: 0,
          overrideAccess: true,
          data: data as never,
        })
        changed++

        // Re-read and assert: never claim a fix that did not land.
        const after = await payload.findByID({
          collection: target.collection as never,
          id: doc.id as never,
          locale,
          depth: 0,
          overrideAccess: true,
        })
        const afterRecord = after as Record<string, unknown>
        const stillDirty = [
          ...[...target.text, ...target.html].flatMap((f) => {
            const value = afterRecord[f]
            return typeof value === 'string' ? describe(value).map((a) => `${f}:${a}`) : []
          }),
          ...(target.arrays ?? []).flatMap((arrayField) => {
            const rows = afterRecord[arrayField.field]
            if (!Array.isArray(rows)) return []
            return rows.flatMap((row) => {
              const value = (row as Record<string, unknown>)[arrayField.sub]
              return typeof value === 'string'
                ? describe(value).map((a) => `${arrayField.field}[].${arrayField.sub}:${a}`)
                : []
            })
          }),
        ]
        if (stillDirty.length) {
          remaining++
          console.error(`  ✗ still dirty after update: ${label} → ${stillDirty.slice(0, 3).join(', ')}`)
        }
      }
    }
  }

  console.log(`\nscanned ${scanned} collection/locale records`)
  console.log(`rows containing supplier boilerplate: ${dirty}`)
  if (samples.length) {
    console.log('\nsamples:')
    for (const s of samples) console.log(`  ${s}`)
  }
  if (apply) {
    console.log(`\nupdated: ${changed}`)
    console.log(`still dirty after update: ${remaining}`)
  } else {
    console.log('\ndry run — re-run with --apply to write these fixes')
  }

  if (checkOnly && (dirty > 0 || remaining > 0)) {
    console.error('\n--check: supplier boilerplate is still present')
    process.exit(1)
  }
  process.exit(remaining > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
