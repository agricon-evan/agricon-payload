// Crawl the site and report broken internal links. Read-only.
//
//   pnpm dev
//   node scripts/check-links.cjs
const { chromium } = require('playwright')

const SEEDS = [
  '/en',
  '/en/products',
  '/en/products/poultry-equipment',
  '/en/products/poultry-equipment/layer-cage',
  '/en/products/livestock-equipment',
  '/en/products/agriculture-machinery',
  '/en/products/wire-mesh',
  '/en/solutions',
  '/en/solutions/poultry-farming',
  '/en/case-studies',
  '/en/about',
  '/en/trade-support',
  '/en/blog',
  '/en/faq',
  '/en/contact',
]

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const links = new Set()
  for (const seed of SEEDS) {
    try {
      await page.goto('http://localhost:3000' + seed, { waitUntil: 'domcontentloaded', timeout: 90000 })
      await page.waitForTimeout(2000)
      const found = await page.evaluate(() =>
        [...document.querySelectorAll('a[href]')]
          .map((a) => a.getAttribute('href'))
          .filter((h) => h && h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/api') && !h.includes('#'))
          .map((h) => h.split('?')[0]),
      )
      found.forEach((f) => links.add(f))
    } catch (e) {
      console.log(`seed failed: ${seed} — ${String(e.message).slice(0, 50)}`)
    }
  }

  const all = [...links].sort()
  console.log(`collected ${all.length} unique internal links from ${SEEDS.length} pages\n`)

  const bad = []
  for (const href of all) {
    try {
      const res = await page.request.get('http://localhost:3000' + href, { timeout: 45000 })
      const s = res.status()
      if (s >= 400) {
        bad.push({ href, status: s })
        console.log(`❌ ${String(s)}  ${href}`)
      }
    } catch (e) {
      bad.push({ href, status: 'ERR' })
      console.log(`❌ ERR  ${href} — ${String(e.message).slice(0, 40)}`)
    }
  }

  console.log('\n' + (bad.length ? `❌ ${bad.length} broken link(s) of ${all.length}` : `✅ all ${all.length} internal links resolve`))
  await browser.close()
})().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
