import { test, expect, Page } from '@playwright/test'

const mockHistoryItems = [
  {
    generationId: 'gen-completed-1',
    createdAt: '2026-03-10T14:30:00Z',
    status: 'completed' as const,
    styleCount: 3,
  },
  {
    generationId: 'gen-completed-2',
    createdAt: '2026-03-09T09:15:00Z',
    status: 'completed' as const,
    styleCount: 5,
  },
]

async function mockSessionApi(
  page: Page,
  overrides: {
    remainingGenerations?: number
    maxGenerations?: number
    history?: typeof mockHistoryItems
  } = {}
) {
  await page.route('**/api/session', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: 'test-session-id',
          generationCount: 2,
          remainingGenerations: overrides.remainingGenerations ?? 8,
          maxGenerations: overrides.maxGenerations ?? 10,
          history: overrides.history ?? mockHistoryItems,
        },
      }),
    })
  })
}

// ==========================================================================
// History Page
// ==========================================================================

test.describe('History Page', () => {
  test('shows session counter', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/history')

    const counter = page.getByText(/\d+\/\d+\s*remaining/i)
    await expect(counter).toBeVisible({ timeout: 10000 })
  })

  test('shows "no history" state when empty', async ({ page }) => {
    await mockSessionApi(page, { history: [] })
    await page.goto('/history')

    // Empty state message: "No generations yet"
    const emptyState = page.getByText(/no generations yet/i)
    await expect(emptyState).toBeVisible({ timeout: 10000 })

    // Shows a CTA to create stickers
    const createBtn = page.getByRole('button', { name: /create stickers/i })
    await expect(createBtn).toBeVisible()
  })

  test('shows generation history items when present', async ({ page }) => {
    await mockSessionApi(page, { history: mockHistoryItems })
    await page.goto('/history')

    // Wait for history to load
    await page.waitForLoadState('networkidle')

    // Each completed generation should appear as a link
    // The items link to /create/results?generationId=...
    const historyLinks = page.locator('a[href*="generationId"]')
    await expect(historyLinks).toHaveCount(2, { timeout: 10000 })
  })

  test('each history item shows status badge', async ({ page }) => {
    await mockSessionApi(page, { history: mockHistoryItems })
    await page.goto('/history')

    // Completed badge should appear for each completed generation
    const completedBadges = page.getByText('Completed')
    await expect(completedBadges).toHaveCount(2, { timeout: 10000 })
  })

  test('each history item shows date', async ({ page }) => {
    await mockSessionApi(page, { history: mockHistoryItems })
    await page.goto('/history')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // History items should show formatted dates
    // The formatDate function renders like "Mar 10, 02:30 PM"
    const historyItems = page.locator('a[href*="generationId"]')
    await expect(historyItems.first()).toBeVisible({ timeout: 10000 })

    // Check that date-like content is present in first item
    const firstItemText = await historyItems.first().textContent()
    expect(firstItemText).toBeTruthy()
    // Should contain month abbreviation
    expect(firstItemText!).toMatch(/\w{3}\s+\d+/)
  })

  test('each history item shows style count', async ({ page }) => {
    await mockSessionApi(page, { history: mockHistoryItems })
    await page.goto('/history')

    // First item has 3 styles, second has 5
    await expect(page.getByText(/3 styles/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/5 styles/)).toBeVisible()
  })

  test('shows expiry notice (24 hour)', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/history')

    const expiryNotice = page.getByText(/24 hours/i)
    await expect(expiryNotice).toBeVisible({ timeout: 10000 })
  })

  test('has back navigation button', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/history')

    const backBtn = page.getByRole('button', { name: /back/i })
    await expect(backBtn).toBeVisible({ timeout: 10000 })
  })

  test('shows page heading', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/history')

    await expect(page.getByRole('heading', { name: /generation history/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/view and re-download/i)).toBeVisible()
  })
})
