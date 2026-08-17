// Migrations are intentionally empty.
//
// This project deploys with Payload's runtime schema `push` (the config sets
// `push: true` unless PAYLOAD_PUSH_SCHEMA=false). On first run Payload creates
// the full schema in the production database (Vercel Postgres), so no checked-in
// migration is required to build or deploy.
//
// If you later prefer explicit, repeatable migrations, run:
//   pnpm payload migrate:create   # generates entries appended to this array
// and keep PAYLOAD_PUSH_SCHEMA=false in production to enforce migrations-only.
import type { Migration } from 'payload'

export const migrations: Migration[] = []
