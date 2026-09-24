/**
 * Migrate the homepage CMS content into the localized schema
 * (see docs/MAINTENANCE.md §8) and keep it translated.
 *
 * WHY THIS EXISTS
 * ---------------
 * The six `siteSettings` home arrays used to be single-language: their text
 * subfields were not `localized`, and two of them (`homeValueCalculated.items`,
 * `homeTrustEvidence.items`) were `type: 'json'` — and Payload cannot localize a
 * JSON field. The schema now stores the copy in `*_locales` side tables (and the
 * two json fields are nested arrays), so the English values that lived in the old
 * columns have to be copied into the new tables for `en`, and the other five
 * locales need their own rows.
 *
 * This script is the data half of that change:
 *
 *   pnpm tsx scripts/migrate-home-content.ts --export-todo   # write the translation work lists
 *   pnpm tsx scripts/migrate-home-content.ts --check         # report coverage, change nothing
 *   pnpm tsx scripts/migrate-home-content.ts --apply         # write en + every translated locale
 *
 * It reads the **legacy columns** (`title`/`desc`/`sub`/`quote`/`role`/`items`) with
 * raw SQL through Payload's own drizzle client, so the same command works against
 * the dev SQLite file and against the production Postgres database — the legacy
 * columns are left in place as a safety net rather than dropped.
 *
 * Translations live in `scripts/translations/<lang>-home.json` as a flat
 * English→translated map, the same convention as the product feature/spec
 * vocabulary, which keeps it stable across re-imports (row ids are not stable).
 *
 * Writes go through the local API rather than SQL: Payload owns row ids for array
 * rows, and writing a locale needs the existing ids so the text is updated in
 * place instead of duplicating rows.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const TODO_DIR = path.join(ROOT, 'scripts/translations/_todo')
const TR_DIR = path.join(ROOT, 'scripts/translations')
const LOCALES = ['ru', 'fr', 'es', 'sw', 'ar'] as const

const args = new Set(process.argv.slice(2))
const exportTodo = args.has('--export-todo')
const apply = args.has('--apply')
const checkOnly = args.has('--check')

/** Legacy table + the columns that hold the copy we must preserve. */
const LEGACY = {
  howWeWork: { table: 'site_settings_home_how_we_work', text: ['title', 'desc'] },
  whyChooseUs: { table: 'site_settings_home_why_choose_us', text: ['title', 'desc'] },
  globalCoverage: { table: 'site_settings_home_global_coverage', text: ['title', 'sub'] },
  testimonials: { table: 'site_settings_home_testimonials', text: ['quote', 'role'] },
  trustEvidence: { table: 'site_settings_home_trust_evidence', text: ['title'], json: ['items'] },
  valueCalculated: { table: 'site_settings_home_value_calculated', text: ['title'], json: ['items'] },
} as const

type LegacyRow = Record<string, unknown>

/**
 * Raw-SQL read that works on both adapters this project uses.
 *
 * Payload's database object differs per adapter: the SQLite adapter exposes a
 * libsql client (`db.client.execute`) and a drizzle instance with `all()`, while
 * the Postgres adapters expose drizzle with `execute()`. The SQL below is fixed
 * (no user input), so it is inlined rather than parameterised.
 */
async function query(payload: Payload, sql: string): Promise<LegacyRow[]> {
  const adapter = payload.db as unknown as {
    client?: { execute?: (query: string | { sql: string; args: unknown[] }) => Promise<unknown> }
    drizzle?: {
      execute?: (q: unknown) => Promise<unknown>
      all?: (q: unknown) => Promise<unknown>
    }
  }

  const normalise = (result: unknown): LegacyRow[] => {
    if (Array.isArray(result)) return result as LegacyRow[]
    const rows = (result as { rows?: LegacyRow[] })?.rows
    return Array.isArray(rows) ? rows : []
  }

  if (typeof adapter.client?.execute === 'function') {
    return normalise(await adapter.client.execute(sql))
  }
  const { sql: sqlTag } = await import('drizzle-orm')
  if (typeof adapter.drizzle?.execute === 'function') {
    return normalise(await adapter.drizzle.execute(sqlTag.raw(sql)))
  }
  if (typeof adapter.drizzle?.all === 'function') {
    return normalise(await adapter.drizzle.all(sqlTag.raw(sql)))
  }
  throw new Error('No raw-SQL handle found on payload.db — cannot read the legacy columns')
}

