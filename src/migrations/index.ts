import * as migration_20260924_120000_add_missing_production_tables from './20260924_120000_add_missing_production_tables'

/**
 * Migrations must be registered here to run.
 *
 * `vercel-build` runs `payload migrate` before `next build`, and that is the ONLY
 * mechanism that changes the production schema: the Postgres adapter disables
 * schema `push` whenever `NODE_ENV === 'production'`
 * (`@payloadcms/db-vercel-postgres/dist/connect.js`), so a config change with no
 * migration here silently never reaches production.
 */
export const migrations = [
  {
    up: migration_20260924_120000_add_missing_production_tables.up,
    down: migration_20260924_120000_add_missing_production_tables.down,
    name: '20260924_120000_add_missing_production_tables',
  },
]
