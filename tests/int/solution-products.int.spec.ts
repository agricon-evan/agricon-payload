import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { getProductsForSolution, getCaseStudiesForSolution } from '@/lib/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

describe('solution → product relations', () => {
  it('resolves products for a solution that has reverse relations', async () => {
    const { docs } = await payload.find({ collection: 'solutions', limit: 100 })
    const poultry = docs.find((s) => s.slug === 'poultry-farming')
    expect(poultry, 'expected a `poultry-farming` solution in the dev database').toBeDefined()

    const products = await getProductsForSolution(poultry!.id, 'en')
    // The catalog importer linked 23 products to this solution via
    // `products.solutions`. Before the forward/reverse helper, the page filtered
    // all 43 products in memory; this asserts the query path returns them.
    expect(products.length).toBeGreaterThan(0)
    for (const p of products) {
      expect(p.slug).toBeTruthy()
      expect(p.name).toBeTruthy()
    }
  })

  it('returns an empty list (not an error) for a solution with no products', async () => {
    // `aquaculture` and `breeding-house` currently have zero linked products
    // because every subcategory behind them is empty. The page must degrade to
    // hiding the section rather than throwing.
    const { docs } = await payload.find({ collection: 'solutions', limit: 100 })
    const empty = docs.find((s) => s.slug === 'aquaculture')
    expect(empty).toBeDefined()
    const products = await getProductsForSolution(empty!.id, 'en')
    expect(Array.isArray(products)).toBe(true)
  })

  it('every product returned belongs to the requested solution', async () => {
    const { docs } = await payload.find({ collection: 'solutions', limit: 100 })
    for (const solution of docs) {
      const products = await getProductsForSolution(solution.id, 'en')
      for (const p of products) {
        const linked = (p.solutions || []).some((rel) =>
          typeof rel === 'object' && rel !== null ? rel.id === solution.id : rel === solution.id,
        )
        const forward = await payload.find({
          collection: 'products',
          limit: 1,
          where: { and: [{ id: { equals: p.id } }, { solutions: { contains: solution.id } }] },
        })
        expect(
          linked || forward.docs.length === 1,
          `product "${p.slug}" was returned for solution "${solution.slug}" but carries no matching relation`,
        ).toBe(true)
      }
    }
  })

  it('does not throw when asked about a solution id that does not exist', async () => {
    const products = await getProductsForSolution(999_999, 'en')
    expect(products).toEqual([])
  })

  it('resolves case studies for a solution without throwing', async () => {
    const { docs } = await payload.find({ collection: 'solutions', limit: 100 })
    for (const solution of docs) {
      const cases = await getCaseStudiesForSolution(solution.id, 'en')
      expect(Array.isArray(cases)).toBe(true)
    }
  })
})
