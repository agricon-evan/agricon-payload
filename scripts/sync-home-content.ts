/**
 * Copy the localized homepage content from the dev SQLite database into the
 * production Postgres database.
 *
 * WHY THIS EXISTS
 * ---------------
 * `scripts/migrate-home-content.ts` migrates the homepage copy *within a single
 * database* by reading the superseded legacy columns. That is enough for the dev
 * SQLite file, where those columns still held the values.
 *
 * Against production it silently lost the two nested lists: its `parseArray`
 * accepted only strings, while Postgres returns a `jsonb` column already parsed,
 * so every value fell through to `[]`. Payload re-creates array rows on write, so
 * the legacy `items` column was left NULL as well — which then made the deployed
 * component crash on `items.map` and took the whole homepage down with a 500.
 *
 * The dev database is this project's content source of truth (it holds the full
 * product catalogue and every translation), and production's legacy columns can
 * no longer supply the lost values, so this script reads the home content out of
 * the dev database and writes it into production through the local API.
 *
 *   POSTGRES_URL=... pnpm tsx scripts/sync-home-content.ts          # dry run
 *   POSTGRES_URL=... pnpm tsx scripts/sync-home-content.ts --apply  # write
 *
 * `--apply` also mirrors the English values back into the superseded legacy
 * columns (`--no-legacy-mirror` opts out). That is a safety net, not the source of
 * truth: it keeps a previously deployed build rendering correctly until the new
 * build is live, and it is harmless afterwards because the application reads the
 * `*_locales` tables.
 */
import 'dotenv/config'
import { createClient } from '@libsql/client'
import { getPayload } from 'payload'

// Never let a script touching production attempt a schema push.
process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const mirrorLegacy = !args.has('--no-legacy-mirror')

const LOCALES = ['en', 'ru', 'fr', 'es', 'sw', 'ar'] as const
const DEV_DB = process.env.DEV_DATABASE_URI || 'file:./agricon-dev.db'

type Spec = {
  /** siteSettings field name. */
  field: string
  /** Parent array table. */
  table: string
  /** Subfields that live in the `_locales` side table. */
  localized: string[]
  /** Subfields that stay on the parent row (shared across locales). */
  plain: string[]
  /** Optional nested array with its own side tables. */
  items?: { table: string; localized: string[] }
}

const BLOCKS: Spec[] = [
  { field: 'homeHowWeWork', table: 'site_settings_home_how_we_work', localized: ['title', 'desc'], plain: ['icon'] },
  { field: 'homeWhyChooseUs', table: 'site_settings_home_why_choose_us', localized: ['title', 'desc'], plain: ['icon'] },
  { field: 'homeGlobalCoverage', table: 'site_settings_home_global_coverage', localized: ['title', 'sub'], plain: ['icon'] },
  { field: 'homeTestimonials', table: 'site_settings_home_testimonials', localized: ['quote', 'role'], plain: ['name'] },
  {
    field: 'homeValueCalculated',
    table: 'site_settings_home_value_calculated',
    localized: ['title'],
    plain: ['icon'],
    items: { table: 'site_settings_home_value_calculated_items', localized: ['label', 'value'] },
  },
  {
    field: 'homeTrustEvidence',
    table: 'site_settings_home_trust_evidence',
    localized: ['title'],
    plain: ['icon'],
    items: { table: 'site_settings_home_trust_evidence_items', localized: ['text'] },
  },
]

const sqlite = createClient({ url: DEV_DB })

async function q(sql: string): Promise<Record<string, unknown>[]> {
  const res = await sqlite.execute(sql)
  return res.rows as unknown as Record<string, unknown>[]
}

const key = (parentId: unknown, locale: unknown) => `${String(parentId)}|${String(locale)}`

