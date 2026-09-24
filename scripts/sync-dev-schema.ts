/**
 * Dev-database schema sync for SQLite.
 *
 * WHY THIS EXISTS
 * ---------------
 * This project runs with `PAYLOAD_PUSH_SCHEMA=false` in development. Push mode
 * is unusable here: on Windows/libsql it repeatedly tries to recreate indexes
 * that already exist and aborts with `index xxx already exists`. The documented
 * workaround was to hand-write `ALTER TABLE` statements in the terminal (see
 * README → Database schema sync), which is how the database silently drifted.
 *
 * The concrete consequence found during the August 2026 audit: `Products` gained
 * `faqs` and `detailImages` array fields, but the two tables behind `faqs`
 * (`products_faqs`, `products_faqs_locales`) were never created. Every
 * `payload.find({ collection: 'products' })` call then failed with
 * `SQLITE_ERROR: no such table: products_faqs` — which broke the product
 * listing, every product detail page, the homepage product sections and the
 * sitemap, and is the reason `src/payload-types.ts` had drifted out of sync.
 *
 * WHAT IT DOES
 * ------------
 * Creates the missing tables/columns for the current collection definitions.
 * Idempotent: every statement is guarded, so re-running is a no-op. It never
 * drops or alters existing data.
 *
 * USAGE
 *   pnpm tsx scripts/sync-dev-schema.ts          # apply
 *   pnpm tsx scripts/sync-dev-schema.ts --check  # report only, exit 1 if behind
 */
import 'dotenv/config'
import { createClient, type Client } from '@libsql/client'

const CHECK_ONLY = process.argv.includes('--check')

const url = process.env.DATABASE_URI || 'file:./agricon-dev.db'
if (url.startsWith('file:') === false && !url.includes('localhost')) {
  console.error(
    `Refusing to run: DATABASE_URI is "${url}".\n` +
      'This script only maintains the local SQLite development database. ' +
      'Production schema is created by Payload push/migrations.',
  )
  process.exit(2)
}

const db: Client = createClient({ url })

const tableExists = async (name: string): Promise<boolean> => {
  const r = await db.execute({ sql: "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", args: [name] })
  return r.rows.length > 0
}

const columnExists = async (table: string, column: string): Promise<boolean> => {
  if (!(await tableExists(table))) return false
  const r = await db.execute({ sql: `SELECT 1 FROM pragma_table_info('${table}') WHERE name=?`, args: [column] })
  return r.rows.length > 0
}

interface Statement {
  /** What this statement provides, for the report. */
  label: string
  /** Returns true when the object already exists. */
  present: () => Promise<boolean>
  sql: string
}

/**
 * Mirrors the table shapes Payload generates for a localized `array` field:
 * a parent row table keyed by a TEXT id with `_order`/`_parent_id`, plus a
 * `_locales` side table holding the localized columns.
 */
