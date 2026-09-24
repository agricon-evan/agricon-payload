/**
 * Apply translated blog post bodies (Lexical rich text) to the CMS.
 *
 * WHY
 * ---
 * `blogPosts.content` is `localized: true`. Three posts are published, but only
 * `layer-cage-guide` had a body in all six locales:
 *
 *   feed-mill-guide     en only            → 5 locales fell back to English
 *   incubation-guide    en, fr, ru         → 3 locales fell back to English
 *
 * A blog post is the one content type where a reader scrolls a long way, so an
 * English body under a localized title is the most visible translation gap on
 * the site — and the article pages are in the sitemap for every locale.
 *
 * Input files (one per locale, produced by the translation pass):
 *   scripts/translations/<lang>-blog-content.json
 *     { "<slug>": { "root": { …Lexical… } } }
 *
 * The translated document must keep the source structure exactly and change only
 * the `text` nodes; that is asserted here before writing, because a mangled
 * Lexical tree renders as a blank or broken article rather than an error.
 *
 * Safety: every write is re-read and asserted.
 *
 *   pnpm tsx scripts/i18n-blog-content.ts            # dry run
 *   pnpm tsx scripts/i18n-blog-content.ts --apply
 *   pnpm tsx scripts/i18n-blog-content.ts --apply --lang=ru
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const TR = path.join(ROOT, 'scripts/translations')

const ALL_LANGS = ['ru', 'fr', 'es', 'sw', 'ar']
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const langArg = args.find((a) => a.startsWith('--lang='))?.split('=')[1]
const LANGS = langArg ? [langArg] : ALL_LANGS

interface LexicalNode {
  type?: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

/** Ordered list of node types, for structural comparison. */
function typeSequence(node: LexicalNode, out: string[] = []): string[] {
  out.push(node.type ?? '?')
  for (const child of node.children ?? []) typeSequence(child, out)
  return out
}

/** Ordered list of text values, for completeness comparison. */
function textValues(node: LexicalNode, out: string[] = []): string[] {
  if (node.type === 'text') out.push(node.text ?? '')
  for (const child of node.children ?? []) textValues(child, out)
  return out
}

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  // English sources, used as the structural reference.
  const sources = new Map<string, LexicalNode>()
  for (const slug of ['feed-mill-guide', 'incubation-guide', 'layer-cage-guide']) {
    const { docs } = await payload.find({
      collection: 'blogPosts',
      locale: 'en',
      depth: 0,
      limit: 1,
      pagination: false,
      where: { slug: { equals: slug } },
      select: { slug: true, content: true },
    })
    const doc = docs[0] as unknown as { content?: LexicalNode } | undefined
    if (doc?.content) sources.set(slug, doc.content)
  }
  console.log(`${sources.size} English source document(s) loaded\n`)

  const failures: string[] = []
  let total = 0

  for (const lang of LANGS) {
    const file = path.join(TR, `${lang}-blog-content.json`)
    if (!fs.existsSync(file)) {
      failures.push(`${lang}: missing ${path.relative(ROOT, file)}`)
      console.error(`✗ ${lang}: input file not found — ${path.relative(ROOT, file)}`)
      continue
    }
    const table = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, LexicalNode>
    console.log(`${lang}: ${Object.keys(table).length} post(s) in ${path.basename(file)}`)

    let updated = 0
    for (const [slug, content] of Object.entries(table)) {
      const source = sources.get(slug)
      if (!source) {
        failures.push(`${lang}/${slug}: no English source document to compare against`)
        console.error(`  ✗ ${lang}/${slug}: no English source document`)
        continue
      }

      // Structural gate: the translated tree must mirror the source exactly.
      const srcTypes = typeSequence(source.root).join('>')
      const outTypes = typeSequence(content.root).join('>')
      if (srcTypes !== outTypes) {
        failures.push(`${lang}/${slug}: node structure differs from the English source`)
        console.error(`  ✗ ${lang}/${slug}: node structure differs from source`)
        continue
      }
      const srcTexts = textValues(source.root)
      const outTexts = textValues(content.root)
      if (srcTexts.length !== outTexts.length) {
        failures.push(`${lang}/${slug}: ${outTexts.length} text node(s), expected ${srcTexts.length}`)
        console.error(`  ✗ ${lang}/${slug}: text node count ${outTexts.length} ≠ ${srcTexts.length}`)
        continue
      }
      // A text node that is still byte-identical to English means it was missed.
      const untranslated = srcTexts.filter((t, i) => t === outTexts[i] && t.trim().length > 24)
      if (untranslated.length > 0) {
        failures.push(`${lang}/${slug}: ${untranslated.length} text node(s) left in English`)
        console.error(`  ✗ ${lang}/${slug}: ${untranslated.length} text node(s) still English`)
        continue
      }

      const { docs } = await payload.find({
        collection: 'blogPosts',
        depth: 0,
        limit: 1,
        pagination: false,
        where: { slug: { equals: slug } },
        select: { slug: true },
      })
      const target = docs[0] as unknown as { id: number } | undefined
      if (!target) {
        failures.push(`${lang}/${slug}: no blog post with this slug in the CMS`)
        console.error(`  ✗ ${lang}/${slug}: post not found in the CMS`)
        continue
      }

      if (!apply) {
        updated += 1
        continue
      }

      try {
        await payload.update({
          collection: 'blogPosts',
          id: target.id,
          locale: lang,
          data: { content } as never,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
        failures.push(`${lang}/${slug}: ${msg}`)
        console.error(`  ✗ ${lang}/${slug}: ${msg}`)
        continue
      }

      // No-fallback re-read: with a fallback the English body would be returned
      // and a rejected write would look like a success.
      const check = await payload.findByID({
        collection: 'blogPosts',
        id: target.id,
        locale: lang,
        fallbackLocale: false,
        depth: 0,
        select: { content: true },
      })
      const written = (check as unknown as { content?: LexicalNode }).content
      if (!written || textValues(written.root).length !== outTexts.length) {
        failures.push(`${lang}/${slug}: verify mismatch`)
        console.error(`  ✗ ${lang}/${slug}: verify mismatch`)
        continue
      }
      updated += 1
    }

    console.log(`  ${apply ? 'updated' : 'to update'}: ${updated}`)
    total += updated
  }

  console.log(`\n${apply ? 'Applied' : 'Would apply'} ${total} blog content write(s)`)
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`)
    for (const f of failures.slice(0, 20)) console.error('  ' + f)
    process.exit(1)
  }
  console.log('No failures.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
