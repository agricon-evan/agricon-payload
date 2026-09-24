/**
 * Localize the product long-form article `overviewHtml`.
 *
 * WHY
 * ---
 * `products.overviewHtml` is the main article on a product page and is
 * `localized: true`, but only the English rows were ever populated. With
 * `fallback: true`, all five other locales rendered the English article, so
 * /ru, /fr, /es, /sw and /ar product pages were 210KB of English prose inside an
 * otherwise fully localized page.
 *
 * HOW THE HTML IS KEPT SAFE
 * -------------------------
 * The article is HTML with up to 110 `<div>`s and 1,468 `<span>`s per product,
 * so asking a translator to reproduce the markup would corrupt it silently. This
 * splits the HTML into an alternating tag/text token list, translates **only the
 * non-blank text tokens**, and reassembles by walking the original token list.
 * Tags are therefore byte-identical by construction — they are never sent to the
 * translator and never rebuilt.
 *
 * `--check` asserts that: same token count, same tag sequence, same blank tokens.
 *
 * Inputs
 *   scripts/translations/_todo/overview/<slug>.json         { tokens, textRuns }  (from --extract)
 *   scripts/translations/<lang>-overview.json               { "<slug>": [ …translated runs… ] }
 *
 *   pnpm tsx scripts/i18n-overview.ts --extract           # write the per-product token files
 *   pnpm tsx scripts/i18n-overview.ts --check             # verify translations against the tokens
 *   pnpm tsx scripts/i18n-overview.ts --apply             # write to the CMS
 *   pnpm tsx scripts/i18n-overview.ts --apply --lang=ru
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const ROOT = path.resolve(import.meta.dirname, '..')
const TR = path.join(ROOT, 'scripts/translations')
const OUT_DIR = path.join(TR, '_todo/overview')

const ALL_LANGS = ['ru', 'fr', 'es', 'sw', 'ar']
const args = process.argv.slice(2)
const mode = args.includes('--extract') ? 'extract' : args.includes('--check') ? 'check' : args.includes('--apply') ? 'apply' : 'check'
const langArg = args.find((a) => a.startsWith('--lang='))?.split('=')[1]
const LANGS = langArg ? [langArg] : ALL_LANGS

type Token = { type: 'tag' | 'text'; value: string }

/**
 * Split HTML into an alternating token list. Concatenating every `value` in
 * order reproduces the input exactly, so reassembly cannot lose markup.
 */
function tokenize(html: string): Token[] {
  const tokens: Token[] = []
  const re = /<[^>]*>/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (m.index > last) tokens.push({ type: 'text', value: html.slice(last, m.index) })
    tokens.push({ type: 'tag', value: m[0] })
    last = m.index + m[0].length
  }
  if (last < html.length) tokens.push({ type: 'text', value: html.slice(last) })
  return tokens
}

/** Indices of the text tokens that carry prose (i.e. are not pure whitespace). */
const proseIndices = (tokens: Token[]) =>
  tokens.reduce<number[]>((acc, t, i) => {
    if (t.type === 'text' && t.value.trim()) acc.push(i)
    return acc
  }, [])

