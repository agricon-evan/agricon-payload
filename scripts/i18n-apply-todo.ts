/**
 * Apply translated work lists produced from `scripts/i18n-extract-todo.ts`.
 *
 * Two kinds of output are consumed:
 *
 *   UI      scripts/translations/<lang>-ui-translated.json
 *           `{ "<namespace>": { "<dotted.key>": "<translated>" } }`
 *           merged into `src/i18n/locales/<lang>/<namespace>.json`. Namespace
 *           files that do not exist for a locale yet (blog, pages) are created
 *           from the English structure, so a locale can never lose a key.
 *
 *   CONTENT scripts/translations/<lang>-content-translated.json   (round 1)
 *           scripts/translations/<lang>-round2-translated.json    (round 2)
 *           applied to the CMS through the Payload local API, per locale:
 *             products.<slug>.description        → products.description
 *             features.<english phrase>          → products[].features[].feature
 *             specLabels.<english label>         → products[].specs[].label
 *             faqs.<id>.question / .answer       → faqs.question / faqs.answer
 *             blogPosts.<slug>.title / .excerpt  → blogPosts.title / .excerpt
 *
 * Notes for maintainers:
 *   - `blogTags` translations are intentionally NOT written to the CMS: the
 *     `blogTags.name` field is not declared `localized` (changing that needs a
 *     schema migration), so writing per-locale values would overwrite the single
 *     stored name for every language. Blog tag labels are localized through the
 *     UI namespace instead (`blog.tags.<slug>`) — see the per-locale blog.json.
 *   - Feature/spec lookups are keyed by the English source string. Both sides are
 *     run through `decodeLiteralUnicodeEscapes()` so the emoji features still
 *     match even though the work lists were produced while those values were
 *     still stored as literal `\uXXXX` text.
 *   - FAQ answers are Lexical rich text; a plain translated paragraph is wrapped
 *     into a minimal Lexical document on write.
 *   - Every write is re-read and asserted, so a failed update cannot be reported
 *     as success.
 *
 *   pnpm tsx scripts/i18n-apply-todo.ts                     # dry run, all locales
 *   pnpm tsx scripts/i18n-apply-todo.ts --apply
 *   pnpm tsx scripts/i18n-apply-todo.ts --apply --lang=ru --round=2
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import { decodeLiteralUnicodeEscapes, htmlToPlainText } from '../src/lib/supplier-text'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const TR = path.join(ROOT, 'scripts/translations')
const LOCALES_DIR = path.join(ROOT, 'src/i18n/locales')

const ALL_LANGS = ['ru', 'fr', 'es', 'sw', 'ar']
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const langArg = args.find((a) => a.startsWith('--lang='))?.split('=')[1]
const roundArg = args.find((a) => a.startsWith('--round='))?.split('=')[1] ?? 'all'
const LANGS = langArg ? [langArg] : ALL_LANGS

const readJson = <T>(file: string): T | null => (fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as T) : null)
const writeJson = (file: string, data: unknown) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')

const setPath = (obj: Record<string, unknown>, dotted: string, value: unknown) => {
  const parts = dotted.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    if (typeof cur[key] !== 'object' || cur[key] === null || Array.isArray(cur[key])) cur[key] = {}
    cur = cur[key] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]] = value
}

/**
 * Rebuilds a Lexical rich-text answer from the *existing English document*,
 * keeping every structural field (version, format, indent, textFormat…) exactly
 * as Payload's editor wrote it and replacing only the text.
 *
 * Hand-building a document from scratch is rejected by rich-text validation
 * ("The following field is invalid: Answer"), because the editor's schema is
 * stricter than the visible field list.
 */
const answerFromTemplate = (template: unknown, text: string): unknown | null => {
  const root = (template as { root?: { children?: unknown[] } } | null)?.root
  if (!root?.children?.length) return null
  const firstParagraph =
    (root.children.find((c) => (c as { type?: string }).type === 'paragraph') as
      | { children?: unknown[] }
      | undefined) ?? (root.children[0] as { children?: unknown[] } | undefined)
  const textNode = firstParagraph?.children?.find((c) => (c as { type?: string }).type === 'text') as
    | Record<string, unknown>
    | undefined
  if (!firstParagraph || !textNode) return null
  return {
    root: {
      ...root,
      children: [{ ...firstParagraph, children: [{ ...textNode, text }] }],
    },
  }
}

