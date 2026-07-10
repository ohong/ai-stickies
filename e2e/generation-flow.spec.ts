import { test, expect, Page } from '@playwright/test'

const MOCK_GENERATION_ID = 'test-gen-id-12345'

const mockPreviews = [
  {
    id: 'preview-1',
    styleName: 'Chibi',
    fidelityLevel: 'chibi',
    description: 'Cute chibi style stickers',
    previewUrl: 'https://test.supabase.co/storage/v1/object/public/stickers/previews/chibi.png',
  },
  {
    id: 'preview-2',
    styleName: 'Minimalist',
    fidelityLevel: 'minimalist',
    description: 'Clean minimalist style stickers',
    previewUrl: 'https://test.supabase.co/storage/v1/object/public/stickers/previews/minimalist.png',
  },
  {
    id: 'preview-3',
    styleName: 'Abstract',
    fidelityLevel: 'abstract',
    description: 'Artistic abstract style stickers',
    previewUrl: 'https://test.supabase.co/storage/v1/object/public/stickers/previews/abstract.png',
  },
  {
    id: 'preview-4',
    styleName: 'High Fidelity',
    fidelityLevel: 'high-fidelity',
    description: 'Detailed high fidelity stickers',
    previewUrl: 'https://test.supabase.co/storage/v1/object/public/stickers/previews/high-fidelity.png',
  },
  {
    id: 'preview-5',
    styleName: 'Retro',
    fidelityLevel: 'retro',
    description: 'Nostalgic retro style stickers',
    previewUrl: 'https://test.supabase.co/storage/v1/object/public/stickers/previews/retro.png',
  },
]

async function mockSessionApi(page: Page, overrides: Record<string, unknown> = {}) {
  await page.route('**/api/session', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: 'test-session-id',
          generationCount: 2,
          remainingGenerations: 8,
          maxGenerations: 10,
          history: [],
          ...overrides,
        },
      }),
    })
  })
}

