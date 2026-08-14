import { test, expect } from '@playwright/test'

test.describe('Blog TOC', () => {
  test('blog detail renders a table of contents and anchor jumps work', async ({ page }) => {
    await page.goto('/en/blog/layer-cage-guide')

    // SSR TOC visible
    const toc = page.getByLabel('Table of contents')
    await expect(toc).toBeVisible()
    await expect(toc.locator('a')).toHaveCount(5)

    // Client effect assigns ids to headings (auto-retrying)
    await expect(page.locator('h2[id]')).toHaveCount(5)

    // Click the first TOC link from the top of the page — smooth-scrolls to the section
    await page.evaluate(() => window.scrollTo(0, 0))
    await toc.getByText('Start with Capacity, Not Price').click()
    await page.waitForTimeout(700)

    expect(page.url()).toContain('#start-with-capacity-not-price')
    const scrolled = await page.evaluate(() => window.scrollY)
    expect(scrolled).toBeGreaterThan(100)

    // The active TOC item is highlighted (brand green tint + orange numeral)
    const active = toc.locator('a', { has: page.locator('span.text-\\[var\\(--color-accent\\)\\]') })
    await expect(active.first()).toHaveText(/Start with Capacity/)
  })

  test('all TOC anchors resolve to real headings', async ({ page }) => {
    await page.goto('/en/blog/incubation-guide')
    const toc = page.getByLabel('Table of contents')
    await expect(toc.locator('a')).toHaveCount(5)

    // wait for client id assignment, then verify every anchor target exists
    await expect(page.locator('h2[id]')).toHaveCount(5)
    const hrefs = await toc.locator('a').evaluateAll((els) => els.map((el) => el.getAttribute('href')))
    for (const href of hrefs) {
      const id = href!.replace('#', '')
      await expect(page.locator(`[id="${id}"]`), `missing target for ${href}`).toHaveCount(1)
    }
  })
})
