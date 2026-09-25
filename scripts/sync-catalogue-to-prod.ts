/**
 * Sync the local catalogue into production (Vercel Postgres + Vercel Blob).
 *
 * WHY THIS EXISTS
 * ---------------
 * The dev DB (SQLite) and the production DB (Postgres) drifted apart: local has
 * 65 products, production had 43. 33 products exist only locally and 11 exist
 * only in production. The 11 are *superseded* listings that were later deleted
 * on the local side — every one of them still has a 301 in `next.config.ts`
 * (e.g. `h-type-layer-cage-96-160-birds` → the newer layer-cage listings), so
 * removing them from production keeps inbound links working.
 *
 * Local is authoritative. This script makes production match it:
 *
 *   1. `media`    — upload every local media file that production lacks.
 *                   Files live in `media/`; production serves them from Blob.
 *   2. `products` — create the products production is missing, in all six
 *                   locales. Relationships (subcategory / solutions / media)
 *                   are resolved **by slug / filename**, never by id, because
 *                   the two databases number their rows independently.
 *   3. `delete`   — remove the superseded production-only listings.
 *
 * USAGE
 *   pnpm tsx scripts/sync-catalogue-to-prod.ts                     # dry run
 *   pnpm tsx scripts/sync-catalogue-to-prod.ts --apply
 *   pnpm tsx scripts/sync-catalogue-to-prod.ts --apply --steps=media
 *   pnpm tsx scripts/sync-catalogue-to-prod.ts --apply --steps=products,delete
 *
 * Idempotent: media and products already present are skipped, so an interrupted
 * run can simply be repeated.
 *
 * Run with POSTGRES_URL + BLOB_READ_WRITE_TOKEN pointing at production.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const MEDIA_DIR = path.join(ROOT, 'media')
const LOCALES = ['en', 'ru', 'fr', 'es', 'sw', 'ar'] as const
type Locale = (typeof LOCALES)[number]

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const STEPS = (args.find((a) => a.startsWith('--steps='))?.split('=')[1] ?? 'media,subcategories,products,reassign,content,misc,delete').split(',')

/** Superseded production-only listings. Each has a 301 in `next.config.ts`. */
const SUPERSEDED = [
  'poultry-feeding-and-watering-set',
  'small-chaff-cutter-400kg-h',
  '4-8t-multi-function-chaff-cutter',
  'large-chaff-cutter-5t-h',
  'h-type-layer-cage-96-160-birds',
  'h-type-layer-cage-battery-system',
  'feed-mixing-and-grinding-machine',
  'h-type-rabbit-cage',
  'bean-thresher-200kg-h',
  'corn-peeling-and-shelling-machine',
  'electric-peanut-sheller',
]

const local = createClient({ url: `file:${path.join(ROOT, 'agricon-dev.db')}` })

type Row = Record<string, unknown>
async function lq(sql: string, params: unknown[] = []): Promise<Row[]> {
  return (await local.execute({ sql, args: params as never[] })).rows as unknown as Row[]
}
async function lq1(sql: string, params: unknown[] = []): Promise<Row | undefined> {
  return (await lq(sql, params))[0]
}
const s = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

