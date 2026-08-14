/**
 * Database backup — copies the SQLite DB (and optionally media) to backups/.
 * Idempotent; keeps the newest N backups.
 *
 * Usage: pnpm tsx scripts/backup-db.ts [--keep=7] [--no-media]
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const keepArg = process.argv.find((a) => a.startsWith('--keep='))
const keep = keepArg ? parseInt(keepArg.split('=')[1], 10) : 7
const noMedia = process.argv.includes('--no-media')

function stamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function prune(dir: string, prefix: string, max: number) {
  if (!fs.existsSync(dir)) return
  const files = fs.readdirSync(dir)
    .filter((f) => f.startsWith(prefix))
    .sort()
  while (files.length > max) {
    const old = files.shift()!
    fs.unlinkSync(path.join(dir, old))
    console.log(`  pruned ${old}`)
  }
}

async function main() {
  const backupDir = path.join(projectRoot, 'backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const ts = stamp()

  // SQLite DB (+ WAL if present)
  const dbFiles = ['agricon-dev.db', 'agricon-dev.db-wal', 'agricon-dev.db-shm']
  for (const f of dbFiles) {
    const src = path.join(projectRoot, f)
    if (!fs.existsSync(src)) continue
    fs.copyFileSync(src, path.join(backupDir, `${f}.${ts}`))
    console.log(`  backed up ${f}`)
  }
  prune(backupDir, 'agricon-dev.db.', keep)

  // Media files (uploads stored in ./media)
  if (!noMedia) {
    const mediaDir = path.join(projectRoot, 'media')
    if (fs.existsSync(mediaDir)) {
      const dest = path.join(backupDir, `media-${ts}`)
      fs.cpSync(mediaDir, dest, { recursive: true })
      console.log(`  backed up media → media-${ts}`)
      // keep only the latest media backup to avoid bloat
      const mediaBackups = fs.readdirSync(backupDir).filter((f) => f.startsWith('media-')).sort()
      while (mediaBackups.length > 1) {
        const old = mediaBackups.shift()!
        fs.rmSync(path.join(backupDir, old), { recursive: true, force: true })
        console.log(`  pruned ${old}`)
      }
    }
  }

  console.log(`\nBackup complete → ${backupDir} (${ts})`)
}

main().catch((e) => { console.error(e); process.exit(1) })