/** Rebuild HTML, substituting the translated runs at the prose positions. */
function reassemble(tokens: Token[], runs: string[]): string {
  const out = [...tokens]
  const idx = proseIndices(tokens)
  idx.forEach((tokenIndex, k) => {
    // Preserve the original leading/trailing whitespace so inline spacing survives.
    const original = tokens[tokenIndex].value
    const lead = original.match(/^\s*/)?.[0] ?? ''
    const trail = original.match(/\s*$/)?.[0] ?? ''
    out[tokenIndex] = { type: 'text', value: `${lead}${runs[k]}${trail}` }
  })
  return out.map((t) => t.value).join('')
}

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  const { docs } = await payload.find({
    collection: 'products',
    locale: 'en',
    depth: 0,
    limit: 500,
    pagination: false,
    select: { slug: true, overviewHtml: true },
  })
  const articles = (docs as unknown as Array<{ slug?: string | null; overviewHtml?: string | null }>)
    .filter((d) => d.slug && d.overviewHtml && d.overviewHtml.trim())
    .map((d) => ({ slug: d.slug as string, html: d.overviewHtml as string }))

  console.log(`${articles.length} product(s) with an English article\n`)

  if (mode === 'extract') {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    const combined: Record<string, string[]> = {}
    for (const { slug, html } of articles) {
      const tokens = tokenize(html)
      const runs = proseIndices(tokens).map((i) => tokens[i].value.trim())
      fs.writeFileSync(path.join(OUT_DIR, `${slug}.json`), JSON.stringify({ tokens, textRuns: runs }))
      combined[slug] = runs
    }
    fs.writeFileSync(path.join(TR, '_todo/overview-all.json'), JSON.stringify(combined, null, 2) + '\n')
    const total = Object.values(combined).reduce((n, r) => n + r.length, 0)
    const chars = Object.values(combined).reduce((n, r) => n + r.join(' ').length, 0)
    console.log(`wrote ${articles.length} token file(s) + _todo/overview-all.json`)
    console.log(`${total} text run(s), ${chars} chars (${(chars / 1024).toFixed(0)} KB)`)
    process.exit(0)
  }

  // check / apply both need the tokens on disk.
  const failures: string[] = []
  let total = 0

  for (const lang of LANGS) {
    const file = path.join(TR, `${lang}-overview.json`)
    if (!fs.existsSync(file)) {
      failures.push(`${lang}: missing ${path.relative(ROOT, file)}`)
      console.error(`✗ ${lang}: input file not found`)
      continue
    }
    const table = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string[]>

    let updated = 0
    for (const { slug, html } of articles) {
      const tokenFile = path.join(OUT_DIR, `${slug}.json`)
      if (!fs.existsSync(tokenFile)) {
        failures.push(`${lang}/${slug}: no token file — run --extract first`)
        continue
      }
      const { tokens, textRuns } = JSON.parse(fs.readFileSync(tokenFile, 'utf8')) as {
        tokens: Token[]
        textRuns: string[]
      }
      const runs = table[slug]
      if (!Array.isArray(runs)) {
        failures.push(`${lang}/${slug}: no translation array`)
        continue
      }
      if (runs.length !== textRuns.length) {
        failures.push(`${lang}/${slug}: ${runs.length} run(s), expected ${textRuns.length}`)
        continue
      }
      const empty = runs.findIndex((r) => !String(r ?? '').trim())
      if (empty !== -1) {
        failures.push(`${lang}/${slug}: empty translation at index ${empty}`)
        continue
      }

      const rebuilt = reassemble(tokens, runs.map((r) => String(r)))

      // Structural gate: reassembling the ORIGINAL runs must reproduce the
      // original HTML byte-for-byte. If it does not, the tokenizer is lossy and
      // nothing should be written.
      if (reassemble(tokens, textRuns) !== html) {
        failures.push(`${lang}/${slug}: tokenizer round-trip mismatch — refusing to write`)
        continue
      }
      // Tag sequence must be untouched by the substitution.
      const tagSeq = (s: string) => tokenize(s).filter((t) => t.type === 'tag').map((t) => t.value).join('')
      if (tagSeq(rebuilt) !== tagSeq(html)) {
        failures.push(`${lang}/${slug}: tag sequence changed — refusing to write`)
        continue
      }

      if (mode === 'check') {
        updated += 1
        continue
      }

      const { docs: found } = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        pagination: false,
        where: { slug: { equals: slug } },
        select: { slug: true },
      })
      const target = found[0] as unknown as { id: number } | undefined
      if (!target) {
        failures.push(`${lang}/${slug}: product not found`)
        continue
      }
      try {
        await payload.update({
          collection: 'products',
          id: target.id,
          locale: lang,
          data: { overviewHtml: rebuilt } as never,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message.split('\n')[0] : String(err)
        failures.push(`${lang}/${slug}: ${msg}`)
        console.error(`  ✗ ${lang}/${slug}: ${msg}`)
        continue
      }
      const check = await payload.findByID({
        collection: 'products',
        id: target.id,
        locale: lang,
        fallbackLocale: false,
        depth: 0,
        select: { overviewHtml: true },
      })
      if ((check as unknown as { overviewHtml?: string | null }).overviewHtml !== rebuilt) {
        failures.push(`${lang}/${slug}: verify mismatch`)
        continue
      }
      updated += 1
    }

    console.log(`${lang}: ${updated} article(s) ${mode === 'apply' ? 'updated' : 'verified'}`)
    total += updated
  }

  console.log(`\n${mode === 'apply' ? 'Applied' : 'Verified'} ${total} article-locale pair(s)`)
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`)
    for (const f of failures.slice(0, 20)) console.error('  ✗ ' + f)
    process.exit(1)
  }
  console.log('No failures.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
