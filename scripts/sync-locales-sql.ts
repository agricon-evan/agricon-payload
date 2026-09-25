/**
 * Copy localized content from the dev DB (SQLite) into production (Postgres)
 * with direct SQL.
 *
 * WHY NOT THE PAYLOAD API
 * -----------------------
 * `sync-catalogue-to-prod.ts` does this through Payload's Local API, which is
 * correct but slow: every `update` is a fresh round-trip to Neon (ap-southeast-1)
 * and re-runs the whole document pipeline. A full pass is ~855 document updates
 * plus ~9000 array-row updates and took well over an hour. Direct SQL does the
 * same writes in minutes.
 *
 * WHY BY `_order` AND NOT BY ROW ID
 * ---------------------------------
 * Payload array-row ids are 24-char hex strings in Postgres but are sometimes
 * plain integers in the dev SQLite. The two databases therefore share no row
 * ids, so array rows are paired by position in `_order` — safe because both
 * sides were built from the same import, and any length mismatch is reported
 * rather than guessed at.
 *
 * RESILIENCE
 * ----------
 * This Neon endpoint drops connections under sustained load ("Connection
 * terminated unexpectedly"). Every query is therefore retried on a fresh
 * connection, and each product+array block is skipped when production already
 * holds all five locales, so a re-run resumes instead of repeating ~9000 writes.
 *
 * USAGE
 *   pnpm tsx scripts/sync-locales-sql.ts            # dry run
 *   pnpm tsx scripts/sync-locales-sql.ts --apply
 *
 * Requires POSTGRES_URL pointing at production.
 */
import 'dotenv/config'
import path from 'node:path'
import { createClient } from '@libsql/client'
import pg from 'pg'

const ROOT = path.resolve(import.meta.dirname, '..')
const LOCALES = ['ru', 'fr', 'es', 'sw', 'ar'] as const
const apply = process.argv.slice(2).includes('--apply')
const PG_URL = process.env.POSTGRES_URL

const local = createClient({ url: `file:${path.join(ROOT, 'agricon-dev.db')}` })
type Row = Record<string, unknown>
const lq = async (sql: string, args: unknown[] = []): Promise<Row[]> =>
  (await local.execute({ sql, args: args as never[] })).rows as unknown as Row[]
const s = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- pg plumbing
let pgc: pg.Client
function newClient(): pg.Client {
  const c = new pg.Client({
    connectionString: PG_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    // Long runs against a managed endpoint; keep statements short-lived.
    statement_timeout: 120000,
  })
  // Without a listener, a dropped socket raises an unhandled 'error' event and
  // kills the process before the retry logic can react.
  c.on('error', () => {})
  return c
}

async function connect() {
  pgc = newClient()
  await pgc.connect()
}

/** Run `fn`, reconnecting and retrying on transient connection failures. */
async function withRetry<T>(label: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await fn(pgc)
    } catch (err) {
      lastErr = err
      const msg = err instanceof Error ? err.message : String(err)
      const transient = /terminated|ECONNRESET|ETIMEDOUT|timeout expired|Connection|socket|closed/i.test(msg)
      if (!transient || attempt === 6) break
      console.log(`      … ${label}: ${msg} — reconnecting (attempt ${attempt})`)
      try {
        await pgc.end()
      } catch {
        /* already dead */
      }
      await sleep(1500 * attempt)
      await connect()
    }
  }
  throw lastErr
}

const pq = (sql: string, args: unknown[] = []) => withRetry('query', (c) => c.query(sql, args as never[]).then((r) => r.rows as unknown as Row[]))

/** UPDATE-then-INSERT. `rowCount` tells us whether the locale row existed. */
async function upsert(
  table: string,
  parentId: string | number,
  locale: string,
  entries: Array<[col: string, value: string | object | null, kind: 'text' | 'json']>,
): Promise<'updated' | 'inserted'> {
  const cols = entries.map(([c]) => c)
  const cast = (i: number) => (entries[i][2] === 'json' ? '::jsonb' : '')
  const setSql = cols.map((c, i) => `${c} = $${i + 1}${cast(i)}`).join(', ')
  const values = entries.map(([, v, kind]) => (kind === 'json' && v !== null ? JSON.stringify(v) : v))
  const pidIdx = values.length + 1
  const locIdx = values.length + 2

  return withRetry(`${table} upsert`, async (c) => {
    const upd = await c.query(
      `UPDATE ${table} SET ${setSql} WHERE _parent_id = $${pidIdx} AND _locale = $${locIdx}::"_locales"`,
      [...values, parentId, locale],
    )
    if (upd.rowCount && upd.rowCount > 0) return 'updated'

    const colList = [...cols, '_parent_id', '_locale'].join(', ')
    const ph = cols.map((_, i) => `$${i + 1}${cast(i)}`)
    ph.push(`$${pidIdx}`, `$${locIdx}::"_locales"`)
    await c.query(`INSERT INTO ${table} (${colList}) VALUES (${ph.join(', ')})`, [...values, parentId, locale])
    return 'inserted'
  })
}

