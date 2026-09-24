/**
 * Syncs the two sides of the solution ↔ product relationship.
 *
 * WHY
 * ---
 * Payload stores these as two independent relations:
 *   - `solutions.products`  — declared on the Solutions collection
 *   - `products.solutions`  — declared on Products
 *
 * Neither is derived from the other, and nothing in the codebase wrote both.
 * The Alibaba catalog importer populated only `products.solutions` (56 rows) and
 * left `solutions.products` completely empty — so in the admin, opening any
 * solution showed no products, while opening a product showed its solutions.
 * The storefront worked around it by filtering the entire product list in
 * memory (`getProductsForSolution` in src/lib/payload.ts), which is why the bug
 * stayed invisible on the website but obvious in the CMS.
 *
 * This script copies `products.solutions` into `solutions.products` so the
 * declared side is authoritative going forward. It only ever ADDS relations —
 * it never removes anything an editor set explicitly.
 *
 * Idempotent. Safe to re-run.
 *
 * USAGE
 *   pnpm tsx scripts/sync-solution-products.ts          # apply
 *   pnpm tsx scripts/sync-solution-products.ts --check  # report drift only
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

const CHECK_ONLY = process.argv.includes('--check')

const asId = (value: unknown): number | string | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') {
    const id = (value as { id?: number | string }).id
    return id ?? null
  }
  return value as number | string
}

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })

  const { docs: products } = await payload.find({ collection: 'products', limit: 1000, depth: 0 })
  const { docs: solutions } = await payload.find({ collection: 'solutions', limit: 1000, depth: 0 })

  // Desired state: solution id -> set of product ids.
  const desired = new Map<string, Set<number | string>>()
  for (const solution of solutions) desired.set(String(solution.id), new Set())

  let orphans = 0
  for (const product of products) {
    for (const rel of product.solutions || []) {
      const solutionId = asId(rel)
      if (solutionId === null) continue
      const bucket = desired.get(String(solutionId))
      if (!bucket) {
        orphans++
        console.log(`  ! product "${product.slug}" references missing solution id ${solutionId} — skipped`)
        continue
      }
      bucket.add(product.id)
    }
  }

  const changes: Array<{ slug: string; id: number | string; toAdd: Array<number | string> }> = []
  for (const solution of solutions) {
    const want = desired.get(String(solution.id)) || new Set()
    const have = new Set((solution.products || []).map(asId).filter((x): x is number | string => x !== null))
    const toAdd = [...want].filter((id) => !have.has(id))
    if (toAdd.length > 0) changes.push({ slug: solution.slug, id: solution.id, toAdd })
  }

  const totalAdditions = changes.reduce((sum, c) => sum + c.toAdd.length, 0)

  if (totalAdditions === 0) {
    console.log(
      `✓ solutions.products is already in sync with products.solutions ` +
        `(${solutions.length} solutions, ${products.length} products)`,
    )
    process.exit(0)
  }

  console.log(`solutions.products is missing ${totalAdditions} relation(s):\n`)
  for (const c of changes) {
    console.log(`  ${c.slug} (id ${c.id}): +${c.toAdd.length} product(s)`)
  }
  if (orphans > 0) console.log(`\n  (${orphans} orphaned product relation(s) reported above)`)

  if (CHECK_ONLY) {
    console.log('\nRe-run without --check to apply.')
    process.exit(1)
  }

  console.log('')
  let updated = 0
  for (const change of changes) {
    const solution = solutions.find((s) => s.id === change.id)!
    const existing = (solution.products || []).map(asId).filter((x): x is number | string => x !== null)
    await payload.update({
      collection: 'solutions',
      id: change.id,
      // depth 0 keeps the response small; we only need the write to land.
      depth: 0,
      data: { products: [...existing, ...change.toAdd] },
    })
    console.log(`  ✓ ${change.slug}: now lists ${existing.length + change.toAdd.length} product(s)`)
    updated++
  }

  console.log(`\n✓ synced ${updated} solution(s).`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
