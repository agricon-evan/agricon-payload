/**
 * Generate the per-locale translation work lists.
 *
 * The site ships six languages, but large parts of the copy are still English:
 * some UI namespaces were never translated, and CMS records (products, FAQs,
 * blog posts) only exist in English. This script compares the current database
 * and the locale JSON files against English and writes exactly the strings that
 * are missing or byte-identical to English.
 *
 *   pnpm tsx scripts/i18n-extract-todo.ts
 *
 * Output (checked in, so a translator can work without a database):
 *   scripts/translations/_todo/<lang>-ui.json       UI namespaces, dotted keys
 *   scripts/translations/_todo/<lang>-content.json  CMS records
 *
 * Apply the translated results with `scripts/i18n-apply-todo.ts`.
 *
 * Strings that are legitimately identical across languages are skipped by
 * `SKIP_IDENTICAL` so a translator is never asked to "translate" a brand name.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import { richTextToPlainText } from '../src/lib/structured-data'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const LOCALES_DIR = path.join(ROOT, 'src/i18n/locales')
const OUT_DIR = path.join(ROOT, 'scripts/translations/_todo')
const LANGS = ['ru', 'fr', 'es', 'sw', 'ar'] as const

/** UI namespaces that exist for every locale (the registry in src/i18n/config.ts). */
const NAMESPACES = [
  'common', 'nav', 'cta', 'footer', 'aria', 'privacy', 'terms', 'search',
  'videos', 'productDetail', 'blog', 'pages', 'contact', 'distributors', 'faq', 'trade-support',
]

/** Never worth translating: brand, acronyms, bare numbers/units. */
const SKIP_IDENTICAL = /^(AGRICON|Agricon|Blog|FAQ|PDF|ISO|CE|OEM|ODM|MOQ|USD|US\$|Email|E-mail|WhatsApp|LinkedIn|Facebook|YouTube|Instagram|TikTok|[0-9\s+()\-./%:,]*)$/

const readJson = (file: string): Record<string, unknown> => JSON.parse(fs.readFileSync(file, 'utf8'))

const flatten = (obj: Record<string, unknown>, prefix = ''): Array<[string, unknown]> =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
      : [[`${prefix}${k}`, v] as [string, unknown]],
  )

function uiTodo(lang: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  const enDir = path.join(LOCALES_DIR, 'en')
  for (const ns of NAMESPACES) {
    const enFile = path.join(enDir, `${ns}.json`)
    if (!fs.existsSync(enFile)) continue
    const en = readJson(enFile)
    const localeFile = path.join(LOCALES_DIR, lang, `${ns}.json`)
    const locale = fs.existsSync(localeFile) ? readJson(localeFile) : {}
    const localeMap = new Map(flatten(locale))

    const missing: Record<string, string> = {}
    for (const [key, value] of flatten(en)) {
      if (typeof value !== 'string' || !value.trim()) continue
      // `SKIP_IDENTICAL` filters strings that are the same in every language
      // (brand, acronyms, bare numbers) so a translator is never asked to
      // "translate" `Agricon`. Homepage heading fragments are exempt: a value
      // like `Blog` is a *part* of a sentence there (`From Our` + `Blog`), and
      // skipping it left `home.news.titleAccent` missing from the work list, so
      // Russian and Arabic rendered a mixed-script heading.
      const structural = ns === 'common' && key.startsWith('home.')
      if (!structural && SKIP_IDENTICAL.test(value.trim())) continue
      const current = localeMap.get(key)
      if (current === value) missing[key] = value
      else if (current === undefined) missing[key] = value
    }
    if (Object.keys(missing).length) out[ns] = missing
  }
  return out
}