const statements: Statement[] = [
  {
    label: 'products_faqs table (Products.faqs parent rows)',
    present: () => tableExists('products_faqs'),
    sql: `CREATE TABLE \`products_faqs\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  },
  {
    label: 'products_faqs_order_idx index',
    present: async () => {
      const r = await db.execute("SELECT 1 FROM sqlite_master WHERE type='index' AND name='products_faqs_order_idx'")
      return r.rows.length > 0
    },
    sql: 'CREATE INDEX `products_faqs_order_idx` ON `products_faqs` (`_order`)',
  },
  {
    label: 'products_faqs_parent_id_idx index',
    present: async () => {
      const r = await db.execute("SELECT 1 FROM sqlite_master WHERE type='index' AND name='products_faqs_parent_id_idx'")
      return r.rows.length > 0
    },
    sql: 'CREATE INDEX `products_faqs_parent_id_idx` ON `products_faqs` (`_parent_id`)',
  },
  {
    label: 'products_faqs_locales table (Products.faqs localized question/answer)',
    present: () => tableExists('products_faqs_locales'),
    sql: `CREATE TABLE \`products_faqs_locales\` (
      \`question\` text,
      \`answer\` text,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_faqs\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  },
  {
    label: 'products_faqs_locales unique (locale, parent) index',
    present: async () => {
      const r = await db.execute(
        "SELECT 1 FROM sqlite_master WHERE type='index' AND name='products_faqs_locales_locale_parent_id_unique'",
      )
      return r.rows.length > 0
    },
    sql: 'CREATE UNIQUE INDEX `products_faqs_locales_locale_parent_id_unique` ON `products_faqs_locales` (`_locale`,`_parent_id`)',
  },
  {
    label: 'products_detail_images table (Products.detailImages parent rows)',
    present: () => tableExists('products_detail_images'),
    sql: `CREATE TABLE \`products_detail_images\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  },
  {
    label: 'products_detail_images_order_idx index',
    present: async () => {
      const r = await db.execute("SELECT 1 FROM sqlite_master WHERE type='index' AND name='products_detail_images_order_idx'")
      return r.rows.length > 0
    },
    sql: 'CREATE INDEX `products_detail_images_order_idx` ON `products_detail_images` (`_order`)',
  },
  {
    label: 'products_detail_images_parent_id_idx index',
    present: async () => {
      const r = await db.execute(
        "SELECT 1 FROM sqlite_master WHERE type='index' AND name='products_detail_images_parent_id_idx'",
      )
      return r.rows.length > 0
    },
    sql: 'CREATE INDEX `products_detail_images_parent_id_idx` ON `products_detail_images` (`_parent_id`)',
  },
  {
    label: 'products_detail_images_image_id_idx index',
    present: async () => {
      const r = await db.execute(
        "SELECT 1 FROM sqlite_master WHERE type='index' AND name='products_detail_images_image_id_idx'",
      )
      return r.rows.length > 0
    },
    sql: 'CREATE INDEX `products_detail_images_image_id_idx` ON `products_detail_images` (`image_id`)',
  },
  {
    label: 'products_detail_images_locales table (Products.detailImages localized alt)',
    present: () => tableExists('products_detail_images_locales'),
    sql: `CREATE TABLE \`products_detail_images_locales\` (
      \`alt\` text,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_detail_images\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  },
  {
    label: 'products_detail_images_locales unique (locale, parent) index',
    present: async () => {
      const r = await db.execute(
        "SELECT 1 FROM sqlite_master WHERE type='index' AND name='products_detail_images_locales_locale_parent_id_unique'",
      )
      return r.rows.length > 0
    },
    sql: 'CREATE UNIQUE INDEX `products_detail_images_locales_locale_parent_id_unique` ON `products_detail_images_locales` (`_locale`,`_parent_id`)',
  },
  {
    label: 'videos.platform column',
    present: () => columnExists('videos', 'platform'),
    sql: "ALTER TABLE `videos` ADD COLUMN `platform` text DEFAULT 'youtube'",
  },
  {
    label: 'videos.published column',
    present: () => columnExists('videos', 'published'),
    sql: 'ALTER TABLE `videos` ADD COLUMN `published` integer DEFAULT 1',
  },
]

/**
 * Homepage localization (docs/MAINTENANCE.md §8).
 *
 * The six `siteSettings` home arrays gained localized subfields, and the two
 * `items` fields changed from `json` to nested arrays, so Payload now stores
 * their text in `*_locales` side tables and needs the nested array tables too.
 *
 * Every name/shape below was read out of a scratch database that Payload pushed
 * itself (`DATABASE_URI=file:./scratch-schema.db PAYLOAD_PUSH_SCHEMA=true`), so
 * this file matches what the ORM actually queries — including Payload's
 * 63-character truncation of the unique-index names.
 *
 * The legacy data is NOT dropped: the old `title`/`desc`/`sub`/`quote`/`items`
 * columns stay in the parent tables as a safety net, and
 * `scripts/migrate-home-content.ts` copies them into the new locale rows.
 */
interface LocalizedTable {
  /** `*_locales` side table holding this array's localized columns. */
  table: string
  /** Localized columns, as they appear in the scratch schema. */
  columns: string
  /** Array table the rows belong to. */
  parent: string
  /** Payload's (truncated) unique index name. */
  uniqueIndex: string
}

const localizedHomeTables: LocalizedTable[] = [
  {
    table: 'site_settings_home_why_choose_us_locales',
    columns: '`title` text NOT NULL, `desc` text NOT NULL',
    parent: 'site_settings_home_why_choose_us',
    uniqueIndex: 'site_settings_home_why_choose_us_locales_locale_parent_id_un',
  },
  {
    table: 'site_settings_home_how_we_work_locales',
    columns: '`title` text NOT NULL, `desc` text NOT NULL',
    parent: 'site_settings_home_how_we_work',
    uniqueIndex: 'site_settings_home_how_we_work_locales_locale_parent_id_uniq',
  },
  {
    table: 'site_settings_home_global_coverage_locales',
    columns: '`title` text NOT NULL, `sub` text NOT NULL',
    parent: 'site_settings_home_global_coverage',
    uniqueIndex: 'site_settings_home_global_coverage_locales_locale_parent_id_',
  },
  {
    table: 'site_settings_home_testimonials_locales',
    columns: '`quote` text NOT NULL, `role` text',
    parent: 'site_settings_home_testimonials',
    uniqueIndex: 'site_settings_home_testimonials_locales_locale_parent_id_uni',
  },
  {
    table: 'site_settings_home_trust_evidence_locales',
    columns: '`title` text NOT NULL',
    parent: 'site_settings_home_trust_evidence',
    uniqueIndex: 'site_settings_home_trust_evidence_locales_locale_parent_id_u',
  },
  {
    table: 'site_settings_home_value_calculated_locales',
    columns: '`title` text NOT NULL',
    parent: 'site_settings_home_value_calculated',
    uniqueIndex: 'site_settings_home_value_calculated_locales_locale_parent_id',
  },
]

/** Nested arrays (`items`) that replaced the two `json` fields. */
const nestedItemTables: Array<{
  table: string
  parent: string
  localesTable: string
  localesColumns: string
  uniqueIndex: string
}> = [
  {
    table: 'site_settings_home_trust_evidence_items',
    parent: 'site_settings_home_trust_evidence',
    localesTable: 'site_settings_home_trust_evidence_items_locales',
    localesColumns: '`text` text NOT NULL',
    uniqueIndex: 'site_settings_home_trust_evidence_items_locales_locale_paren',
  },
  {
    table: 'site_settings_home_value_calculated_items',
    parent: 'site_settings_home_value_calculated',
    localesTable: 'site_settings_home_value_calculated_items_locales',
    localesColumns: '`label` text NOT NULL, `value` text NOT NULL',
    uniqueIndex: 'site_settings_home_value_calculated_items_locales_locale_par',
  },
]

const indexExists = async (name: string): Promise<boolean> => {
  const r = await db.execute({ sql: "SELECT 1 FROM sqlite_master WHERE type='index' AND name=?", args: [name] })
  return r.rows.length > 0
}

for (const table of localizedHomeTables) {
  statements.push({
    label: `${table.table} table (localized homepage copy)`,
    present: () => tableExists(table.table),
    sql: `CREATE TABLE \`${table.table}\` (
      ${table.columns},
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`${table.parent}\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  })
  statements.push({
    label: `${table.uniqueIndex} index`,
    present: () => indexExists(table.uniqueIndex),
    sql: `CREATE UNIQUE INDEX \`${table.uniqueIndex}\` ON \`${table.table}\` (\`_locale\`,\`_parent_id\`)`,
  })
}

