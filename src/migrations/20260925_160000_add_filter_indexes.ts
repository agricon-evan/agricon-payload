import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Creates the indexes that the collections declare with `index: true` on their
 * filter columns.
 *
 * WHY THEY WERE MISSING EVERYWHERE
 * --------------------------------
 * `src/collections/*.ts` marks the six columns below with `index: true`, and the
 * comments there explain the intent ("Payload auto-indexes unique/relationship/
 * timestamp fields but not plain checkbox filters"). The indexes existed in
 * neither database:
 *
 *   - Production cannot get them from push: the Postgres adapter hard-disables
 *     `pushDevSchema` when `NODE_ENV === 'production'`
 *     (`@payloadcms/db-vercel-postgres/dist/connect.js`). Migrations are the only
 *     mechanism, and the previous migration only created indexes for the tables
 *     it added.
 *   - The dev database never gets them either, because `.env` sets
 *     `PAYLOAD_PUSH_SCHEMA=false`, which `payload.config.ts` turns into
 *     `push: false`. So a local `pnpm dev` does not push schema at all.
 *
 * The net effect was that a config change intended to index the columns every
 * public read filters on was a silent no-op. Verified with
 * `SELECT indexdef FROM pg_indexes WHERE indexdef ILIKE '%(published)%'`, which
 * returned nothing for all six tables.
 *
 * WHY IT MATTERS
 * --------------
 * Every public read filters these columns — `where: { published: { equals: true } }`
 * in `src/lib/payload.ts` and `src/app/(frontend)/sitemap.ts`. `inquiries` is the
 * one collection that grows without bound and its admin list sorts and filters on
 * `status`.
 *
 * NAMING
 * ------
 * Names follow Payload's own convention (`buildIndexName`), `<table>_<column>_idx`,
 * so a future generated migration recognises them as already-present instead of
 * emitting a duplicate under a different name.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "blog_posts_published_idx" ON "blog_posts" USING btree ("published");
    CREATE INDEX IF NOT EXISTS "case_studies_published_idx" ON "case_studies" USING btree ("published");
    CREATE INDEX IF NOT EXISTS "downloads_published_idx" ON "downloads" USING btree ("published");
    CREATE INDEX IF NOT EXISTS "faqs_published_idx" ON "faqs" USING btree ("published");
    CREATE INDEX IF NOT EXISTS "videos_published_idx" ON "videos" USING btree ("published");
    CREATE INDEX IF NOT EXISTS "inquiries_status_idx" ON "inquiries" USING btree ("status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "blog_posts_published_idx";
    DROP INDEX IF EXISTS "case_studies_published_idx";
    DROP INDEX IF EXISTS "downloads_published_idx";
    DROP INDEX IF EXISTS "faqs_published_idx";
    DROP INDEX IF EXISTS "videos_published_idx";
    DROP INDEX IF EXISTS "inquiries_status_idx";
  `)
}