/** Reads one block out of the dev database, shaped per locale. */
async function readBlock(spec: Spec) {
  const plainCols = spec.plain.map((c) => `"${c}"`).join(', ')
  const parents = await q(
    `SELECT "id", "_order"${plainCols ? `, ${plainCols}` : ''} FROM "${spec.table}" ORDER BY "_order"`,
  )

  const locCols = spec.localized.map((c) => `"${c}"`).join(', ')
  const locRows = await q(
    `SELECT "_parent_id", "_locale"${locCols ? `, ${locCols}` : ''} FROM "${spec.table}_locales"`,
  )
  const locMap = new Map<string, Record<string, unknown>>()
  for (const r of locRows) locMap.set(key(r._parent_id, r._locale), r)

  let itemRows: Record<string, unknown>[] = []
  let itemLocMap = new Map<string, Record<string, unknown>>()
  if (spec.items) {
    itemRows = await q(`SELECT "id", "_parent_id", "_order" FROM "${spec.items.table}" ORDER BY "_order"`)
    const iCols = spec.items.localized.map((c) => `"${c}"`).join(', ')
    const iLocRows = await q(
      `SELECT "_parent_id", "_locale"${iCols ? `, ${iCols}` : ''} FROM "${spec.items.table}_locales"`,
    )
    itemLocMap = new Map(iLocRows.map((r) => [key(r._parent_id, r._locale), r]))
  }

  const perLocale: Record<string, unknown[]> = {}
  for (const locale of LOCALES) {
    perLocale[locale] = parents.map((p) => {
      const row: Record<string, unknown> = {}
      for (const c of spec.plain) if (p[c] != null && p[c] !== '') row[c] = p[c]
      const loc = locMap.get(key(p.id, locale)) ?? {}
      for (const c of spec.localized) row[c] = loc[c] ?? ''
      if (spec.items) {
        row.items = itemRows
          .filter((it) => String(it._parent_id) === String(p.id))
          .map((it) => {
            const il = itemLocMap.get(key(it.id, locale)) ?? {}
            const o: Record<string, unknown> = {}
            for (const c of spec.items!.localized) o[c] = il[c] ?? ''
            return o
          })
      }
      return row
    })
  }
  return { perLocale, parentCount: parents.length }
}

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set. This script writes to production; set it explicitly.')
  }

  console.log(`source: ${DEV_DB}`)
  console.log(`target: ${new URL(process.env.POSTGRES_URL).host}`)
  console.log(apply ? 'mode: APPLY\n' : 'mode: dry run (pass --apply to write)\n')

  const data = new Map<string, Awaited<ReturnType<typeof readBlock>>>()
  for (const spec of BLOCKS) {
    const block = await readBlock(spec)
    data.set(spec.field, block)
    const itemCount = spec.items
      ? ((block.perLocale.en?.[0] as { items?: unknown[] })?.items?.length ?? 0)
      : 0
    console.log(
      `  ${spec.field.padEnd(22)} ${block.parentCount} rows` +
        (spec.items ? `, ${itemCount} nested items/row` : '') +
        `, ${LOCALES.length} locales`,
    )
  }

  if (!apply) {
    console.log('\ndry run — nothing written. Re-run with --apply.')
    await sqlite.close()
    return
  }

  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  const settings = await payload.find({ collection: 'siteSettings', limit: 1, depth: 0, locale: 'en' })
  const doc = settings.docs[0]
  if (!doc) throw new Error('siteSettings document not found in production')

  /**
   * Write one locale's home arrays.
   *
   * ⚠️ `id` is essential for every locale after the first. Payload re-creates
   * array rows whenever a write omits their ids, so writing ru/fr/es/sw/ar in
   * sequence without ids deletes the rows the previous write created and leaves
   * only the final locale's `_locales` rows behind — the symptom is every block
   * reporting a single locale (ar) instead of six. Passing the ids back keeps the
   * row identity stable and updates the localized subfields in place.
   */
  type RowIds = { id?: unknown; items?: unknown[] }
  const writeLocale = async (locale: string, ids?: Record<string, RowIds[]>) => {
    const payloadData: Record<string, unknown> = {}
    for (const spec of BLOCKS) {
      const rows = data.get(spec.field)!.perLocale[locale] as Record<string, unknown>[]
      payloadData[spec.field] = rows.map((row, i) => {
        const out: Record<string, unknown> = { ...row }
        const rowIds = ids?.[spec.field]?.[i]
        if (rowIds?.id != null) out.id = rowIds.id
        if (spec.items && Array.isArray(out.items)) {
          out.items = (out.items as Record<string, unknown>[]).map((item, j) => {
            const itemId = rowIds?.items?.[j]
            return itemId != null ? { ...item, id: itemId } : item
          })
        }
        return out
      })
    }
    await payload.update({ collection: 'siteSettings', id: doc.id, locale, data: payloadData as never })
  }

  // 1) `en` creates the array rows.
  await writeLocale('en')
  console.log('  ✓ wrote en (created array rows)')

  // 2) Read the created ids back so every other locale updates in place.
  const withIds = await payload.findByID({ collection: 'siteSettings', id: doc.id, depth: 0, locale: 'en' })
  const ids: Record<string, RowIds[]> = {}
  for (const spec of BLOCKS) {
    const rows = ((withIds as Record<string, unknown>)[spec.field] as Record<string, unknown>[] | undefined) ?? []
    ids[spec.field] = rows.map((r) => ({
      id: r.id,
      items: spec.items ? (((r.items as Record<string, unknown>[]) ?? []).map((it) => it.id)) : undefined,
    }))
  }

  // 3) The remaining locales.
  for (const locale of LOCALES) {
    if (locale === 'en') continue
    await writeLocale(locale, ids)
    console.log(`  ✓ wrote ${locale}`)
  }

  if (mirrorLegacy) {
    // Keep the *previously deployed* build rendering until the new one is live.
    // Raw SQL because these columns no longer exist in the config.
    const drizzle = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle
    const { sql: sqlTag } = await import('drizzle-orm')
    const mirrors: Array<[string, string[]]> = [
      ['site_settings_home_trust_evidence', ['title']],
      ['site_settings_home_why_choose_us', ['title', 'desc']],
      ['site_settings_home_how_we_work', ['title', 'desc']],
      ['site_settings_home_global_coverage', ['title', 'sub']],
      ['site_settings_home_testimonials', ['quote', 'role']],
      ['site_settings_home_value_calculated', ['title']],
    ]
    for (const [table, cols] of mirrors) {
      const sets = cols.map((c) => `"${c}" = l."${c}"`).join(', ')
      await drizzle.execute(
        sqlTag.raw(
          `UPDATE "${table}" p SET ${sets} FROM "${table}_locales" l ` +
            `WHERE l."_parent_id" = p."id" AND l."_locale" = 'en'`,
        ),
      )
    }

    // The two nested lists need separate handling: the old build read them as a
    // JSON column on the parent row and called `items.map` on it directly, so a
    // NULL there is an immediate crash. Row order is the join key — both sides are
    // ordered by `_order`, and the parent rows are recreated together.
    const nested: Array<[string, (row: Record<string, unknown>) => unknown]> = [
      ['site_settings_home_trust_evidence', (row) => (row.items as Array<{ text: string }>).map((i) => i.text)],
      ['site_settings_home_value_calculated', (row) => row.items],
    ]
    for (const [table, shape] of nested) {
      const spec = BLOCKS.find((b) => b.table === table)!
      const localRows = data.get(spec.field)!.perLocale.en as Record<string, unknown>[]
      const res = (await drizzle.execute(
        sqlTag.raw(`SELECT "id" FROM "${table}" ORDER BY "_order"`),
      )) as { rows?: Array<{ id: string }> }
      const prodRows = res.rows ?? []
      if (prodRows.length !== localRows.length) {
        throw new Error(`${table}: ${prodRows.length} production rows vs ${localRows.length} local — refusing to mirror`)
      }
      for (let i = 0; i < prodRows.length; i++) {
        await drizzle.execute(
          sqlTag`UPDATE ${sqlTag.raw(`"${table}"`)} SET "items" = ${JSON.stringify(shape(localRows[i]))}::jsonb WHERE "id" = ${prodRows[i].id}`,
        )
      }
      console.log(`  ✓ restored legacy items on ${table.replace('site_settings_home_', '')} (${prodRows.length} rows)`)
    }

    console.log('  ✓ mirrored English into the legacy columns (safety net)')
  }

  console.log('\nhome content synced to production.')
  await sqlite.close()
  process.exit(0)
}

await main()
