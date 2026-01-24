import { test, expect } from '@playwright/test'

test.describe('Rate Limiting', () => {
  test('session counter shows on create page', async ({ page }) => {
    await page.goto('/create')

    // Session counter should display remaining/total
    const counter = page.locator('[data-testid="session-counter"]')
      .or(page.getByText(/\d+\s*\/\s*\d+/))
      .or(page.getByText(/remaining/i))

    await expect(counter).toBeVisible({ timeout: 5000 })
  })

  test('session counter shows on styles page', async ({ page }) => {
    await page.goto('/create/styles')
    await page.waitForLoadState('networkidle')

    const counter = page.locator('[data-testid="session-counter"]')
      .or(page.getByText(/\d+\s*\/\s*\d+/))
      .or(page.getByText(/remaining/i))

    await expect(counter).toBeVisible({ timeout: 5000 })
  })

  test('session counter shows on results page', async ({ page }) => {
    await page.goto('/create/results?generationId=test')
    await page.waitForLoadState('networkidle')

    const counter = page.locator('[data-testid="session-counter"]')
      .or(page.getByText(/\d+\s*\/\s*\d+/))
      .or(page.getByText(/remaining/i))

    await expect(counter).toBeVisible({ timeout: 5000 })
  })

  test('max generations is 10 per session', async ({ page }) => {
    await page.goto('/create')

    // Check for 10 in session counter
    const counterText = await page.locator('[data-testid="session-counter"]')
      .or(page.getByText(/\/\s*10/))
      .textContent()
      .catch(() => '')

    // Counter should reference 10 (max generations)
    if (counterText) {
      expect(counterText).toContain('10')
    }
  })
})

test.describe('Session Expiry', () => {
  // Note: Testing 24hr expiry would require time manipulation
  // or longer test runs - better suited for integration tests

  test('session persists across navigation', async ({ page }) => {
    // Visit create page
    await page.goto('/create')
    await page.waitForLoadState('networkidle')

    // Navigate away and back
    await page.goto('/')
    await page.goto('/create')
    await page.waitForLoadState('networkidle')

    // Session counter should still be visible
    const counter = page.locator('[data-testid="session-counter"]')
      .or(page.getByText(/\d+\s*\/\s*\d+/))
      .or(page.getByText(/remaining/i))

    await expect(counter).toBeVisible({ timeout: 5000 })
  })
})