async function contentTodo(payload: Awaited<ReturnType<typeof getPayload>>, lang: string) {
  const find = async (collection: string, extra: Record<string, unknown> = {}) => {
    const { docs } = await payload.find({
      collection: collection as never,
      locale: lang as never,
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
      ...extra,
    })
    return docs as Array<Record<string, unknown>>
  }

  const enProducts = await find('products')
  const products: Record<string, { description: string }> = {}
  const features: Record<string, string> = {}
  const specLabels: Record<string, string> = {}

  for (const p of enProducts) {
    const localized = await payload.findByID({
      collection: 'products' as never,
      id: p.id as never,
      locale: lang as never,
      depth: 0,
      overrideAccess: true,
    })
    const lp = localized as unknown as Record<string, unknown>
    const slug = String(p.slug)
    // Product NAMES stay English on purpose (technical designations such as
    // "H-Type Layer Cage" are what overseas buyers search for). Only descriptive
    // copy is translated.
    if (typeof p.description === 'string' && p.description.trim() && lp.description === p.description) {
      products[slug] = { description: p.description }
    }
    for (const f of (p.features as Array<{ feature?: string }>) || []) {
      const text = f?.feature?.trim()
      if (text) features[text] = text
    }
    for (const s of (p.specs as Array<{ label?: string }>) || []) {
      const text = s?.label?.trim()
      if (text && !/^[0-9\s.,%/-]+$/.test(text)) specLabels[text] = text
    }
  }

  const faqs: Record<string, { question: string; answer: string }> = {}
  const enFaqs = await payload.find({
    collection: 'faqs' as never,
    locale: 'en',
    depth: 0,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })
  for (const f of await find('faqs')) {
    const question = typeof f.question === 'string' ? f.question : ''
    // `answer` is a Lexical rich-text field, so compare its text content rather
    // than the object (two structurally different docs can hold the same prose).
    const answer = richTextToPlainText(f.answer)
    const en = enFaqs.docs.find((d) => (d as { id: unknown }).id === f.id) as
      | { question?: string; answer?: unknown }
      | undefined
    if (!question) continue
    const identicalQuestion = en?.question === question
    const identicalAnswer = richTextToPlainText(en?.answer) === answer
    if (identicalQuestion || identicalAnswer || !en) {
      faqs[String(f.id)] = { question, answer }
    }
  }

  const blogPosts: Record<string, { title: string; excerpt: string }> = {}
  for (const post of await find('blogPosts')) {
    const title = typeof post.title === 'string' ? post.title : ''
    const excerpt = typeof post.excerpt === 'string' ? post.excerpt : ''
    if (title) blogPosts[String(post.slug)] = { title, excerpt }
  }

  const blogTags: Record<string, string> = {}
  for (const t of await find('blogTags')) {
    if (typeof t.name === 'string') blogTags[String(t.slug)] = t.name
  }

  return { products, features, specLabels, faqs, blogPosts, blogTags }
}

async function main() {
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config })
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // `--round2` writes a much smaller list limited to content that changed after
  // the first translation pass (product descriptions were repaired, and the FAQ
  // answers only became extractable once rich text was converted to plain text).
  const round2 = process.argv.includes('--round2')

  for (const lang of LANGS) {
    const content = await contentTodo(payload, lang)
    if (round2) {
      const subset = {
        products: content.products,
        faqs: content.faqs,
      }
      fs.writeFileSync(path.join(OUT_DIR, `${lang}-round2.json`), JSON.stringify(subset, null, 2) + '\n')
      console.log(
        `${lang}: round2 → products ${Object.keys(subset.products).length}, faqs ${Object.keys(subset.faqs).length}`,
      )
      continue
    }

    const ui = uiTodo(lang)
    const uiKeys = Object.values(ui).reduce((n, ns) => n + Object.keys(ns).length, 0)
    const contentKeys =
      Object.keys(content.products).length +
      Object.keys(content.features).length +
      Object.keys(content.specLabels).length +
      Object.keys(content.faqs).length +
      Object.keys(content.blogPosts).length +
      Object.keys(content.blogTags).length

    fs.writeFileSync(path.join(OUT_DIR, `${lang}-ui.json`), JSON.stringify(ui, null, 2) + '\n')
    fs.writeFileSync(path.join(OUT_DIR, `${lang}-content.json`), JSON.stringify(content, null, 2) + '\n')
    console.log(
      `${lang}: ui ${uiKeys} strings across ${Object.keys(ui).length} namespaces | content ${contentKeys} items` +
        ` (products ${Object.keys(content.products).length}, features ${Object.keys(content.features).length},` +
        ` specLabels ${Object.keys(content.specLabels).length}, faqs ${Object.keys(content.faqs).length},` +
        ` posts ${Object.keys(content.blogPosts).length}, tags ${Object.keys(content.blogTags).length})`,
    )
  }
  console.log(`\nwrote ${OUT_DIR}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