interface Job {
  label: string
  table: string
  key: 'slug' | 'enName'
  fields: Array<[string, string, 'text' | 'json']>
}

const JOBS: Job[] = [
  {
    label: 'products',
    table: 'products_locales',
    key: 'slug',
    fields: [
      ['name', 'name', 'text'],
      ['description', 'description', 'text'],
      ['seo_title', 'seo_title', 'text'],
      ['seo_description', 'seo_description', 'text'],
    ],
  },
  {
    label: 'blogPosts',
    table: 'blog_posts_locales',
    key: 'slug',
    fields: [
      ['title', 'title', 'text'],
      ['excerpt', 'excerpt', 'text'],
      ['content', 'content', 'json'],
    ],
  },
  {
    label: 'caseStudies',
    table: 'case_studies_locales',
    key: 'slug',
    fields: [
      ['title', 'title', 'text'],
      ['subtitle', 'subtitle', 'text'],
      ['summary', 'summary', 'text'],
      ['content', 'content', 'json'],
      ['location', 'location', 'text'],
      ['farm_name', 'farm_name', 'text'],
      ['farm_scale', 'farm_scale', 'text'],
      ['key_result', 'key_result', 'text'],
      ['equipment', 'equipment', 'text'],
      ['application', 'application', 'text'],
      ['challenge', 'challenge', 'text'],
    ],
  },
  { label: 'faqCategories', table: 'faq_categories_locales', key: 'enName', fields: [['name', 'name', 'text']] },
  {
    label: 'solutions',
    table: 'solutions_locales',
    key: 'slug',
    fields: [
      ['name', 'name', 'text'],
      ['description', 'description', 'text'],
    ],
  },
  {
    label: 'categories',
    table: 'categories_locales',
    key: 'slug',
    fields: [
      ['name', 'name', 'text'],
      ['description', 'description', 'text'],
    ],
  },
  {
    label: 'subcategories',
    table: 'subcategories_locales',
    key: 'slug',
    fields: [
      ['name', 'name', 'text'],
      ['description', 'description', 'text'],
      ['subtitle', 'subtitle', 'text'],
    ],
  },
]

const ARRAYS: Array<{ table: string; fields: Array<[string, string, 'text' | 'json']> }> = [
  { table: 'products_images', fields: [['alt', 'alt', 'text']] },
  { table: 'products_features', fields: [['feature', 'feature', 'text']] },
  {
    table: 'products_specs',
    fields: [
      ['label', 'label', 'text'],
      ['value', 'value', 'text'],
    ],
  },
  {
    table: 'products_faqs',
    fields: [
      ['question', 'question', 'text'],
      ['answer', 'answer', 'text'],
    ],
  },
]

