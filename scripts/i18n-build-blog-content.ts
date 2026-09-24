/**
 * Rebuild translated blog post bodies from flat translated text arrays.
 *
 * WHY THIS SHAPE
 * --------------
 * A Lexical document is deeply nested, and asking a translator to reproduce the
 * whole tree invites silent structural damage — a dropped `list` node renders as
 * a missing bullet list, and a dropped `root` child loses a whole section, with
 * no error anywhere. So the translation pass only ever touches a **flat array of
 * the prose strings**, and this script splices those strings back into a copy of
 * the English document.
 *
 * That makes the structure correct by construction: the output tree is the
 * English tree with `text` values substituted positionally. The only thing that
 * can go wrong is a length mismatch, which is checked before anything is written.
 *
 * Inputs
 *   scripts/translations/_todo/blog-content/<slug>.json         English Lexical (source of structure)
 *   scripts/translations/_todo/blog-content/<slug>.texts.json   English flat text array (reference)
 *   scripts/translations/<lang>-blog-texts.json                 { "<slug>": [ …translated… ] }
 *
 * Output
 *   scripts/translations/<lang>-blog-content.json               { "<slug>": { root: …Lexical… } }
 *     — consumed by scripts/i18n-blog-content.ts
 *
 *   pnpm tsx scripts/i18n-build-blog-content.ts            # dry run
 *   pnpm tsx scripts/i18n-build-blog-content.ts --apply
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_DIR = path.join(ROOT, 'scripts/translations/_todo/blog-content')
const TR = path.join(ROOT, 'scripts/translations')

const SLUGS = ['feed-mill-guide', 'incubation-guide']
const LANGS = ['ru', 'fr', 'es', 'sw', 'ar']
const apply = process.argv.slice(2).includes('--apply')

interface LexicalNode {
  type?: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

/** Replace `text` values positionally, in document order. */
function splice(node: LexicalNode, values: string[], cursor: { i: number }): void {
  if (node.type === 'text') {
    node.text = values[cursor.i]
    cursor.i += 1
    return
  }
  for (const child of node.children ?? []) splice(child, values, cursor)
}

function main() {
  const sources = new Map<string, { doc: LexicalNode; texts: string[] }>()
  for (const slug of SLUGS) {
    const doc = JSON.parse(fs.readFileSync(path.join(SRC_DIR, `${slug}.json`), 'utf8')) as LexicalNode
    const texts = JSON.parse(
      fs.readFileSync(path.join(SRC_DIR, `${slug}.texts.json`), 'utf8'),
    ) as string[]
    sources.set(slug, { doc, texts })
    console.log(`${slug}: ${texts.length} text node(s)`)
  }

  const problems: string[] = []

  for (const lang of LANGS) {
    const file = path.join(TR, `${lang}-blog-texts.json`)
    if (!fs.existsSync(file)) {
      problems.push(`${lang}: missing ${path.relative(ROOT, file)}`)
      continue
    }
    const table = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string[]>
    const out: Record<string, LexicalNode> = {}

    for (const slug of SLUGS) {
      const source = sources.get(slug)
      if (!source) continue
      const values = table[slug]
      if (!Array.isArray(values)) {
        problems.push(`${lang}/${slug}: no array in the input`)
        continue
      }
      if (values.length !== source.texts.length) {
        problems.push(
          `${lang}/${slug}: ${values.length} translation(s) for ${source.texts.length} text node(s)`,
        )
        continue
      }
      const empty = values.findIndex((v) => !String(v ?? '').trim())
      if (empty !== -1) {
        problems.push(`${lang}/${slug}: empty translation at index ${empty}`)
        continue
      }
      // Anything byte-identical to English (beyond a short heading) was missed.
      const untranslated = source.texts
        .map((t, i) => (t === values[i] && t.trim().length > 24 ? i : -1))
        .filter((i) => i !== -1)
      if (untranslated.length) {
        problems.push(`${lang}/${slug}: text node(s) ${untranslated.join(', ')} left in English`)
        continue
      }

      // Deep-copy the English document, then substitute the prose.
      const doc = JSON.parse(JSON.stringify(source.doc)) as LexicalNode
      splice(doc.root, values.map((v) => String(v)), { i: 0 })
      out[slug] = doc
    }

    if (Object.keys(out).length === SLUGS.length) {
      const target = path.join(TR, `${lang}-blog-content.json`)
      if (apply) {
        fs.writeFileSync(target, JSON.stringify(out, null, 2) + '\n')
        console.log(`${lang}: wrote ${path.basename(target)} (${SLUGS.length} document(s))`)
      } else {
        console.log(`${lang}: would write ${path.basename(target)}`)
      }
    }
  }

  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`)
    for (const p of problems) console.error('  ✗ ' + p)
    process.exit(1)
  }
  console.log('\nNo problems.')
}

main()