/** Reads an array field plus its localized sub-fields for one locale. */
async function readArray(
  table: string,
  parentId: number,
  locale: Locale,
  localeFields: string[],
  relation?: { column: string; field: string },
): Promise<Array<Record<string, unknown>>> {
  const rows = await lq(
    `SELECT r.id AS __row, r._order AS __order${relation ? `, r.${relation.column} AS __rel` : ''}
       FROM ${table} r WHERE r._parent_id = ? ORDER BY r._order`,
    [parentId],
  )
  const out: Array<Record<string, unknown>> = []
  for (const r of rows) {
    const loc = await lq1(`SELECT * FROM ${table}_locales WHERE _parent_id = ? AND _locale = ?`, [r.__row, locale])
    // Array-row ids are NOT always numeric: Payload stores 24-char hex strings
    // for some rows. `Number()` turned those into NaN, which Payload rejected
    // with "The following field is invalid: id" mid-create — leaving the parent
    // document written but the nested arrays empty. Keep the raw value.
    const item: Record<string, unknown> = { id: r.__row as number | string }
    if (relation) item[relation.field] = r.__rel === null ? null : Number(r.__rel)
    for (const f of localeFields) item[f] = loc ? s(loc[f]) || null : null
    out.push(item)
  }
  return out
}

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  // ---------- reference maps (production) ----------
  const prodSubs = await payload.find({ collection: 'subcategories', limit: 500, pagination: false, depth: 0, select: { slug: true } })
  const subIdBySlug = new Map<string, number>()
  for (const d of prodSubs.docs as unknown as Array<{ id: number; slug?: string }>) if (d.slug) subIdBySlug.set(d.slug, d.id)

  const prodSols = await payload.find({ collection: 'solutions', limit: 500, pagination: false, depth: 0, select: { slug: true } })
  const solIdBySlug = new Map<string, number>()
  for (const d of prodSols.docs as unknown as Array<{ id: number; slug?: string }>) if (d.slug) solIdBySlug.set(d.slug, d.id)

  const prodCats = await payload.find({ collection: 'categories', limit: 500, pagination: false, depth: 0, select: { slug: true } })
  const catIdBySlug = new Map<string, number>()
  for (const d of prodCats.docs as unknown as Array<{ id: number; slug?: string }>) if (d.slug) catIdBySlug.set(d.slug, d.id)

  const prodMedia = await payload.find({ collection: 'media', limit: 2000, pagination: false, depth: 0, select: { filename: true } })
  const mediaIdByFilename = new Map<string, number>()
  for (const d of prodMedia.docs as unknown as Array<{ id: number; filename?: string }>) if (d.filename) mediaIdByFilename.set(d.filename, d.id)

  console.log(`production: ${subIdBySlug.size} subcategories, ${solIdBySlug.size} solutions, ${mediaIdByFilename.size} media\n`)

  // ---------- 1. media ----------
  if (STEPS.includes('media')) {
    const localMedia = await lq(`SELECT id, filename, mime_type, alt FROM media ORDER BY id`)
    const missing = localMedia.filter((m) => !mediaIdByFilename.has(s(m.filename)))
    console.log(`[media] local=${localMedia.length} missing-in-prod=${missing.length}`)
    let uploaded = 0
    const failures: string[] = []
    for (const m of missing) {
      const filename = s(m.filename)
      const abs = path.join(MEDIA_DIR, filename)
      if (!fs.existsSync(abs)) {
        failures.push(`${filename}: file not found in media/`)
        continue
      }
      if (!apply) continue
      try {
        const data = fs.readFileSync(abs)
        const created = await payload.create({
          collection: 'media',
          data: { alt: s(m.alt) || filename },
          file: { data, mimetype: s(m.mime_type) || 'application/octet-stream', name: filename, size: data.length },
        })
        mediaIdByFilename.set(filename, created.id)
        uploaded += 1
        if (uploaded % 20 === 0) console.log(`   … ${uploaded}/${missing.length}`)
      } catch (err) {
        failures.push(`${filename}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
      }
    }
    console.log(`[media] ${apply ? `uploaded ${uploaded}` : `would upload ${missing.length}`}`)
    if (failures.length) {
      console.error(`[media] ${failures.length} failure(s):`)
      for (const f of failures.slice(0, 15)) console.error('   ' + f)
    }
  }

  // ---------- 1b. subcategories ----------
  if (STEPS.includes('subcategories')) {
    const localSubs = await lq(`SELECT * FROM subcategories ORDER BY id`)
    const missingSubs = localSubs.filter((r) => !subIdBySlug.has(s(r.slug)))
    console.log(`\n[subcategories] local=${localSubs.length} prod=${subIdBySlug.size} to-create=${missingSubs.length}`)
    const failures: string[] = []
    for (const sub of missingSubs) {
      const catRow = await lq1(`SELECT slug FROM categories WHERE id = ?`, [Number(sub.category_id)])
      const catId = catRow ? catIdBySlug.get(s(catRow.slug)) : undefined
      if (!catId) {
        failures.push(`${s(sub.slug)}: category "${s(catRow?.slug)}" not in production`)
        continue
      }
      const perLocale: Record<string, Record<string, unknown>> = {}
      for (const loc of LOCALES) {
        const l = (await lq1(`SELECT * FROM subcategories_locales WHERE _parent_id = ? AND _locale = ?`, [Number(sub.id), loc])) ?? {}
        perLocale[loc] = { name: s(l.name) || s(sub.slug), description: s(l.description) || null, subtitle: s(l.subtitle) || null }
      }
      if (!apply) continue
      try {
        const doc = await payload.create({
          collection: 'subcategories',
          locale: 'en',
          data: { slug: s(sub.slug), category: catId, sortOrder: Number(sub.sort_order ?? 0), ...perLocale.en } as never,
        })
        for (const loc of LOCALES) {
          if (loc === 'en') continue
          await payload.update({ collection: 'subcategories', id: doc.id, locale: loc, data: perLocale[loc] as never })
        }
        subIdBySlug.set(s(sub.slug), doc.id)
        console.log(`   ✓ ${s(sub.slug)}`)
      } catch (err) {
        failures.push(`${s(sub.slug)}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
      }
    }
    console.log(`[subcategories] ${apply ? 'created' : 'would create'} ${missingSubs.length - failures.length}`)
    for (const f of failures) console.error('   ✗ ' + f)
  }

  // ---------- 1c. reassign products to match local subcategories ----------
  if (STEPS.includes('reassign')) {
    const localAssign = await lq(`SELECT p.id, p.slug, s.slug AS sub FROM products p LEFT JOIN subcategories s ON s.id = p.subcategory_id`)
    const prodDocs = await payload.find({ collection: 'products', limit: 1000, pagination: false, depth: 1, select: { slug: true, subcategory: true } })
    const moved: string[] = []
    const failures: string[] = []
    for (const d of prodDocs.docs as unknown as Array<{ id: number; slug?: string; subcategory?: { slug?: string } | number | null }>) {
      const la = localAssign.find((r) => s(r.slug) === s(d.slug))
      if (!la) continue
      const wantSub = s(la.sub)
      const haveSub = typeof d.subcategory === 'object' && d.subcategory ? s(d.subcategory.slug) : ''
      if (!wantSub || wantSub === haveSub) continue
      const targetId = subIdBySlug.get(wantSub)
      if (!targetId) {
        failures.push(`${s(d.slug)}: target subcategory "${wantSub}" not in production`)
        continue
      }
      if (!apply) {
        moved.push(`${s(d.slug)}: ${haveSub || '(none)'} → ${wantSub}`)
        continue
      }
      try {
        await payload.update({ collection: 'products', id: d.id, data: { subcategory: targetId } as never })
        moved.push(`${s(d.slug)}: ${haveSub || '(none)'} → ${wantSub}`)
      } catch (err) {
        failures.push(`${s(d.slug)}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
      }
    }
    console.log(`\n[reassign] ${moved.length} product(s) to move`)
    for (const m of moved) console.log('   ✓ ' + m)
    for (const f of failures) console.error('   ✗ ' + f)
  }

  // ---------- 2. products ----------
  if (STEPS.includes('products')) {
    const localSlugs = (await lq(`SELECT slug FROM products ORDER BY id`)).map((r) => s(r.slug))
    const prodSlugs = new Set(
      (await payload.find({ collection: 'products', limit: 1000, pagination: false, depth: 0, select: { slug: true } })).docs.map(
        (d) => s((d as unknown as { slug?: string }).slug),
      ),
    )
    const toCreate = localSlugs.filter((slug) => !prodSlugs.has(slug))
    console.log(`\n[products] local=${localSlugs.length} prod=${prodSlugs.size} to-create=${toCreate.length}`)

    let created = 0
    const failures: string[] = []

    for (const slug of toCreate) {
      const p = await lq1(`SELECT * FROM products WHERE slug = ?`, [slug])
      if (!p) continue
      const pid = Number(p.id)

      const subSlugRow = await lq1(`SELECT slug FROM subcategories WHERE id = ?`, [Number(p.subcategory_id)])
      const subId = subSlugRow ? subIdBySlug.get(s(subSlugRow.slug)) : undefined
      if (!subId) {
        failures.push(`${slug}: subcategory "${s(subSlugRow?.slug)}" not in production`)
        continue
      }

      const solRows = await lq(`SELECT s.slug FROM products_rels r JOIN solutions s ON s.id = r.solutions_id WHERE r.parent_id = ? AND r.path = 'solutions' ORDER BY r."order"`, [pid])
      const solIds = solRows.map((r) => solIdBySlug.get(s(r.slug))).filter((x): x is number => typeof x === 'number')

      // media relationship maps
      const imgRows = await lq(`SELECT i.id __row, i.image_id FROM products_images i WHERE i._parent_id = ? ORDER BY i._order`, [pid])
      const imgMediaIds = new Map<string, number>()
      for (const r of imgRows) {
        const fn = await lq1(`SELECT filename FROM media WHERE id = ?`, [Number(r.image_id)])
        const mid = fn ? mediaIdByFilename.get(s(fn.filename)) : undefined
        if (mid) imgMediaIds.set(String(r.__row), mid)
      }
      const seoFn = p.seo_image_id ? await lq1(`SELECT filename FROM media WHERE id = ?`, [Number(p.seo_image_id)]) : undefined
      const seoMediaId = seoFn ? mediaIdByFilename.get(s(seoFn.filename)) : undefined

      // build per-locale payloads
      const perLocale: Record<string, Record<string, unknown>> = {}
      for (const loc of LOCALES) {
        const l = (await lq1(`SELECT * FROM products_locales WHERE _parent_id = ? AND _locale = ?`, [pid, loc])) ?? {}
        const images = (await readArray('products_images', pid, loc, ['alt'], { column: 'image_id', field: 'image' })).map((row) => ({
          id: row.id,
          image: imgMediaIds.get(String(row.id)) ?? null,
          alt: row.alt,
        }))
        const features = await readArray('products_features', pid, loc, ['feature'])
        const specs = await readArray('products_specs', pid, loc, ['label', 'value'])
        const faqs = await readArray('products_faqs', pid, loc, ['question', 'answer'])
        perLocale[loc] = {
          name: s(l.name) || slug,
          description: s(l.description) || null,
          overviewHtml: s(l.overview_html) || null,
          seoTitle: s(l.seo_title) || null,
          seoDescription: s(l.seo_description) || null,
          images,
          features,
          specs,
          faqs,
        }
      }

      const tags = (await lq(`SELECT tag FROM products_tags WHERE _parent_id = ? ORDER BY _order`, [pid])).map((r) => ({ tag: s(r.tag) }))

      const base = {
        slug,
        price: s(p.price) || null,
        moq: s(p.moq) || null,
        seoKeywords: s(p.seo_keywords) || null,
        featured: Boolean(p.featured),
        sortOrder: Number(p.sort_order ?? 0),
        subcategory: subId,
        solutions: solIds,
        tags,
        seoImage: seoMediaId ?? null,
      }

      if (!apply) {
        created += 1
        continue
      }

      try {
        // English first, then read the row ids back so the other five locales
        // update the existing array rows instead of recreating them.
        //
        // `payload.create` rejects `id` on array rows (they do not exist yet),
        // so the ids are stripped for the initial write and only reintroduced
        // for the per-locale updates below.
        const ARRAY_FIELDS = ['images', 'features', 'specs', 'faqs']
        const enData: Record<string, unknown> = { ...base, ...perLocale.en }
        for (const f of ARRAY_FIELDS) {
          const rows = enData[f]
          if (Array.isArray(rows)) {
            enData[f] = rows.map((r) => {
              const { id: _drop, ...rest } = r as Record<string, unknown>
              return rest
            })
          }
        }
        const doc = await payload.create({
          collection: 'products',
          locale: 'en',
          data: enData as never,
        })
        for (const loc of LOCALES) {
          if (loc === 'en') continue
          await payload.update({
            collection: 'products',
            id: doc.id,
            locale: loc,
            data: perLocale[loc] as never,
          })
        }
        created += 1
        console.log(`   ✓ ${slug}`)
      } catch (err) {
        failures.push(`${slug}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
      }
    }

    console.log(`[products] ${apply ? `created ${created}` : `would create ${toCreate.length}`}`)
    if (failures.length) {
      console.error(`[products] ${failures.length} failure(s):`)
      for (const f of failures.slice(0, 20)) console.error('   ' + f)
    }
  }

  // ---------- 2b. localized content for products already in production ----------
  //
  // Products created above already carry every locale. This step is for the
  // products the two databases share: production was populated before the
  // translation pass, so their `name` / `description` / `seoTitle` /
  // `seoDescription` / `features` / `specs` / image `alt` are still English in
  // all five non-English locales.
  //
  // Nested arrays are localized *per row*, so writing locale-by-locale without
  // row ids makes Payload recreate the rows and drop the other locales. The row
  // ids are therefore read back from production and matched to the local rows
  // **by index** — safe because both sides were built from the same import, and
  // any length mismatch is reported instead of guessed at.
  if (STEPS.includes('content')) {
    console.log(`\n[content] syncing localized product fields from local`)
    const prodAll = await payload.find({ collection: 'products', limit: 1000, pagination: false, depth: 0 })
    let updated = 0
    const failures: string[] = []
    const mismatches: string[] = []

    for (const doc of prodAll.docs as unknown as Array<Record<string, unknown>>) {
      const slug = s(doc.slug)
      const pid = Number(doc.id)
      const localRow = await lq1(`SELECT id FROM products WHERE slug = ?`, [slug])
      if (!localRow) continue
      const localId = Number(localRow.id)

      // Resume support: a full pass over 65 products x 5 locales is slow enough
      // to outlive a single run, so skip anything already localized. Russian is
      // written first, so a non-empty Russian name means the whole product was
      // done (the five locales are written in a fixed order, ru → ar).
      const alreadyDone = await payload.findByID({
        collection: 'products',
        id: pid,
        locale: 'ru',
        fallbackLocale: false,
        depth: 0,
        select: { name: true },
      })
      if (s((alreadyDone as unknown as { name?: string | null }).name)) continue

      // production's current array rows (ids are what we must reuse)
      const pImages = (doc.images as Array<{ id: number; image: number | null }> | undefined) ?? []
      const pFeatures = (doc.features as Array<{ id: number }> | undefined) ?? []
      const pSpecs = (doc.specs as Array<{ id: number }> | undefined) ?? []
      const pFaqs = (doc.faqs as Array<{ id: number }> | undefined) ?? []

      const lImages = await lq(`SELECT id FROM products_images WHERE _parent_id = ? ORDER BY _order`, [localId])
      const lFeatures = await lq(`SELECT id FROM products_features WHERE _parent_id = ? ORDER BY _order`, [localId])
      const lSpecs = await lq(`SELECT id FROM products_specs WHERE _parent_id = ? ORDER BY _order`, [localId])
      const lFaqs = await lq(`SELECT id FROM products_faqs WHERE _parent_id = ? ORDER BY _order`, [localId])

      const shapeOk =
        pImages.length === lImages.length &&
        pFeatures.length === lFeatures.length &&
        pSpecs.length === lSpecs.length &&
        pFaqs.length === lFaqs.length
      if (!shapeOk) {
        mismatches.push(
          `${slug}: row counts differ (images ${pImages.length}/${lImages.length}, features ${pFeatures.length}/${lFeatures.length}, specs ${pSpecs.length}/${lSpecs.length}, faqs ${pFaqs.length}/${lFaqs.length})`,
        )
        continue
      }

      for (const loc of LOCALES) {
        const l = (await lq1(`SELECT * FROM products_locales WHERE _parent_id = ? AND _locale = ?`, [localId, loc])) ?? {}

        // Keyed by `_parent_id` (the array-row id) so ordering never matters and
        // string/hex row ids are handled the same as numeric ones.
        const locRows = async (tbl: string, rowIds: Array<unknown>, cols: string) => {
          const m = new Map<string, Row>()
          if (!rowIds.length) return m
          const ph = rowIds.map(() => '?').join(',')
          const rows = await lq(`SELECT _parent_id, ${cols} FROM ${tbl}_locales WHERE _parent_id IN (${ph}) AND _locale = ?`, [...rowIds, loc])
          for (const r of rows) m.set(String(r._parent_id), r)
          return m
        }

        const altById = await locRows('products_images', lImages.map((r) => r.id), 'alt')
        const featById = await locRows('products_features', lFeatures.map((r) => r.id), 'feature')
        const specById = await locRows('products_specs', lSpecs.map((r) => r.id), 'label, value')
        const faqById = await locRows('products_faqs', lFaqs.map((r) => r.id), 'question, answer')

        const data: Record<string, unknown> = {
          name: s(l.name) || undefined,
          description: s(l.description) || undefined,
          seoTitle: s(l.seo_title) || undefined,
          seoDescription: s(l.seo_description) || undefined,
        }
        if (pImages.length) {
          data.images = pImages.map((row, i) => ({
            id: row.id,
            image: row.image,
            alt: s(altById.get(String((lImages[i] as Row | undefined)?.id))?.alt) || null,
          }))
        }
        if (pFeatures.length) {
          data.features = pFeatures.map((row, i) => ({
            id: row.id,
            feature: s(featById.get(String((lFeatures[i] as Row | undefined)?.id))?.feature) || null,
          }))
        }
        if (pSpecs.length) {
          data.specs = pSpecs.map((row, i) => {
            const src = specById.get(String((lSpecs[i] as Row | undefined)?.id))
            return { id: row.id, label: s(src?.label) || null, value: s(src?.value) || null }
          })
        }
        if (pFaqs.length) {
          data.faqs = pFaqs.map((row, i) => {
            const src = faqById.get(String((lFaqs[i] as Row | undefined)?.id))
            return { id: row.id, question: s(src?.question) || null, answer: s(src?.answer) || null }
          })
        }

        if (!apply) continue
        try {
          await payload.update({ collection: 'products', id: pid, locale: loc, data: data as never })
          updated += 1
        } catch (err) {
          failures.push(`${slug}/${loc}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
        }
      }
    }

    console.log(`[content] ${apply ? `wrote ${updated} locale update(s)` : 'dry run'}`)
    if (mismatches.length) {
      console.error(`[content] ${mismatches.length} shape mismatch(es) — arrays skipped for these:`)
      for (const m of mismatches.slice(0, 20)) console.error('   ' + m)
    }
    if (failures.length) {
      console.error(`[content] ${failures.length} failure(s):`)
      for (const f of failures.slice(0, 20)) console.error('   ' + f)
    }
  }

  // ---------- 2c. localized content for the small collections ----------
  //
  // `blogPosts`, `caseStudies`, `faqCategories`, `solutions`, `categories` and
  // `subcategories` all carry localized scalar fields that production only ever
  // filled in for English (or partially — blogPosts had 1–2 of 3 locales).
  // Local is complete for all six, so this copies locale-by-locale.
  if (STEPS.includes('misc')) {
    console.log(`\n[misc] syncing localized fields for small collections`)
    const jobs: Array<{
      collection: string
      table: string
      key: 'slug' | 'enName'
      fields: Array<[col: string, field: string, kind: 'text' | 'json']>
    }> = [
      {
        collection: 'blogPosts',
        table: 'blog_posts',
        key: 'slug',
        fields: [
          ['title', 'title', 'text'],
          ['excerpt', 'excerpt', 'text'],
          ['content', 'content', 'json'],
        ],
      },
      {
        collection: 'caseStudies',
        table: 'case_studies',
        key: 'slug',
        fields: [
          ['title', 'title', 'text'],
          ['subtitle', 'subtitle', 'text'],
          ['summary', 'summary', 'text'],
          ['content', 'content', 'json'],
          ['location', 'location', 'text'],
          ['farm_name', 'farmName', 'text'],
          ['farm_scale', 'farmScale', 'text'],
          ['key_result', 'keyResult', 'text'],
          ['equipment', 'equipment', 'text'],
          ['application', 'application', 'text'],
          ['challenge', 'challenge', 'text'],
        ],
      },
      { collection: 'faqCategories', table: 'faq_categories', key: 'enName', fields: [['name', 'name', 'text']] },
      {
        collection: 'solutions',
        table: 'solutions',
        key: 'slug',
        fields: [
          ['name', 'name', 'text'],
          ['description', 'description', 'text'],
        ],
      },
      {
        collection: 'categories',
        table: 'categories',
        key: 'slug',
        fields: [
          ['name', 'name', 'text'],
          ['description', 'description', 'text'],
        ],
      },
      {
        collection: 'subcategories',
        table: 'subcategories',
        key: 'slug',
        fields: [
          ['name', 'name', 'text'],
          ['description', 'description', 'text'],
          ['subtitle', 'subtitle', 'text'],
        ],
      },
    ]

    let updated = 0
    const failures: string[] = []

    for (const job of jobs) {
      const prodDocs = await payload.find({
        collection: job.collection as never,
        limit: 1000,
        pagination: false,
        depth: 0,
        locale: 'en',
        ...(job.key === 'slug' ? { select: { slug: true } } : { select: { name: true } }),
      })
      const prodKeyToId = new Map<string, number>()
      for (const d of prodDocs.docs as unknown as Array<Record<string, unknown>>) {
        const k = s(job.key === 'slug' ? d.slug : d.name)
        if (k) prodKeyToId.set(k, Number(d.id))
      }

      const localRows = await lq(`SELECT * FROM ${job.table} ORDER BY id`)
      let n = 0
      for (const row of localRows) {
        const localId = Number(row.id)
        const en = (await lq1(`SELECT * FROM ${job.table}_locales WHERE _parent_id = ? AND _locale = 'en'`, [localId])) ?? {}
        const key = job.key === 'slug' ? s(row.slug) : s(en.name)
        const prodId = prodKeyToId.get(key)
        if (!prodId) {
          failures.push(`${job.collection}/${key}: not in production`)
          continue
        }
        for (const loc of LOCALES) {
          if (loc === 'en') continue
          const l = (await lq1(`SELECT * FROM ${job.table}_locales WHERE _parent_id = ? AND _locale = ?`, [localId, loc])) ?? {}
          const data: Record<string, unknown> = {}
          let any = false
          for (const [col, field, kind] of job.fields) {
            const raw = l[col]
            if (raw === null || raw === undefined || raw === '') continue
            if (kind === 'json') {
              try {
                data[field] = JSON.parse(String(raw))
              } catch {
                continue
              }
            } else {
              data[field] = String(raw)
            }
            any = true
          }
          if (!any || !apply) continue
          try {
            await payload.update({ collection: job.collection as never, id: prodId, locale: loc, data: data as never })
            updated += 1
            n += 1
          } catch (err) {
            failures.push(`${job.collection}/${key}/${loc}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
          }
        }
      }
      console.log(`   ${job.collection.padEnd(16)} ${apply ? `${n} locale write(s)` : `${localRows.length} doc(s) scanned`}`)
    }

    console.log(`[misc] ${apply ? `wrote ${updated} locale update(s)` : 'dry run'}`)
    if (failures.length) {
      console.error(`[misc] ${failures.length} failure(s):`)
      for (const f of failures.slice(0, 25)) console.error('   ' + f)
    }
  }

  // ---------- 3. delete superseded ----------
  if (STEPS.includes('delete')) {
    console.log(`\n[delete] superseded production-only listings: ${SUPERSEDED.length}`)
    let removed = 0
    const failures: string[] = []
    for (const slug of SUPERSEDED) {
      const found = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
      const doc = found.docs[0] as unknown as { id: number } | undefined
      if (!doc) {
        console.log(`   · ${slug} (already absent)`)
        continue
      }
      if (!apply) {
        removed += 1
        continue
      }
      try {
        await payload.delete({ collection: 'products', id: doc.id })
        removed += 1
        console.log(`   ✓ deleted ${slug}`)
      } catch (err) {
        failures.push(`${slug}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
      }
    }
    console.log(`[delete] ${apply ? `deleted ${removed}` : `would delete ${removed}`}`)
    if (failures.length) {
      console.error(`[delete] ${failures.length} failure(s):`)
      for (const f of failures) console.error('   ' + f)
    }

    // Subcategories local no longer has (e.g. `gestation-crate`,
    // `transport-crate` — both superseded by `farrow-pen` /
    // `breeding-accessories` in the local reassignment). Only removed once
    // nothing references them, so this can never orphan a product.
    const localSubSlugs = new Set((await lq(`SELECT slug FROM subcategories`)).map((r) => s(r.slug)))
    const prodSubsNow = await payload.find({ collection: 'subcategories', limit: 500, pagination: false, depth: 0, select: { slug: true } })
    let subsRemoved = 0
    for (const d of prodSubsNow.docs as unknown as Array<{ id: number; slug?: string }>) {
      const slug = s(d.slug)
      if (!slug || localSubSlugs.has(slug)) continue
      const used = await payload.count({ collection: 'products', where: { subcategory: { equals: d.id } } })
      if (used.totalDocs > 0) {
        console.log(`   · subcategory ${slug} still holds ${used.totalDocs} product(s) — left alone`)
        continue
      }
      if (!apply) {
        subsRemoved += 1
        console.log(`   · would delete empty subcategory ${slug}`)
        continue
      }
      try {
        await payload.delete({ collection: 'subcategories', id: d.id })
        subsRemoved += 1
        console.log(`   ✓ deleted empty subcategory ${slug}`)
      } catch (err) {
        console.error(`   ✗ subcategory ${slug}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
      }
    }
    console.log(`[delete] unused subcategories ${apply ? `deleted ${subsRemoved}` : `to delete ${subsRemoved}`}`)
  }

  await payload.destroy()
  local.close()
  console.log(`\n${apply ? 'APPLIED' : 'DRY RUN — pass --apply to write'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
