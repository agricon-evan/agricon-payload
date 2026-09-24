#!/usr/bin/env node
/**
 * Regenerate the default social-share (Open Graph / Twitter) card.
 *
 * Pages without a CMS image fall back to this file, so it must be small: social
 * crawlers reject oversized images and the file is fetched on every share. The
 * source photos in `public/images` are 4–8 MB, which is why this derives a
 * 1200×630 JPEG instead of pointing `og:image` at them.
 *
 *   node scripts/generate-og-image.mjs
 *
 * Output: public/images/og-default.jpg  (referenced by src/lib/seo.ts)
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCE = path.join(ROOT, 'public/images/home-series-poultry.jpg')
const OUT = path.join(ROOT, 'public/images/og-default.jpg')

const WIDTH = 1200
const HEIGHT = 630

// Readability scrim + wordmark, drawn as SVG so the card stays legible when a
// platform renders it small.
const overlay = Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#062a1c" stop-opacity="0.92"/>
      <stop offset="55%" stop-color="#062a1c" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#062a1c" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)"/>
  <text x="72" y="${HEIGHT - 138}" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="76" font-weight="700" fill="#ffffff" letter-spacing="2">AGRICON</text>
  <rect x="74" y="${HEIGHT - 112}" width="112" height="6" fill="#EE9230"/>
  <text x="72" y="${HEIGHT - 62}" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="30" fill="#e8f2ec">Poultry &amp; Livestock Equipment Solutions</text>
</svg>`)

const info = await sharp(SOURCE)
  .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
  .composite([{ input: overlay, top: 0, left: 0 }])
  .jpeg({ quality: 80, mozjpeg: true, progressive: true })
  .toFile(OUT)

console.log(`wrote ${path.relative(ROOT, OUT)} — ${info.width}×${info.height}, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`)
