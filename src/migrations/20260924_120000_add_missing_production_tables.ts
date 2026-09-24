import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds the tables that exist in the Payload config but were never created in the
 * production database.
 *
 * WHY THIS IS NEEDED AT ALL
 * -------------------------
 * `payload.config.ts` sets `push: process.env.PAYLOAD_PUSH_SCHEMA !== 'false'`,
 * and its comment claims "the first production deploy relies on push to build the
 * full schema". That is not true in production. The adapter hard-disables push
 * outside development — `@payloadcms/db-vercel-postgres/dist/connect.js`:
 *
 *     // Only push schema if not in production
 *     if (process.env.NODE_ENV !== 'production' && ... && this.push !== false) {
 *       await pushDevSchema(this)
 *     }
 *
 * With `NODE_ENV=production` on Vercel, push never runs, and this project's
 * migration list was empty. The net effect: **every schema change made after the
 * production database was created was invisible to production.** Deploying the
 * code that reads those columns made `/api/products` and `/api/siteSettings`
 * return 500, which in turn took down every page that reads them.
 *
 * The affected fields, and the commit that introduced each:
 *   - `products.faqs` + `products.detailImages`      (8a8aee3)
 *   - the six localized `siteSettings.home*` arrays  (the §8 home-content work)
 *
 * WHY IT IS WRITTEN THIS WAY
 * --------------------------
 * - `IF NOT EXISTS` everywhere, so it is safe to re-run and safe on a database
 *   that partially received the schema.
 * - The six `site_settings_home_*` PARENT tables are deliberately NOT recreated:
 *   production already has them from the earlier non-localized (json) version.
 *   Only the `_locales` and nested `_items` tables are missing.
 * - Those parent tables still carry the OLD columns (`title`, `desc`, `sub`,
 *   `quote`) as `NOT NULL`. After this migration the values live in `_locales`,
 *   so nothing writes those columns any more — and a NOT NULL column that is
 *   never written makes every insert fail. They are relaxed to nullable, NOT
 *   dropped, because `scripts/migrate-home-content.ts` reads them to backfill
 *   the localized tables (`readLegacy`). Drop them only after that backfill has
 *   been run against production.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── products.faqs ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "products_faqs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "products_faqs_locales" (
      "question" varchar,
      "answer" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    -- ── products.detailImages ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "products_detail_images" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer
    );

    CREATE TABLE IF NOT EXISTS "products_detail_images_locales" (
      "alt" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    -- ── siteSettings.homeTestimonials (localized quote/role) ───────────────
    CREATE TABLE IF NOT EXISTS "site_settings_home_testimonials_locales" (
      "quote" varchar NOT NULL,
      "role" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    -- ── siteSettings.homeWhyChooseUs ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "site_settings_home_why_choose_us_locales" (
      "title" varchar NOT NULL,
      "desc" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    -- ── siteSettings.homeHowWeWork ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "site_settings_home_how_we_work_locales" (
      "title" varchar NOT NULL,
      "desc" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    -- ── siteSettings.homeGlobalCoverage ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "site_settings_home_global_coverage_locales" (
      "title" varchar NOT NULL,
      "sub" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    -- ── siteSettings.homeValueCalculated ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS "site_settings_home_value_calculated_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "site_settings_home_value_calculated_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "site_settings_home_value_calculated_items_locales" (
      "label" varchar NOT NULL,
      "value" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    -- ── siteSettings.homeTrustEvidence ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "site_settings_home_trust_evidence_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "site_settings_home_trust_evidence_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "site_settings_home_trust_evidence_items_locales" (
      "text" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
  `)

  // Foreign keys. Added in a guarded block because Postgres has no
  // `ADD CONSTRAINT IF NOT EXISTS`.
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_faqs_parent_id_fk') THEN
        ALTER TABLE "products_faqs" ADD CONSTRAINT "products_faqs_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_faqs_locales_parent_id_fk') THEN
        ALTER TABLE "products_faqs_locales" ADD CONSTRAINT "products_faqs_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."products_faqs"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_detail_images_parent_id_fk') THEN
        ALTER TABLE "products_detail_images" ADD CONSTRAINT "products_detail_images_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_detail_images_image_id_media_id_fk') THEN
        ALTER TABLE "products_detail_images" ADD CONSTRAINT "products_detail_images_image_id_media_id_fk"
          FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_detail_images_locales_parent_id_fk') THEN
        ALTER TABLE "products_detail_images_locales" ADD CONSTRAINT "products_detail_images_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."products_detail_images"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_testimonials_locales_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_testimonials_locales" ADD CONSTRAINT "site_settings_home_testimonials_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_testimonials"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_why_choose_us_locales_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_why_choose_us_locales" ADD CONSTRAINT "site_settings_home_why_choose_us_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_why_choose_us"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_how_we_work_locales_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_how_we_work_locales" ADD CONSTRAINT "site_settings_home_how_we_work_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_how_we_work"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_global_coverage_locales_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_global_coverage_locales" ADD CONSTRAINT "site_settings_home_global_coverage_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_global_coverage"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_value_calculated_locales_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_value_calculated_locales" ADD CONSTRAINT "site_settings_home_value_calculated_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_value_calculated"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_value_calculated_items_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_value_calculated_items" ADD CONSTRAINT "site_settings_home_value_calculated_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_value_calculated"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_value_calculated_items_locales_parent__fk') THEN
        ALTER TABLE "site_settings_home_value_calculated_items_locales" ADD CONSTRAINT "site_settings_home_value_calculated_items_locales_parent__fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_value_calculated_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_trust_evidence_locales_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_trust_evidence_locales" ADD CONSTRAINT "site_settings_home_trust_evidence_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_trust_evidence"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_trust_evidence_items_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_trust_evidence_items" ADD CONSTRAINT "site_settings_home_trust_evidence_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_trust_evidence"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_home_trust_evidence_items_locales_parent_id_fk') THEN
        ALTER TABLE "site_settings_home_trust_evidence_items_locales" ADD CONSTRAINT "site_settings_home_trust_evidence_items_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_trust_evidence_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END
    $$;
  `)

  // Index names match the ones Payload's own `migrate:create` generates, so a
  // future schema diff does not try to re-create them under a different name.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_faqs_order_idx" ON "products_faqs" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_faqs_parent_id_idx" ON "products_faqs" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "products_faqs_locales_locale_parent_id_unique" ON "products_faqs_locales" USING btree ("_locale","_parent_id");

    CREATE INDEX IF NOT EXISTS "products_detail_images_order_idx" ON "products_detail_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_detail_images_parent_id_idx" ON "products_detail_images" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_detail_images_image_idx" ON "products_detail_images" USING btree ("image_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "products_detail_images_locales_locale_parent_id_unique" ON "products_detail_images_locales" USING btree ("_locale","_parent_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_home_testimonials_locales_locale_parent_id_uni" ON "site_settings_home_testimonials_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_home_why_choose_us_locales_locale_parent_id_un" ON "site_settings_home_why_choose_us_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_home_how_we_work_locales_locale_parent_id_uniq" ON "site_settings_home_how_we_work_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_home_global_coverage_locales_locale_parent_id_" ON "site_settings_home_global_coverage_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_home_value_calculated_locales_locale_parent_id" ON "site_settings_home_value_calculated_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_home_trust_evidence_locales_locale_parent_id_u" ON "site_settings_home_trust_evidence_locales" USING btree ("_locale","_parent_id");

    CREATE INDEX IF NOT EXISTS "site_settings_home_value_calculated_items_order_idx" ON "site_settings_home_value_calculated_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_home_value_calculated_items_parent_id_idx" ON "site_settings_home_value_calculated_items" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_home_value_calculated_items_locales_locale_par" ON "site_settings_home_value_calculated_items_locales" USING btree ("_locale","_parent_id");

    CREATE INDEX IF NOT EXISTS "site_settings_home_trust_evidence_items_order_idx" ON "site_settings_home_trust_evidence_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_home_trust_evidence_items_parent_id_idx" ON "site_settings_home_trust_evidence_items" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_home_trust_evidence_items_locales_locale_paren" ON "site_settings_home_trust_evidence_items_locales" USING btree ("_locale","_parent_id");
  `)

  // Relax the superseded non-localized columns. They now hold no value that the
  // config reads, but they are NOT NULL, so leaving them alone would make every
  // insert into the parent tables fail. The data itself is preserved for
  // `scripts/migrate-home-content.ts` to backfill from.
  await db.execute(sql`
    ALTER TABLE "site_settings_home_testimonials" ALTER COLUMN "quote" DROP NOT NULL;
    ALTER TABLE "site_settings_home_why_choose_us" ALTER COLUMN "title" DROP NOT NULL;
    ALTER TABLE "site_settings_home_why_choose_us" ALTER COLUMN "desc" DROP NOT NULL;
    ALTER TABLE "site_settings_home_how_we_work" ALTER COLUMN "title" DROP NOT NULL;
    ALTER TABLE "site_settings_home_how_we_work" ALTER COLUMN "desc" DROP NOT NULL;
    ALTER TABLE "site_settings_home_global_coverage" ALTER COLUMN "title" DROP NOT NULL;
    ALTER TABLE "site_settings_home_global_coverage" ALTER COLUMN "sub" DROP NOT NULL;
    ALTER TABLE "site_settings_home_value_calculated" ALTER COLUMN "title" DROP NOT NULL;
    ALTER TABLE "site_settings_home_trust_evidence" ALTER COLUMN "title" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Re-tightening the columns is intentionally not attempted: by the time this
  // runs the localized rows are the source of truth, so the legacy columns may
  // legitimately be NULL.
  await db.execute(sql`
    DROP TABLE IF EXISTS "site_settings_home_trust_evidence_items_locales" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_trust_evidence_items" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_trust_evidence_locales" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_value_calculated_items_locales" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_value_calculated_items" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_value_calculated_locales" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_global_coverage_locales" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_how_we_work_locales" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_why_choose_us_locales" CASCADE;
    DROP TABLE IF EXISTS "site_settings_home_testimonials_locales" CASCADE;
    DROP TABLE IF EXISTS "products_detail_images_locales" CASCADE;
    DROP TABLE IF EXISTS "products_detail_images" CASCADE;
    DROP TABLE IF EXISTS "products_faqs_locales" CASCADE;
    DROP TABLE IF EXISTS "products_faqs" CASCADE;
  `)
}