const legacySelect = (table: string, columns: string[]) =>
  `SELECT "id", "icon", ${columns.map((c) => `"${c}"`).join(', ')} FROM "${table}" ORDER BY "_order"`

/** Legacy table without an `icon` column (testimonials). */
const legacySelectNoIcon = (table: string, columns: string[]) =>
  `SELECT "id", ${columns.map((c) => `"${c}"`).join(', ')} FROM "${table}" ORDER BY "_order"`

interface HomeData {
  howWeWork: Array<{ icon?: string; title: string; desc: string }>
  whyChooseUs: Array<{ icon?: string; title: string; desc: string }>
  globalCoverage: Array<{ icon?: string; title: string; sub: string }>
  testimonials: Array<{ quote: string; name: string; role: string }>
  trustEvidence: Array<{ icon?: string; title: string; items: Array<{ text: string }> }>
  valueCalculated: Array<{ icon?: string; title: string; items: Array<{ label: string; value: string }> }>
}

const str = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value))

async function readLegacy(payload: Payload): Promise<HomeData> {
  const read = async (table: string, columns: string[]) =>
    payload ? query(payload, legacySelect(table, columns)) : []

  const howWeWork = await read(LEGACY.howWeWork.table, ['title', 'desc'])
  const whyChooseUs = await read(LEGACY.whyChooseUs.table, ['title', 'desc'])
  const globalCoverage = await read(LEGACY.globalCoverage.table, ['title', 'sub'])
  const testimonials = await query(payload, legacySelectNoIcon(LEGACY.testimonials.table, ['quote', 'name', 'role']))
  const trustEvidence = await read(LEGACY.trustEvidence.table, ['title', 'items'])
  const valueCalculated = await read(LEGACY.valueCalculated.table, ['title', 'items'])

  const parseArray = (raw: unknown): unknown[] => {
    if (typeof raw !== 'string' || !raw.trim()) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return {
    howWeWork: howWeWork.map((r) => ({ icon: str(r.icon), title: str(r.title), desc: str(r.desc) })),
    whyChooseUs: whyChooseUs.map((r) => ({ icon: str(r.icon), title: str(r.title), desc: str(r.desc) })),
    globalCoverage: globalCoverage.map((r) => ({ icon: str(r.icon), title: str(r.title), sub: str(r.sub) })),
    testimonials: testimonials.map((r) => ({ quote: str(r.quote), name: str(r.name), role: str(r.role) })),
    trustEvidence: trustEvidence.map((r) => ({
      icon: str(r.icon),
      title: str(r.title),
      items: parseArray(r.items).map((item) => ({ text: str(item) })),
    })),
    valueCalculated: valueCalculated.map((r) => ({
      icon: str(r.icon),
      title: str(r.title),
      items: parseArray(r.items).map((item) => {
        const record = (item ?? {}) as Record<string, unknown>
        return { label: str(record.label), value: str(record.value) }
      }),
    })),
  }
}

/** Every translatable string, deduplicated — the translation work list. */
function collectStrings(data: HomeData): string[] {
  const out = new Set<string>()
  const add = (value: string) => {
    if (value.trim()) out.add(value)
  }
  for (const card of data.howWeWork) {
    add(card.title)
    add(card.desc)
  }
  for (const card of data.whyChooseUs) {
    add(card.title)
    add(card.desc)
  }
  for (const card of data.globalCoverage) {
    add(card.title)
    add(card.sub)
  }
  for (const item of data.testimonials) {
    add(item.quote)
    add(item.role)
  }
  for (const card of data.trustEvidence) {
    add(card.title)
    for (const item of card.items) add(item.text)
  }
  for (const card of data.valueCalculated) {
    add(card.title)
    for (const item of card.items) {
      add(item.label)
      add(item.value)
    }
  }
  return [...out]
}

const translate = (map: Map<string, string>, value: string): string => map.get(value) ?? value

/** Reads the content the site is currently serving for `en` (the normal source). */
async function readCurrent(payload: Payload, id: number | string): Promise<HomeData> {
  const doc = (await payload.findByID({
    collection: 'siteSettings',
    id: id as never,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })) as unknown as Record<string, Array<Record<string, unknown>>>

  const rows = (field: string) => doc[field] ?? []
  return {
    howWeWork: rows('homeHowWeWork').map((r) => ({ icon: str(r.icon), title: str(r.title), desc: str(r.desc) })),
    whyChooseUs: rows('homeWhyChooseUs').map((r) => ({ icon: str(r.icon), title: str(r.title), desc: str(r.desc) })),
    globalCoverage: rows('homeGlobalCoverage').map((r) => ({ icon: str(r.icon), title: str(r.title), sub: str(r.sub) })),
    testimonials: rows('homeTestimonials').map((r) => ({ quote: str(r.quote), name: str(r.name), role: str(r.role) })),
    trustEvidence: rows('homeTrustEvidence').map((r) => ({
      icon: str(r.icon),
      title: str(r.title),
      items: ((r.items as Array<Record<string, unknown>>) ?? []).map((item) => ({ text: str(item.text) })),
    })),
    valueCalculated: rows('homeValueCalculated').map((r) => ({
      icon: str(r.icon),
      title: str(r.title),
      items: ((r.items as Array<Record<string, unknown>>) ?? []).map((item) => ({
        label: str(item.label),
        value: str(item.value),
      })),
    })),
  }
}

const countContent = (data: HomeData): number => collectStrings(data).length

async function main() {
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  const { docs } = await payload.find({ collection: 'siteSettings', locale: 'en', depth: 0, limit: 1, overrideAccess: true })
  const id = (docs[0] as { id: number | string } | undefined)?.id
  if (!id) throw new Error('siteSettings document not found')

  // Source of truth: what the site already serves in English. The legacy columns
  // are only consulted for the very first run, because Payload recreates array
  // rows (with new ids) on the localized write — reading them afterwards yields
  // empty strings. Falling back keeps this script re-runnable, which matters
  // because translations arrive in batches.
  const current = await readCurrent(payload, id)
  const legacy = await readLegacy(payload)
  const useLegacy = countContent(current) === 0 && countContent(legacy) > 0
  const data = useLegacy ? legacy : current
  const strings = collectStrings(data)
  console.log(`source: ${useLegacy ? 'legacy columns (first migration)' : 'current en content'} · ${strings.length} translatable strings`)

  if (exportTodo) {
    fs.mkdirSync(TODO_DIR, { recursive: true })
    const source: Record<string, string> = {}
    for (const s of strings) source[s] = s
    for (const lang of LOCALES) {
      fs.writeFileSync(path.join(TODO_DIR, `${lang}-home.json`), JSON.stringify(source, null, 2) + '\n')
    }
    console.log(`wrote ${LOCALES.length} work lists with ${strings.length} strings each → ${TODO_DIR}`)
    console.log('translators produce scripts/translations/<lang>-home.json (same keys, translated values)')
    process.exit(0)
  }

  const coverage = LOCALES.map((lang) => {
    const file = path.join(TR_DIR, `${lang}-home.json`)
    if (!fs.existsSync(file)) return { lang, translated: 0, total: strings.length, missing: strings.length }
    const map = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>
    const missing = strings.filter((s) => !map[s] || !String(map[s]).trim()).length
    return { lang, translated: strings.length - missing, total: strings.length, missing }
  })

  console.log(`home strings: ${strings.length}`)
  for (const c of coverage) console.log(`  ${c.lang}: ${c.translated}/${c.total} translated${c.missing ? ` (${c.missing} missing → English fallback)` : ''}`)

  if (checkOnly) {
    // The check is about the database state, not the translation files: every
    // localized row must exist and carry text.
    const problems: string[] = []
    for (const locale of ['en', ...LOCALES]) {
      const doc = (await payload.findByID({
        collection: 'siteSettings',
        id: id as never,
        locale: locale as never,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
      const sections: Array<[string, number]> = [
        ['homeHowWeWork', data.howWeWork.length],
        ['homeWhyChooseUs', data.whyChooseUs.length],
        ['homeGlobalCoverage', data.globalCoverage.length],
        ['homeTestimonials', data.testimonials.length],
        ['homeTrustEvidence', data.trustEvidence.length],
        ['homeValueCalculated', data.valueCalculated.length],
      ]
      for (const [field, expected] of sections) {
        const rows = (doc[field] as Array<Record<string, unknown>>) ?? []
        if (rows.length !== expected) {
          problems.push(`${locale}.${field}: ${rows.length} rows, expected ${expected}`)
          continue
        }
        const empty = rows.filter((row) =>
          Object.entries(row).some(([k, v]) => typeof v === 'string' && !v.trim() && k !== 'icon'),
        ).length
        if (empty) problems.push(`${locale}.${field}: ${empty} row(s) with empty text`)
      }
    }
    if (problems.length) {
      console.error('\n--check: homepage localization is incomplete')
      for (const p of problems) console.error(`  ✗ ${p}`)
      process.exit(1)
    }
    console.log('\n✓ every locale has complete homepage content')
    process.exit(0)
  }

  if (!apply) {
    console.log('\ndry run — re-run with --apply to write (or --export-todo to refresh the work lists)')
    process.exit(0)
  }

  // ── 1. English: only on the first migration ───────────────────────────────
  // When the source was already the live English content there is nothing to
  // back-fill; rewriting it would recreate the array rows (new ids) and orphan
  // the localized text that is already attached to them.
  if (useLegacy) {
    await payload.update({
      collection: 'siteSettings',
      id: id as never,
      locale: 'en',
      depth: 0,
      overrideAccess: true,
      data: {
        homeHowWeWork: data.howWeWork,
        homeWhyChooseUs: data.whyChooseUs,
        homeGlobalCoverage: data.globalCoverage,
        homeTestimonials: data.testimonials,
        homeTrustEvidence: data.trustEvidence,
        homeValueCalculated: data.valueCalculated,
      } as never,
    })
    console.log('en written from the legacy columns')
  } else {
    console.log('en left untouched (already the localized source of truth)')
  }

  // Row ids are generated by Payload; re-read them so every other locale updates
  // the same rows instead of creating duplicates.
  const en = (await payload.findByID({
    collection: 'siteSettings',
    id: id as never,
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })) as unknown as Record<string, Array<Record<string, unknown>>>

  // ── 2. Every other locale: same rows/ids, translated text ─────────────────
  for (const lang of LOCALES) {
    const file = path.join(TR_DIR, `${lang}-home.json`)
    const map = new Map(
      fs.existsSync(file) ? Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>) : [],
    )
    const t = (value: string) => translate(map, value)

    await payload.update({
      collection: 'siteSettings',
      id: id as never,
      locale: lang as never,
      depth: 0,
      overrideAccess: true,
      data: {
        homeHowWeWork: (en.homeHowWeWork ?? []).map((row) => ({
          id: row.id,
          icon: row.icon,
          title: t(str(row.title)),
          desc: t(str(row.desc)),
        })),
        homeWhyChooseUs: (en.homeWhyChooseUs ?? []).map((row) => ({
          id: row.id,
          icon: row.icon,
          title: t(str(row.title)),
          desc: t(str(row.desc)),
        })),
        homeGlobalCoverage: (en.homeGlobalCoverage ?? []).map((row) => ({
          id: row.id,
          icon: row.icon,
          title: t(str(row.title)),
          sub: t(str(row.sub)),
        })),
        homeTestimonials: (en.homeTestimonials ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          quote: t(str(row.quote)),
          role: t(str(row.role)),
        })),
        homeTrustEvidence: (en.homeTrustEvidence ?? []).map((row) => ({
          id: row.id,
          icon: row.icon,
          title: t(str(row.title)),
          items: ((row.items as Array<Record<string, unknown>>) ?? []).map((item) => ({
            id: item.id,
            text: t(str(item.text)),
          })),
        })),
        homeValueCalculated: (en.homeValueCalculated ?? []).map((row) => ({
          id: row.id,
          icon: row.icon,
          title: t(str(row.title)),
          items: ((row.items as Array<Record<string, unknown>>) ?? []).map((item) => ({
            id: item.id,
            label: t(str(item.label)),
            value: t(str(item.value)),
          })),
        })),
      } as never,
    })

    // Assert: read back and confirm the first card of each section is localized.
    const after = (await payload.findByID({
      collection: 'siteSettings',
      id: id as never,
      locale: lang as never,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, Array<Record<string, unknown>>>
    const sample = str((after.homeHowWeWork ?? [])[0]?.title)
    const ok = (after.homeHowWeWork ?? []).length === data.howWeWork.length && sample.trim() !== ''
    console.log(`  ${lang}: ${ok ? '✓' : '✗'} howWeWork[0]="${sample.slice(0, 44)}"`)
    if (!ok) process.exitCode = 1
  }

  console.log('\nhomepage content migrated. Restart the dev server (or clear .next/cache) to see it.')
  process.exit(process.exitCode === 1 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