async function main() {
  await connect()

  let updated = 0
  let inserted = 0
  let resumed = 0
  const skipped: string[] = []

  // ---------- collection-level locale tables ----------
  for (const job of JOBS) {
    const parentTable = job.table.replace('_locales', '')
    const prodDocs = await pq(`SELECT id${job.key === 'slug' ? ', slug' : ''} FROM ${parentTable}`)
    const bySlug = new Map<string, number>()
    for (const d of prodDocs) bySlug.set(s(d.slug), Number(d.id))

    // `faq_categories` has no slug — match on the English name instead.
    const prodByEnName = new Map<string, number>()
    if (job.key === 'enName') {
      const rows = await pq(`SELECT _parent_id, name FROM ${job.table} WHERE _locale = 'en'::"_locales"`)
      for (const r of rows) prodByEnName.set(s(r.name), Number(r._parent_id))
    }

    const localDocs = await lq(`SELECT * FROM ${parentTable}`)
    const firstCol = job.fields[0][0]
    let n = 0
    for (const doc of localDocs) {
      const localId = Number(doc.id)
      const en = (await lq(`SELECT * FROM ${job.table} WHERE _parent_id = ? AND _locale = 'en'`, [localId]))[0] ?? {}
      const key = job.key === 'slug' ? s(doc.slug) : s(en.name)
      const prodId = job.key === 'slug' ? bySlug.get(key) : prodByEnName.get(key)
      if (!prodId) {
        skipped.push(`${job.label}/${key}: no production document`)
        continue
      }

      // Resume: five non-English locale rows already carrying a value means done.
      const done = await pq(
        `SELECT COUNT(*)::int AS n FROM ${job.table} WHERE _parent_id = $1 AND _locale <> 'en'::"_locales" AND ${firstCol} IS NOT NULL AND TRIM(${firstCol}) <> ''`,
        [prodId],
      )
      if (Number(done[0].n) >= LOCALES.length) {
        resumed += 1
        continue
      }

      for (const loc of LOCALES) {
        const l = (await lq(`SELECT * FROM ${job.table} WHERE _parent_id = ? AND _locale = ?`, [localId, loc]))[0] ?? {}
        const entries = job.fields.map(([col, pgCol, kind]) => {
          const raw = l[col]
          if (kind === 'json') {
            if (raw === null || raw === undefined || raw === '') return [pgCol, null, kind] as [string, null, 'json']
            try {
              return [pgCol, JSON.parse(String(raw)) as object, kind] as [string, object, 'json']
            } catch {
              return [pgCol, null, kind] as [string, null, 'json']
            }
          }
          return [pgCol, raw === null || raw === undefined || raw === '' ? null : String(raw), kind] as [string, string | null, 'text']
        })
        // `name`/`title` are NOT NULL; never overwrite them with null.
        if (entries.some(([c, v]) => (c === 'name' || c === 'title') && v === null)) continue
        if (!apply) continue
        const r = await upsert(job.table, prodId, loc, entries)
        if (r === 'updated') updated += 1
        else inserted += 1
        n += 1
      }
    }
    console.log(`  ${job.label.padEnd(15)} ${apply ? `${n} written` : `${localDocs.length} doc(s)`}`)
  }

  // ---------- product array locale tables ----------
  console.log('\n  product arrays:')
  const localProducts = await lq(`SELECT id, slug FROM products`)
  for (const arr of ARRAYS) {
    const firstCol = arr.fields[0][0]
    let n = 0
    let shapeBad = 0
    let already = 0
    for (const lp of localProducts) {
      const localId = Number(lp.id)
      const prod = await pq(`SELECT id FROM products WHERE slug = $1`, [s(lp.slug)])
      if (!prod[0]) continue
      const prodId = Number(prod[0].id)

      const lRows = await lq(`SELECT * FROM ${arr.table} WHERE _parent_id = ? ORDER BY _order`, [localId])
      const pRows = await pq(`SELECT id FROM ${arr.table} WHERE _parent_id = $1 ORDER BY _order`, [prodId])
      if (lRows.length !== pRows.length) {
        shapeBad += 1
        skipped.push(`${arr.table}/${s(lp.slug)}: ${pRows.length} prod rows vs ${lRows.length} local`)
        continue
      }
      if (!lRows.length) continue

      if (apply) {
        const done = await pq(
          `SELECT COUNT(*)::int AS n FROM ${arr.table}_locales l JOIN ${arr.table} r ON r.id = l._parent_id
             WHERE r._parent_id = $1 AND l._locale <> 'en'::"_locales" AND l.${firstCol} IS NOT NULL AND TRIM(l.${firstCol}) <> ''`,
          [prodId],
        )
        if (Number(done[0].n) >= lRows.length * LOCALES.length) {
          already += 1
          continue
        }
      }

      for (let i = 0; i < lRows.length; i += 1) {
        const prodRowId = s(pRows[i].id)
        for (const loc of LOCALES) {
          const l = (await lq(`SELECT * FROM ${arr.table}_locales WHERE _parent_id = ? AND _locale = ?`, [lRows[i].id, loc]))[0] ?? {}
          const entries = arr.fields.map(([col, pgCol]) => {
            const raw = l[col]
            return [pgCol, raw === null || raw === undefined || raw === '' ? null : String(raw), 'text'] as [string, string | null, 'text']
          })
          if (!apply) continue
          const r = await upsert(`${arr.table}_locales`, prodRowId, loc, entries)
          if (r === 'updated') updated += 1
          else inserted += 1
          n += 1
        }
      }
    }
    console.log(
      `    ${arr.table.padEnd(20)} ${apply ? `${n} written` : ''}${already ? ` (${already} already done)` : ''}${shapeBad ? ` (${shapeBad} shape mismatch)` : ''}`,
    )
  }

  console.log(`\n${apply ? `updated ${updated}, inserted ${inserted}, skipped-as-done ${resumed}` : 'DRY RUN — pass --apply to write'}`)
  if (skipped.length) {
    console.log(`${skipped.length} skipped:`)
    for (const x of skipped.slice(0, 25)) console.log('   ' + x)
  }

  await pgc.end()
  local.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
