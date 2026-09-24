import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { localeNamespaces, locales } from '@/i18n/config'

/**
 * Guards the six-language UI copy.
 *
 * Before the translation pass 41% of every non-English locale's strings were
 * byte-identical to English (the `distributors` and `faq` namespaces were 100%
 * English in all five), `fr` was the only locale with a `blog` namespace, and
 * `sw` the only one with `solutions` — neither of which any page ever read. These
 * tests make that class of drift fail loudly instead of shipping.
 */

const LOCALES_DIR = path.resolve(process.cwd(), 'src/i18n/locales')
const NON_DEFAULT = locales.filter((l) => l !== 'en')

type Json = Record<string, unknown>

const readLocale = (locale: string, ns: string): Json =>
  JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, locale, `${ns}.json`), 'utf8'))

const flatten = (obj: Json, prefix = ''): Array<[string, unknown]> =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? flatten(v as Json, `${prefix}${k}.`)
      : [[`${prefix}${k}`, v] as [string, unknown]],
  )

/** Strings that are legitimately the same in every language. */
const IDENTICAL_OK = /^(AGRICON|Agricon|Blog|FAQ|PDF|ISO|CE|OEM|ODM|MOQ|USD|US\$|Email|E-mail|WhatsApp|LinkedIn|Facebook|YouTube|Instagram|TikTok|[0-9\s+()\-./%:,]*)$/

describe('i18n namespace parity', () => {
  it('every locale has exactly the namespaces the registry declares', () => {
    for (const locale of locales) {
      const onDisk = fs
        .readdirSync(path.join(LOCALES_DIR, locale))
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''))
        .sort()
      expect(onDisk, `locale ${locale}`).toEqual([...localeNamespaces[locale]].sort())
    }
  })

  it('all locales expose the same namespace set as English', () => {
    const en = [...localeNamespaces.en].sort()
    for (const locale of NON_DEFAULT) {
      expect([...localeNamespaces[locale]].sort(), `locale ${locale}`).toEqual(en)
    }
  })

  it('no locale is missing a key that English has', () => {
    for (const ns of localeNamespaces.en) {
      const enKeys = flatten(readLocale('en', ns)).map(([k]) => k).sort()
      for (const locale of NON_DEFAULT) {
        const keys = flatten(readLocale(locale, ns)).map(([k]) => k).sort()
        const missing = enKeys.filter((k) => !keys.includes(k))
        expect(missing, `${locale}/${ns} is missing keys`).toEqual([])
      }
    }
  })
})

describe('i18n content quality', () => {
  it('has no empty or whitespace-only translation values', () => {
    for (const locale of locales) {
      for (const ns of localeNamespaces[locale]) {
        const empties = flatten(readLocale(locale, ns))
          .filter(([, v]) => typeof v === 'string' && v.trim() === '')
          .map(([k]) => k)
        expect(empties, `${locale}/${ns}`).toEqual([])
      }
    }
  })

  it('has no leftover Chinese copy in any locale file', () => {
    for (const locale of locales) {
      for (const ns of localeNamespaces[locale]) {
        const cjk = flatten(readLocale(locale, ns))
          .filter(([, v]) => typeof v === 'string' && /[\u4e00-\u9fff]/.test(v))
          .map(([k]) => k)
        expect(cjk, `${locale}/${ns} contains CJK text`).toEqual([])
      }
    }
  })

  it('keeps the untranslated share of every namespace below 20%', () => {
    // The audit that prompted this work measured 41% overall, with `distributors`
    // and `faq` at 100%. Brand/acronym strings are excluded from the count.
    for (const locale of NON_DEFAULT) {
      for (const ns of localeNamespaces[locale]) {
        const en = new Map(flatten(readLocale('en', ns)))
        const comparable = flatten(readLocale(locale, ns)).filter(([k, v]) => {
          const source = en.get(k)
          return typeof v === 'string' && v.trim() && typeof source === 'string' && !IDENTICAL_OK.test(v.trim())
        })
        if (!comparable.length) continue
        const identical = comparable.filter(([k, v]) => en.get(k) === v).length
        const ratio = identical / comparable.length
        expect(ratio, `${locale}/${ns}: ${identical}/${comparable.length} strings still English`).toBeLessThan(0.2)
      }
    }
  })
})
