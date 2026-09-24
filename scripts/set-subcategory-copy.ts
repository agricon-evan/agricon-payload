/**
 * Set localized name / description (card blurb) of existing subcategories from a
 * UTF-8 JSON file. Written because `reorder-subcategories.ts --rename=` passes the
 * new name through the shell, and Cyrillic / Arabic values can arrive mojibake'd
 * while the read-back check still "passes" (it compares against the same mangled
 * argument). A JSON file never touches the shell.
 *
 *   {
 *     "screw-conveyor": {
 *       "en": { "name": "Screw Elevator", "description": "For vertically conveying grain…" },
 *       "ar": { "name": "الرافعات اللولبية", "description": "لنقل الحبوب…" }
 *     }
 *   }
 *
 *   pnpm tsx scripts/set-subcategory-copy.ts --from=docs/scrape/foo.json           # dry run
 *   pnpm tsx scripts/set-subcategory-copy.ts --from=docs/scrape/foo.json --apply   # write
 *
 * Only the fields present are written, and every write is read back and compared
 * per locale, so a partially applied run is visible in the output.
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const raw = process.argv.slice(2)
const fromArg = raw.find((a) => a.startsWith('--from='))?.slice('--from='.length)
const apply = raw.includes('--apply')

if (!fromArg) {
  console.error('usage: --from=<file.json> [--apply]')
  process.exit(2)
}

type Copy = { name?: string; description?: string }
const plan = JSON.parse(readFileSync(fromArg, 'utf8')) as Record<string, Record<string, Copy>>

const { default: config } = await import('../src/payload.config.js')
const payload = await getPayload({ config })

let failures = 0

for (const [slug, perLocale] of Object.entries(plan)) {
  // `_note` / `_updated` style metadata keys are allowed in the JSON.
  if (slug.startsWith('_')) continue
  const doc = (
    await payload.find({
      collection: 'subcategories',
      where: { slug: { equals: slug } },
      locale: 'en',
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0] as Record<string, unknown> | undefined

  if (!doc) {
    console.error(`✗ subcategory "${slug}" does not exist`)
    failures++
    continue
  }

  console.log(`\n${slug}  (id=${doc.id})`)

  for (const [locale, copy] of Object.entries(perLocale)) {
    const data: Record<string, string> = {}
    if (copy.name !== undefined) data.name = copy.name
    if (copy.description !== undefined) data.description = copy.description
    if (Object.keys(data).length === 0) continue

    // Payload validates `required` localized fields against the incoming data, so a
    // description-only write in a non-default locale dies with
    // `Name: This field is required.` whenever that locale has no own name row and
    // only falls back to English. Re-send the name the locale currently displays
    // (its own value, or the fallback the page shows anyway).
    const localeDoc = (
      await payload.find({
        collection: 'subcategories',
        where: { slug: { equals: slug } },
        locale,
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0] as Record<string, unknown>

    if (data.name === undefined) {
      const carried = String(localeDoc?.name ?? '')
      if (!carried) {
        if (apply) {
          console.error(`  ✗ ${locale}: no name to carry — refusing a description-only write`)
          failures++
          continue
        }
      } else {
        data.name = carried
      }
    }

    if (!apply) {
      for (const [field, value] of Object.entries(data)) {
        // a carried name is not a change, don't print it as one
        if (field === 'name' && copy.name === undefined) continue
        const before = String(localeDoc?.[field] ?? '')
        console.log(`  [dry] ${locale}.${field}: "${before}" → "${value}"`)
      }
      continue
    }

    await payload.update({
      collection: 'subcategories',
      id: doc.id as never,
      locale,
      depth: 0,
      overrideAccess: true,
      data: data as never,
    })

    const after = (
      await payload.find({
        collection: 'subcategories',
        where: { slug: { equals: slug } },
        locale,
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0] as Record<string, unknown>

    for (const [field, value] of Object.entries(data)) {
      const written = String(after?.[field] ?? '')
      if (written === value) {
        console.log(`  ✓ ${locale}.${field}: "${written}"`)
      } else {
        console.log(`  ✗ ${locale}.${field} 写入失败: "${written}" ≠ "${value}"`)
        failures++
      }
    }
  }
}

console.log(apply ? (failures ? `\n完成但有 ${failures} 处失败` : '\n全部写入并核对通过') : '\ndry run — re-run with --apply to write')
process.exit(failures && apply ? 1 : 0)
