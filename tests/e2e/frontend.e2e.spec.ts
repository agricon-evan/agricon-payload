import { test, expect } from '@playwright/test'

// E2E tests for the Agricon website (real site assertions)
test.describe('Agricon Frontend', () => {
  test('homepage renders brand and hero', async ({ page }) => {
    await page.goto('/en')

    // Brand title present
    await expect(page).toHaveTitle(/Agricon/)

    // Hero heading
    const hero = page.getByRole('heading', { level: 1 }).first()
    await expect(hero).toContainText('Farm Equipment Built')

    // Primary CTA
    await expect(page.getByRole('link', { name: /Explore Products/i }).first()).toBeVisible()

    // Key sections render
    await expect(page.getByText('Why Agricon').first()).toBeVisible()
  })

  test('homepage sections render', async ({ page }) => {
    await page.goto('/en')

    // Stats band
    await expect(page.getByText('Export Markets').first()).toBeVisible()

    // Products & Solutions sections
    await expect(page.getByText('Complete Farm Equipment Lines').first()).toBeVisible()
    await expect(page.getByText('Turnkey Farm Solutions').first()).toBeVisible()

    // Trust evidence section
    await expect(page.getByText(/We Prove What We Claim/i).first()).toBeVisible()
  })

  test('products page works', async ({ page }) => {
    await page.goto('/en/products')

    // Page renders (either categories or empty state)
    await expect(page).toHaveTitle(/Products|Agricon/)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })

  test('SEO metadata routes return the correct formats', async ({ request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.ok()).toBeTruthy()
    expect(robots.headers()['content-type']).toContain('text/plain')
    expect(await robots.text()).toContain('Sitemap:')

    const manifest = await request.get('/manifest.webmanifest')
    expect(manifest.ok()).toBeTruthy()
    expect(manifest.headers()['content-type']).toContain('application/manifest+json')
    expect((await manifest.json()).short_name).toBe('Agricon')
  })

  test('contact page has inquiry form', async ({ page }) => {
    await page.goto('/en/contact')

    // Inquiry form present
    await expect(page.getByRole('heading', { name: /Send Us Your Inquiry/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Submit Inquiry/i })).toBeVisible()
  })

  test('language switcher navigates to /ru', async ({ page }) => {
    await page.goto('/en')

    // Language dropdown opens and Russian locale works
    await page.getByRole('button', { name: /Switch language/i }).click()
    await page.getByRole('link', { name: 'Русский' }).click()

    // Russian homepage loads
    await page.waitForURL('**/ru')
    await expect(page.getByText('Продукция').first()).toBeVisible()
  })

  test('unknown page returns 404', async ({ page }) => {
    const res = await page.goto('/en/this-page-does-not-exist')
    // 404 status (may be soft 404 in App Router, so check the 404 content)
    await expect(page.getByRole('heading', { name: '404' }).first()).toBeVisible()
    expect(res?.status()).toBeGreaterThanOrEqual(404)
  })
})