for (const nested of nestedItemTables) {
  const orderIndex = `${nested.table}_order_idx`
  const parentIndex = `${nested.table}_parent_id_idx`
  statements.push({
    label: `${nested.table} table (nested items rows)`,
    present: () => tableExists(nested.table),
    sql: `CREATE TABLE \`${nested.table}\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`${nested.parent}\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  })
  statements.push({
    label: `${orderIndex} index`,
    present: () => indexExists(orderIndex),
    sql: `CREATE INDEX \`${orderIndex}\` ON \`${nested.table}\` (\`_order\`)`,
  })
  statements.push({
    label: `${parentIndex} index`,
    present: () => indexExists(parentIndex),
    sql: `CREATE INDEX \`${parentIndex}\` ON \`${nested.table}\` (\`_parent_id\`)`,
  })
  statements.push({
    label: `${nested.localesTable} table (localized items)`,
    present: () => tableExists(nested.localesTable),
    sql: `CREATE TABLE \`${nested.localesTable}\` (
      ${nested.localesColumns},
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`${nested.table}\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
  })
  statements.push({
    label: `${nested.uniqueIndex} index`,
    present: () => indexExists(nested.uniqueIndex),
    sql: `CREATE UNIQUE INDEX \`${nested.uniqueIndex}\` ON \`${nested.localesTable}\` (\`_locale\`,\`_parent_id\`)`,
  })
}

const missing: Statement[] = []
for (const statement of statements) {
  if (!(await statement.present())) missing.push(statement)
}

if (missing.length === 0) {
  console.log(`✓ dev schema is up to date (${statements.length} object(s) verified) — ${url}`)
  process.exit(0)
}

console.log(`dev schema is missing ${missing.length} object(s) in ${url}:\n`)
for (const m of missing) console.log(`  - ${m.label}`)

if (CHECK_ONLY) {
  console.log('\nRe-run without --check to apply.')
  process.exit(1)
}

console.log('')
for (const m of missing) {
  try {
    await db.execute(m.sql)
    console.log(`  ✓ created ${m.label}`)
  } catch (err) {
    console.error(`  ✗ failed ${m.label}: ${err instanceof Error ? err.message : String(err)}`)
    process.exitCode = 1
  }
}

if (process.exitCode !== 1) {
  console.log('\n✓ dev schema synced. Restart the dev server if it was already running.')
}
