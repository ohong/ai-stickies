import { test, expect } from '@playwright/test'

test.describe('History Page (US-3.2)', () => {
  test('history page loads', async ({ page }) => {
    await page.goto('/history')
    await page.waitForLoadState('networkidle')

    // Page should show history title
    const title = page.getByRole('heading', { name: /history/i })
    await expect(title).toBeVisible()
  })

  test('history page shows empty state when no generations', async ({ page }) => {
    await page.goto('/history')
    await page.waitForLoadState('networkidle')

    // Either shows generation cards or empty state
    const emptyState = page.getByText(/no generations|create.*first/i)
    const historyCards = page.locator('[data-testid="history-card"]')
      .or(page.locator('a[href*="generationId"]'))

    // One of these should be visible
    const hasCards = await historyCards.count() > 0
    const hasEmptyState = await emptyState.isVisible().catch(() => false)

    expect(hasCards || hasEmptyState).toBeTruthy()
  })

  test('history page shows session counter', async ({ page }) => {
    await page.goto('/history')
    await page.waitForLoadState('networkidle')

    const counter = page.locator('[data-testid="session-counter"]')
      .or(page.getByText(/\d+\s*\/\s*\d+/))
      .or(page.getByText(/remaining/i))

    await expect(counter).toBeVisible({ timeout: 5000 })
  })

  test('history page has back navigation', async ({ page }) => {
    await page.goto('/history')
    await page.waitForLoadState('networkidle')

    const backBtn = page.getByRole('button', { name: /back/i })
      .or(page.getByRole('link', { name: /back/i }))

    await expect(backBtn).toBeVisible()
  })

  test('history page shows expiry notice', async ({ page }) => {
    await page.goto('/history')
    await page.waitForLoadState('networkidle')

    // Should show 24hr expiry notice
    const expiryNotice = page.getByText(/24\s*hour|expire/i)
    await expect(expiryNotice).toBeVisible()
  })

  test('results page links to history', async ({ page }) => {
    await page.goto('/create/results?generationId=test')
    await page.waitForLoadState('networkidle')

    // Should have link to history page
    const historyLink = page.getByRole('button', { name: /history/i })
      .or(page.getByRole('link', { name: /history/i }))

    await expect(historyLink).toBeVisible({ timeout: 5000 })
  })
})