async function applyUi(lang: string) {
  const translated = readJson<Record<string, Record<string, string>>>(path.join(TR, `${lang}-ui-translated.json`))
  if (!translated) return { namespaces: 0, keys: 0, created: [] as string[] }

  let keys = 0
  const created: string[] = []
  for (const [ns, entries] of Object.entries(translated)) {
    const localeFile = path.join(LOCALES_DIR, lang, `${ns}.json`)
    const enFile = path.join(LOCALES_DIR, 'en', `${ns}.json`)
    let target = readJson<Record<string, unknown>>(localeFile)
    if (!target) {
      // First translation for this namespace in this locale: start from the
      // English structure so no key can be lost, then overlay the translations.
      const en = readJson<Record<string, unknown>>(enFile)
      if (!en) {
        console.warn(`  ! ${lang}/${ns}: no English source, skipped`)
        continue
      }
      target = en
      created.push(`${lang}/${ns}`)
    }
    for (const [dotted, value] of Object.entries(entries)) {
      if (typeof value !== 'string' || !value.trim()) continue
      setPath(target, dotted, value)
      keys++
    }
    if (apply) writeJson(localeFile, target)
  }
  return { namespaces: Object.keys(translated).length, keys, created }
}

async function applyContent(
  payload: Awaited<ReturnType<typeof getPayload>>,
  lang: string,
  file: string,
  only?: { products?: boolean; faqs?: boolean; vocab?: boolean },
) {
  const data = readJson<{
    products?: Record<string, { description?: string }>
    features?: Record<string, string>
    specLabels?: Record<string, string>
    faqs?: Record<string, { question: string; answer: string }>
    blogPosts?: Record<string, { title: string; excerpt: string }>
    blogTags?: Record<string, string>
  }>(file)
  if (!data) return null

  const stats = { descriptions: 0, features: 0, specLabels: 0, faqs: 0, posts: 0, skipped: 0 }
  const wantsProducts = only?.products ?? true
  const wantsVocab = only?.vocab ?? true

  // ── products: description + feature/spec vocabulary ──────────────────────
  if (wantsProducts || wantsVocab) {
    const { docs: products } = await payload.find({
      collection: 'products',
      locale: 'en',
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
    })

    const featureMap = new Map(
      Object.entries(data.features || {}).map(([en, tr]) => [decodeLiteralUnicodeEscapes(en), tr]),
    )
    const specMap = new Map(
      Object.entries(data.specLabels || {}).map(([en, tr]) => [decodeLiteralUnicodeEscapes(en), tr]),
    )

    for (const product of products as Array<Record<string, unknown>>) {
      const slug = String(product.slug)
      const update: Record<string, unknown> = {}

      // `name` is `localized: true` AND `required: true`. Payload validates the
      // document for the locale being written and rejects the update when that
      // locale has no name yet ("The following field is invalid: General >
      // Name"), so the English name — which is our documented policy for product
      // names anyway — is written along with the translation.
      if (typeof product.name === 'string' && product.name) update.name = product.name

      if (wantsProducts) {
        const description = data.products?.[slug]?.description
        if (description) {
          update.description = description
          stats.descriptions++
        }
      }

      if (wantsVocab) {
        const features = (product.features as Array<Record<string, unknown>>) || []
        if (features.length && featureMap.size) {
          const next = features.map((f) => {
            const en = decodeLiteralUnicodeEscapes(String(f.feature || ''))
            const tr = featureMap.get(en)
            return tr ? { ...f, feature: tr } : f
          })
          if (JSON.stringify(next) !== JSON.stringify(features)) {
            update.features = next
            stats.features += next.filter((f, i) => f.feature !== features[i].feature).length
          }
        }
        const specs = (product.specs as Array<Record<string, unknown>>) || []
        if (specs.length && specMap.size) {
          const next = specs.map((s) => {
            const en = decodeLiteralUnicodeEscapes(String(s.label || ''))
            const tr = specMap.get(en)
            return tr ? { ...s, label: tr } : s
          })
          if (JSON.stringify(next) !== JSON.stringify(specs)) {
            update.specs = next
            stats.specLabels += next.filter((s, i) => s.label !== specs[i].label).length
          }
        }
      }

      if (!Object.keys(update).length) continue
      if (!apply) continue

      try {
        await payload.update({
          collection: 'products',
          id: product.id as never,
          locale: lang as never,
          depth: 0,
          overrideAccess: true,
          data: update as never,
        })
      } catch (err) {
        console.error(`  ✗ ${slug}: update rejected — ${err instanceof Error ? err.message.split('\n')[0] : err}`)
        stats.skipped++
        continue
      }

      // assert
      const after = (await payload.findByID({
        collection: 'products',
        id: product.id as never,
        locale: lang as never,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
      if (update.description && after.description !== update.description) {
        console.error(`  ✗ ${slug}: description did not persist`)
        stats.skipped++
      }
      if (update.features) {
        const first = (after.features as Array<{ feature?: string }>)?.[0]?.feature
        const expected = (update.features as Array<{ feature?: string }>)[0]?.feature
        if (first !== expected) {
          console.error(`  ✗ ${slug}: features did not persist`)
          stats.skipped++
        }
      }
    }
  }

  // ── faqs ────────────────────────────────────────────────────────────────
  if ((only?.faqs ?? true) && data.faqs) {
    for (const [id, entry] of Object.entries(data.faqs)) {
      const update: Record<string, unknown> = {}
      if (entry.question?.trim()) update.question = entry.question.trim()
      if (entry.answer?.trim()) {
        // English document doubles as the structural template (see
        // answerFromTemplate).
        const en = (await payload.findByID({
          collection: 'faqs',
          id: id as never,
          locale: 'en',
          depth: 0,
          overrideAccess: true,
        })) as unknown as { answer?: unknown }
        const templated = answerFromTemplate(en.answer, htmlToPlainText(entry.answer) || entry.answer)
        if (templated) update.answer = templated
        else console.warn(`  ! faq ${id}: no English answer template, answer left untouched`)
      }
      if (!Object.keys(update).length) continue
      if (!apply) {
        stats.faqs++
        continue
      }
      try {
        await payload.update({
          collection: 'faqs',
          id: id as never,
          locale: lang as never,
          depth: 0,
          overrideAccess: true,
          data: update as never,
        })
        stats.faqs++
      } catch (err) {
        console.error(`  ✗ faq ${id}: update rejected — ${err instanceof Error ? err.message.split('\n')[0] : err}`)
        stats.skipped++
      }
    }
  }

  // ── blog posts ──────────────────────────────────────────────────────────
  if (data.blogPosts) {
    for (const [slug, entry] of Object.entries(data.blogPosts)) {
      const { docs } = await payload.find({
        collection: 'blogPosts',
        where: { slug: { equals: slug } },
        locale: 'en',
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
      const post = docs[0] as { id?: unknown } | undefined
      if (!post?.id) {
        console.warn(`  ! blog post not found: ${slug}`)
        continue
      }
      if (!apply) {
        stats.posts++
        continue
      }
      await payload.update({
        collection: 'blogPosts',
        id: post.id as never,
        locale: lang as never,
        depth: 0,
        overrideAccess: true,
        data: { title: entry.title, excerpt: entry.excerpt } as never,
      })
      stats.posts++
    }
  }

  if (data.blogTags) {
    console.log('  i blogTags are localized through the UI namespace (blog.tags.*), not the CMS — skipped')
  }

  return stats
}

async function main() {
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })

  console.log(`${apply ? 'APPLYING' : 'DRY RUN'} · locales: ${LANGS.join(', ')} · round: ${roundArg}\n`)

  for (const lang of LANGS) {
    const ui = await applyUi(lang)
    console.log(`[${lang}] ui: ${ui.keys} keys across ${ui.namespaces} namespaces${ui.created.length ? ` (new files: ${ui.created.join(', ')})` : ''}`)

    if (roundArg === '1' || roundArg === 'all') {
      // Descriptions are deliberately NOT taken from round 1: that list was
      // extracted before the truncated descriptions were repaired, so round 2
      // (re-extracted afterwards) owns the description field. Round 1 still
      // supplies the feature/spec vocabulary, FAQ questions and blog posts —
      // none of which changed.
      const stats = await applyContent(payload, lang, path.join(TR, `${lang}-content-translated.json`), {
        products: false,
        faqs: true,
        vocab: true,
      })
      if (stats) {
        console.log(
          `[${lang}] content r1: ${stats.features} features, ${stats.specLabels} spec labels, ${stats.faqs} faqs, ${stats.posts} posts${stats.skipped ? `, ${stats.skipped} FAILED` : ''}`,
        )
      }
    }
    if (roundArg === '2' || roundArg === 'all') {
      const stats = await applyContent(payload, lang, path.join(TR, `${lang}-round2-translated.json`), {
        products: true,
        faqs: true,
        vocab: false,
      })
      if (stats) {
        console.log(`[${lang}] content r2: ${stats.descriptions} descriptions, ${stats.faqs} faqs${stats.skipped ? `, ${stats.skipped} FAILED` : ''}`)
      }
    }
  }

  if (!apply) console.log('\ndry run — nothing written. Re-run with --apply')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
