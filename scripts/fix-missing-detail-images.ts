/**
 * Downloads the detail images that were truncated at 15 per product
 * (the original import capped descriptionImages at 15, but some Alibaba
 * pages have 16–22 detail images). Appends them to the product overviewHtml.
 *
 * Usage: pnpm tsx scripts/fix-missing-detail-images.ts
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const liveDesc = JSON.parse(fs.readFileSync(path.join(projectRoot, 'alibaba-extract/live-desc-full.json'), 'utf8'))
  .filter((x: { desc: string[] }) => (x.desc || []).length > 0)

async function main() {
  const db = createClient({ url: 'file:agricon-dev.db' })
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })
  let fixed = 0
  for (const item of liveDesc) {
    const { id, desc } = item as { id: string; desc: string[] }
    if (desc.length <= 15) continue // nothing missing

    // locate product by alibaba tag (direct SQL — tags is an array table)
    const found = (await db.execute({ sql: "SELECT p.id, p.slug FROM products p JOIN products_tags pt ON pt._parent_id = p.id WHERE pt.tag = ?", args: [`alibaba-${id}`] })).rows[0]
    if (!found) { console.log(`  !! no product for alibaba-${id}`); continue }
    const product = { id: Number(found.id), slug: String(found.slug) }
    const slug = product.slug
    const productName = (await db.execute({ sql: "SELECT name FROM products_locales WHERE _parent_id = ? AND _locale = 'en'", args: [product.id] })).rows[0]?.name || slug

    // download d_15..N
    const detailPublicDir = path.join(projectRoot, 'public/catalog/alibaba', slug)
    fs.mkdirSync(detailPublicDir, { recursive: true })
    const newImgs: string[] = []
    for (let i = 15; i < desc.length; i++) {
      const url = desc[i]
      const clean = url.replace(/[?&].*$/, '')
      const ext = clean.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg'
      const filename = `d_${String(i).padStart(2, '0')}.${ext}`
      const dest = path.join(detailPublicDir, filename)
      if (!fs.existsSync(dest)) {
        try {
          const res = await fetch(clean, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.alibaba.com/' } })
          if (!res.ok) { console.log(`  !! download fail ${filename}: HTTP ${res.status}`); continue }
          const buf = Buffer.from(await res.arrayBuffer())
          if (buf.length < 500) { console.log(`  !! too small ${filename}`); continue }
          fs.writeFileSync(dest, buf)
          console.log(`  downloaded ${slug}/${filename}`)
        } catch (e) {
          console.log(`  !! download error ${filename}: ${(e as Error).message}`)
          continue
        }
      }
      newImgs.push(`/catalog/alibaba/${slug}/${filename}`)
    }
    if (newImgs.length === 0) { console.log(`  ${slug}: no new images`); continue }

    // append to overviewHtml
    const doc = await payload.findByID({ collection: 'products', id: product.id, locale: 'en' })
    const existing = (doc as { overviewHtml?: string }).overviewHtml || ''
    const appended = newImgs.map((src) => `<p><img src="${src}" alt="${productName}" loading="lazy" /></p>`).join('\n')
    await payload.update({
      collection: 'products',
      id: product.id,
      locale: 'en',
      data: { overviewHtml: `${existing}\n${appended}` },
    })
    console.log(`  ${slug}: +${newImgs.length} detail images appended (total ${15 + newImgs.length})`)
    fixed++
  }
  console.log(`\nDone. Products fixed: ${fixed}`)
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
