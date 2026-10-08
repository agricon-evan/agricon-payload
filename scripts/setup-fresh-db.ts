/**
 * Creates the COMPLETE schema on an empty Postgres database.
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * The repo could not rebuild its own production database from scratch. The two
 * files in `src/migrations/` are *patch* migrations: they only add what happened
 * to be missing in production at the time, and each uses `IF NOT EXISTS`. Running
 * `payload migrate` against an empty database therefore produces a PARTIAL schema,
 * not a working one. The original schema was only ever created by a dev-mode
 * `push`, and nobody ever captured it as a migration.
 *
 * That is a real availability risk: if the production database is ever lost — or,
 * as happened, its provider quota is exhausted — there is no supported way to
 * stand up a replacement. This script is that way.
 *
 * HOW IT WORKS
 * ------------
 * `pushDevSchema` is disabled by the Postgres adapter only when
 * `NODE_ENV === 'production'`
 * (`@payloadcms/db-vercel-postgres/dist/connect.js`):
 *
 *     if (process.env.NODE_ENV !== 'production' && ... && this.push !== false) {
 *       await pushDevSchema(this)
 *     }
 *
 * So running with `NODE_ENV` unset (which is not `'production'`) and
 * `PAYLOAD_PUSH_SCHEMA` not `'false'` makes the adapter build the full schema
 * from the Payload config on first connect — exactly what the original
 * development database got. Both env vars are forced below, BEFORE the config is
 * imported, because `.env` sets `PAYLOAD_PUSH_SCHEMA=false` and dotenv never
 * overwrites a variable that is already present in `process.env`.
 *
 * IT ALSO CLEARS THE `dev` MARKER
 * -------------------------------
 * Pushing writes a row into `payload_migrations` with `name='dev'`, `batch=-1`.
 * While that row exists, `payload migrate` opens an interactive confirmation, and
 * in a non-TTY build (Vercel) that prompt cancels via `process.exit(0)` — so
 * every future migration is SILENTLY SKIPPED. This script deletes it, so the
 * database it produces can actually be migrated by `vercel-build`. See
 * docs/MAINTENANCE.md §12.8.
 *
 * USAGE
 * -----
 *   POSTGRES_URL='postgresql://...@ep-xxx.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require' \
 *     pnpm tsx scripts/setup-fresh-db.ts
 *
 * Use the DIRECT (non-pooler) endpoint: schema changes through PgBouncer are less
 * predictable than through a direct connection. The app runtime should still use
 * the `-pooler` endpoint.
 *
 * Refuses to run against a database that already has tables, so it cannot wipe a
 * live database by accident.
 */
import 'dotenv/config'

// Must be set before the config is imported (see the header).
process.env.PAYLOAD_PUSH_SCHEMA = 'true'
delete process.env.NODE_ENV

const { default: pg } = await import('pg')

const connectionString = process.env.POSTGRES_URL
if (!connectionString) {
  console.error('POSTGRES_URL is not set.')
  process.exit(1)
}
if (connectionString.includes('-pooler.')) {
  console.error(
    'POSTGRES_URL points at a -pooler endpoint. Use the direct endpoint for schema creation;\n' +
      'the app runtime should use the pooler instead.',
  )
  process.exit(1)
}

async function countTables(client: { query: (s: string) => Promise<{ rows: unknown[] }> }): Promise<number> {
  const r = (await client.query(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`,
  )) as { rows: Array<{ n: number }> }
  return r.rows[0].n
}

const guard = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30_000 })
guard.on('error', () => {})
await guard.connect()
const before = await countTables(guard)
if (before > 0) {
  console.error(
    `Refusing to run: the target database already has ${before} table(s).\n` +
      'This script only initialises an EMPTY database. Drop the schema first if that is really what you want.',
  )
  await guard.end()
  process.exit(1)
}
console.log(`target database is empty (${before} tables) — creating schema via dev push\n`)

// Building the schema happens inside the adapter's connect(), triggered by the
// first database operation.
const { getPayload } = await import('payload')
const payload = await getPayload({ config: (await import('../src/payload.config')).default })
await payload.find({ collection: 'products', limit: 1, depth: 0 })

const tables = await countTables(guard)
console.log(`\nschema created: ${tables} tables in public`)

const devRows = (await guard.query(`SELECT id FROM payload_migrations WHERE batch = -1`)) as {
  rows: Array<{ id: number }>
  rowCount?: number
}
const removed = devRows.rows.length
if (removed > 0) {
  await guard.query(`DELETE FROM payload_migrations WHERE batch = -1`)
}
console.log(`payload_migrations: removed ${removed} dev marker row(s); remaining:`)
const rest = (await guard.query(`SELECT name, batch FROM payload_migrations ORDER BY batch`)) as {
  rows: Array<{ name: string; batch: number }>
}
for (const r of rest.rows) console.log(`  batch ${r.batch}: ${r.name}`)

await guard.end()
await payload.destroy?.()
console.log('\ndone.')
process.exit(0)
