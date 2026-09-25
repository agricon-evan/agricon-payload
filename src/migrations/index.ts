import * as migration_20260924_120000_add_missing_production_tables from './20260924_120000_add_missing_production_tables'
import * as migration_20260925_160000_add_filter_indexes from './20260925_160000_add_filter_indexes'

/**
 * Migrations must be registered here to run.
 *
 * `vercel-build` runs `payload migrate` before `next build`, and that is the ONLY
 * mechanism that changes the production schema: the Postgres adapter disables
 * schema `push` whenever `NODE_ENV === 'production'`
 * (`@payloadcms/db-vercel-postgres/dist/connect.js`), so a config change with no
 * migration here silently never reaches production. `.env` also sets
 * `PAYLOAD_PUSH_SCHEMA=false`, so push is off locally too.
 */
export const migrations = [
  {
    up: migration_20260924_120000_add_missing_production_tables.up,
    down: migration_20260924_120000_add_missing_production_tables.down,
    name: '20260924_120000_add_missing_production_tables',
  },
  {
    up: migration_20260925_160000_add_filter_indexes.up,
    down: migration_20260925_160000_add_filter_indexes.down,
    name: '20260925_160000_add_filter_indexes',
  },
]
