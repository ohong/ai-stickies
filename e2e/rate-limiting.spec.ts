import { test, expect, Page } from '@playwright/test'

async function mockSessionApi(
  page: Page,
  overrides: {
    remainingGenerations?: number
    maxGenerations?: number
    generationCount?: number
  } = {}
) {
  const remaining = overrides.remainingGenerations ?? 8
  const max = overrides.maxGenerations ?? 10
  const count = overrides.generationCount ?? max - remaining

  await page.route('**/api/session', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: 'test-session-id',
          generationCount: count,
          remainingGenerations: remaining,
          maxGenerations: max,
          history: [],
        },
      }),
    })
  })
}

// ==========================================================================
// Rate Limiting - Session Counter
// ==========================================================================

test.describe('Rate Limiting - Session Counter', () => {
  test('shows correct remaining count from session API', async ({ page }) => {
    await mockSessionApi(page, { remainingGenerations: 7, maxGenerations: 10 })
    await page.goto('/create')

    // SessionCounter renders "7/10 remaining"
    const counter = page.getByText('7/10 remaining')
    await expect(counter).toBeVisible({ timeout: 10000 })
  })

  test('shows remaining count with different values', async ({ page }) => {
    await mockSessionApi(page, { remainingGenerations: 3, maxGenerations: 10 })
    await page.goto('/create')

    const counter = page.getByText('3/10 remaining')
    await expect(counter).toBeVisible({ timeout: 10000 })
  })
})

// ==========================================================================
// Rate Limiting - Exhausted State
// ==========================================================================

test.describe('Rate Limiting - Exhausted Generations', () => {
  test('shows warning when no generations remaining', async ({ page }) => {
    await mockSessionApi(page, {
      remainingGenerations: 0,
      maxGenerations: 10,
      generationCount: 10,
    })
    await page.goto('/create')

    // Warning message about used all free generations
    const warning = page.getByText(/used all your free generations/i)
      .or(page.getByText(/check back later/i))
    await expect(warning).toBeVisible({ timeout: 10000 })
  })

  test('generate button is disabled when no remaining generations', async ({ page }) => {
    await mockSessionApi(page, {
      remainingGenerations: 0,
      maxGenerations: 10,
      generationCount: 10,
    })
    await page.goto('/create')

    const generateBtn = page.getByRole('button', { name: /generate previews/i })
    await expect(generateBtn).toBeDisabled({ timeout: 10000 })
  })

  test('upload dropzone is disabled when no remaining generations', async ({ page }) => {
    await mockSessionApi(page, {
      remainingGenerations: 0,
      maxGenerations: 10,
      generationCount: 10,
    })
    await page.goto('/create')

    // ImageUploader sets aria-disabled="true" when disabled
    const dropzone = page.getByRole('button', { name: /upload photo/i })
    await expect(dropzone).toHaveAttribute('aria-disabled', 'true', { timeout: 10000 })
  })

  test('session counter shows 0/10 remaining', async ({ page }) => {
    await mockSessionApi(page, {
      remainingGenerations: 0,
      maxGenerations: 10,
      generationCount: 10,
    })
    await page.goto('/create')

    const counter = page.getByText('0/10 remaining')
    await expect(counter).toBeVisible({ timeout: 10000 })
  })
})

// ==========================================================================
// Rate Limiting - Session Persistence
// ==========================================================================

test.describe('Rate Limiting - Session Persistence', () => {
  test('session counter persists across navigation', async ({ page }) => {
    await mockSessionApi(page, { remainingGenerations: 5, maxGenerations: 10 })

    // Visit create page
    await page.goto('/create')
    await expect(page.getByText('5/10 remaining')).toBeVisible({ timeout: 10000 })

    // Navigate to home
    await page.goto('/')

    // Navigate back to create
    await page.goto('/create')
    await expect(page.getByText('5/10 remaining')).toBeVisible({ timeout: 10000 })
  })

  test('generation info shows on create page', async ({ page }) => {
    await mockSessionApi(page, { remainingGenerations: 8, maxGenerations: 10 })
    await page.goto('/create')

    // Footer text says "Uses 1 of your 10 free generations"
    const infoText = page.getByText(/uses 1 of your 10 free generations/i)
    await expect(infoText).toBeVisible({ timeout: 10000 })
  })
})