async function mockGenerationApi(page: Page) {
  await page.route(`**/api/generations/${MOCK_GENERATION_ID}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        generation: {
          id: MOCK_GENERATION_ID,
          status: 'completed',
          language: 'en',
          createdAt: '2026-01-15T10:00:00Z',
        },
        previews: mockPreviews,
      }),
    })
  })
}

async function mockGeneratePacksApi(page: Page) {
  await page.route('**/api/generate/packs', (route) => {
    route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        generationId: MOCK_GENERATION_ID,
      }),
    })
  })
}

// ==========================================================================
// Redirect behavior
// ==========================================================================

test.describe('Styles Page - Redirect', () => {
  test('shows error state when no generationId is in URL', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/create/styles')

    // The page shows "No generation ID provided" error
    const errorText = page.getByText(/no generation id provided/i)
      .or(page.getByText(/generation not found/i))
    await expect(errorText).toBeVisible({ timeout: 10000 })

    // Should show a "Back to Create" button
    const backBtn = page.getByRole('button', { name: /back to create/i })
    await expect(backBtn).toBeVisible()
  })
})

// ==========================================================================
// Style Selection
// ==========================================================================

test.describe('Styles Page - Style Selection', () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionApi(page)
    await mockGenerationApi(page)
    await mockGeneratePacksApi(page)
    await page.goto(`/create/styles?generationId=${MOCK_GENERATION_ID}`)

    // Wait for previews to load
    await page.waitForSelector('[role="checkbox"]', { timeout: 10000 })
  })

  test('shows 5 style preview cards when loaded', async ({ page }) => {
    const styleCards = page.locator('[role="checkbox"]')
    await expect(styleCards).toHaveCount(5)

    // Verify each style name is displayed
    for (const preview of mockPreviews) {
      await expect(page.getByRole('heading', { name: preview.styleName })).toBeVisible()
    }
  })

  test('can select and deselect style cards', async ({ page }) => {
    const firstCard = page.locator('[role="checkbox"]').first()

    // Initially unchecked
    await expect(firstCard).toHaveAttribute('aria-checked', 'false')

    // Click to select
    await firstCard.click()
    await expect(firstCard).toHaveAttribute('aria-checked', 'true')

    // Click again to deselect
    await firstCard.click()
    await expect(firstCard).toHaveAttribute('aria-checked', 'false')
  })

  test('selection summary updates with count', async ({ page }) => {
    // Initially shows "Select at least 1 style"
    await expect(page.getByText(/select at least 1 style/i)).toBeVisible()

    // Select first card
    await page.locator('[role="checkbox"]').first().click()
    await expect(page.getByText(/1 style selected/i)).toBeVisible()

    // Select second card
    await page.locator('[role="checkbox"]').nth(1).click()
    await expect(page.getByText(/2 styles selected/i)).toBeVisible()
  })

  test('cannot proceed with 0 selections', async ({ page }) => {
    // Generate button should exist but be disabled with 0 selections
    const generateBtn = page.getByRole('button', { name: /generate.*pack/i })
    await expect(generateBtn).toBeVisible()
    await expect(generateBtn).toBeDisabled()
  })

  test('can proceed with 1-5 selections', async ({ page }) => {
    // Select one style
    await page.locator('[role="checkbox"]').first().click()

    // Generate button should now be enabled
    const generateBtn = page.getByRole('button', { name: /generate.*pack/i })
    await expect(generateBtn).toBeEnabled()

    // Select all 5 styles
    for (let i = 1; i < 5; i++) {
      await page.locator('[role="checkbox"]').nth(i).click()
    }

    // Button should still be enabled with 5 selections
    await expect(generateBtn).toBeEnabled()
  })

  test('"Generate" button shows estimated time when styles selected', async ({ page }) => {
    // Select 2 styles
    await page.locator('[role="checkbox"]').nth(0).click()
    await page.locator('[role="checkbox"]').nth(1).click()

    // SelectionSummary shows "Est. X min"
    const estimatedTime = page.getByText(/est\.\s*\d+\s*min/i)
    await expect(estimatedTime).toBeVisible()
  })

  test('auth-required pack generation redirects to login with selected styles preserved', async ({ page }) => {
    await page.unroute('**/api/generate/packs')
    await page.route('**/api/generate/packs', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Login required to generate sticker packs',
          code: 'AUTH_REQUIRED',
        }),
      })
    })

    await page.locator('[role="checkbox"]').nth(0).click()
    await page.locator('[role="checkbox"]').nth(1).click()

    await page.getByRole('button', { name: /generate 2 packs/i }).click()
    await expect(page).toHaveURL(/\/login\?next=/)
    await expect(page.getByRole('heading', { name: /sign in to ai stickies/i })).toBeVisible()

    const loginUrl = new URL(page.url())
    const next = loginUrl.searchParams.get('next')
    expect(next).toBe(`/create/styles?generationId=${MOCK_GENERATION_ID}&selected=preview-1,preview-2`)

    await page.goto(next!)
    await expect(page.locator('[role="checkbox"]').nth(0)).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('[role="checkbox"]').nth(1)).toHaveAttribute('aria-checked', 'true')
  })
})

// ==========================================================================
// Pack Configuration
// ==========================================================================

test.describe('Styles Page - Pack Info', () => {
  test('shows step 2 heading', async ({ page }) => {
    await mockSessionApi(page)
    await mockGenerationApi(page)
    await page.goto(`/create/styles?generationId=${MOCK_GENERATION_ID}`)

    await expect(page.getByText(/step 2/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/select your styles/i)).toBeVisible()
  })

  test('shows description about pack contents', async ({ page }) => {
    await mockSessionApi(page)
    await mockGenerationApi(page)
    await page.goto(`/create/styles?generationId=${MOCK_GENERATION_ID}`)

    await expect(page.getByText(/tap to select 1-5 styles/i)).toBeVisible({ timeout: 10000 })
  })
})
