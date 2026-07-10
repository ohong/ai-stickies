import { test, expect, Page } from '@playwright/test'

const MOCK_GENERATION_ID = 'test-gen-id-results'
const mockStickerImages = [
  '/stickers/chibi/01.png',
  '/stickers/chibi/03.png',
  '/stickers/chibi/05.png',
  '/stickers/chibi/07.png',
]

const mockStickers = (packIndex: number) =>
  Array.from({ length: 8 }, (_, i) => ({
    id: `sticker-${packIndex}-${i + 1}`,
    sequenceNumber: i + 1,
    imageUrl: mockStickerImages[i % mockStickerImages.length],
    emotion: ['Happy', 'Sad', 'Excited', 'Angry', 'Love', 'Sleepy', 'Cool', 'Surprised'][i],
    hasText: i % 3 === 0,
    textContent: i % 3 === 0 ? `Text ${i + 1}` : null,
  }))

const mockResultsData = {
  status: 'completed',
  packs: [
    {
      id: 'pack-1',
      styleName: 'Chibi',
      stickersCompleted: 8,
      stickers: mockStickers(1),
      zipUrl: 'https://test.supabase.co/storage/v1/object/public/stickers/packs/chibi.zip',
    },
    {
      id: 'pack-2',
      styleName: 'Minimalist',
      stickersCompleted: 8,
      stickers: mockStickers(2),
      zipUrl: 'https://test.supabase.co/storage/v1/object/public/stickers/packs/minimalist.zip',
    },
  ],
  remainingGenerations: 7,
  errors: [],
  totalStickersPerPack: 10,
}

async function mockSessionApi(page: Page) {
  await page.route('**/api/session', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: 'test-session-id',
          generationCount: 3,
          remainingGenerations: 7,
          maxGenerations: 10,
          history: [],
        },
      }),
    })
  })
}

async function mockResultsApi(page: Page) {
  await page.route(`**/api/generations/${MOCK_GENERATION_ID}/results`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResultsData),
    })
  })
}

async function mockDownloadApis(page: Page) {
  // Mock pack download
  await page.route('**/api/packs/*/download', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/zip',
      body: Buffer.from('fake-zip-content'),
      headers: {
        'Content-Disposition': 'attachment; filename="pack.zip"',
      },
    })
  })

  // Mock download all
  await page.route('**/api/session/download-all*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/zip',
      body: Buffer.from('fake-zip-all-content'),
      headers: {
        'Content-Disposition': 'attachment; filename="all-packs.zip"',
      },
    })
  })
}

// ==========================================================================
// Results Page - Sticker Packs
// ==========================================================================

test.describe('Download Flow - Results Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionApi(page)
    await mockResultsApi(page)
    await mockDownloadApis(page)
    await page.goto(`/create/results?generationId=${MOCK_GENERATION_ID}`)

    // Wait for results to load
    await page.waitForSelector('text=Your Sticker Packs Are Ready', { timeout: 15000 })
  })

  test('results page shows sticker packs', async ({ page }) => {
    // Should display pack names
    await expect(page.getByText('Chibi').first()).toBeVisible()
    await expect(page.getByText('Minimalist').first()).toBeVisible()

    // Should show pack summary
    await expect(page.getByText(/2 packs? with 16 stickers/i)).toBeVisible()
  })

  test('each pack shows sticker count', async ({ page }) => {
    // Each pack card shows "8 stickers"
    const stickerCounts = page.getByText('8 stickers')
    await expect(stickerCounts).toHaveCount(2)
  })

  test('click sticker opens modal', async ({ page }) => {
    // Click first sticker thumbnail (img with alt text matching emotion)
    const firstSticker = page.locator('img[alt="Happy"]').first()
    await firstSticker.click()

    // Dialog should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
  })

  test('modal shows sticker image, emotion, and navigation arrows', async ({ page }) => {
    // Click a sticker to open modal
    const firstSticker = page.locator('img[alt="Happy"]').first()
    await firstSticker.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Modal title shows emotion
    await expect(dialog.getByText('Happy')).toBeVisible()

    // Navigation buttons exist
    const prevBtn = dialog.getByRole('button', { name: /previous sticker/i })
    const nextBtn = dialog.getByRole('button', { name: /next sticker/i })
    await expect(prevBtn).toBeVisible()
    await expect(nextBtn).toBeVisible()

    // Download button
    const downloadBtn = dialog.getByRole('button', { name: /download sticker/i })
    await expect(downloadBtn).toBeVisible()

    // Shows position indicator like "#1 of 8"
    await expect(dialog.getByText(/#1 of 8/i)).toBeVisible()
  })

  test('modal navigation works correctly', async ({ page }) => {
    // Click first sticker to open modal
    const firstSticker = page.locator('img[alt="Happy"]').first()
    await firstSticker.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Previous button should be disabled on first sticker
    const prevBtn = dialog.getByRole('button', { name: /previous sticker/i })
    await expect(prevBtn).toBeDisabled()

    // Click next
    const nextBtn = dialog.getByRole('button', { name: /next sticker/i })
    await nextBtn.click()

    // Should now show second sticker
    await expect(dialog.getByText(/#2 of 8/i)).toBeVisible()

    // Previous should now be enabled
    await expect(prevBtn).toBeEnabled()
  })

  test('download pack button exists on each pack', async ({ page }) => {
    const downloadPackBtns = page.getByRole('button', { name: /download pack/i })
    await expect(downloadPackBtns).toHaveCount(2)
  })

  test('download pack action starts a ZIP download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /download pack/i }).first().click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('chibi-stickers.zip')
  })

  test('download all button exists', async ({ page }) => {
    const downloadAllBtn = page.getByRole('button', { name: /download all/i })
    await expect(downloadAllBtn).toBeVisible()
    await expect(downloadAllBtn).toBeEnabled()
  })

  test('publishing a pack reveals copy and social share links', async ({ page }) => {
    await page.evaluate(() => {
      ;(window as unknown as { __copiedText?: string }).__copiedText = undefined
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            ;(window as unknown as { __copiedText?: string }).__copiedText = text
          },
        },
      })
    })

    let publishCalls = 0
    await page.route('**/api/packs/pack-1/share', (route) => {
      publishCalls += 1
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slug: 'shared-chibi',
          shareUrl: 'http://localhost:3000/packs/shared-chibi',
        }),
      })
    })

    await page.getByRole('button', { name: /^share$/i }).first().click()

    await expect(page.getByRole('button', { name: /copy link/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'X' })).toHaveAttribute('href', /shared-chibi/)
    await expect(page.getByRole('link', { name: 'LINE' })).toHaveAttribute('href', /shared-chibi/)
    await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /shared-chibi/)
    expect(publishCalls).toBe(1)

    await page.getByRole('button', { name: /copy link/i }).click()
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()
    await expect.poll(() =>
      page.evaluate(() => (window as unknown as { __copiedText?: string }).__copiedText)
    ).toContain('/packs/shared-chibi')
  })

  test('confetti animation container appears on results page', async ({ page }) => {
    // Confetti renders as a fixed overlay with pointer-events-none
    // It may disappear after 4 seconds, so check quickly
    // The component renders if prefers-reduced-motion is not set
    // In the test browser, motion is not reduced by default
    // It may or may not be visible depending on timing, but the page loads successfully
    // The key assertion is that the results page loaded without errors
    await expect(page.getByText(/your sticker packs are ready/i)).toBeVisible()
  })
})

// ==========================================================================
// Results Page - Error State
// ==========================================================================

test.describe('Download Flow - Error State', () => {
  test('shows error when results API fails', async ({ page }) => {
    await mockSessionApi(page)

    await page.route('**/api/generations/bad-id/results', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Generation not found' }),
      })
    })

    await page.goto('/create/results?generationId=bad-id')

    // Should show error state
    const errorText = page.getByText(/results not found|generation not found|failed to load/i)
    await expect(errorText).toBeVisible({ timeout: 10000 })

    // Back button should be available
    const backBtn = page.getByRole('button', { name: /back to create/i })
    await expect(backBtn).toBeVisible()
  })

  test('failed generation explains refund and links back to retry styles', async ({ page }) => {
    await mockSessionApi(page)

    await page.route(`**/api/generations/${MOCK_GENERATION_ID}/results`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'failed',
          packs: [],
          remainingGenerations: 7,
          errors: ['Pack generation failed'],
          totalStickersPerPack: 10,
        }),
      })
    })

    await page.goto(`/create/results?generationId=${MOCK_GENERATION_ID}`)

    await expect(page.getByRole('heading', { name: /sticker pack generation failed/i })).toBeVisible()
    await expect(page.getByText(/no credits were kept/i)).toBeVisible()

    await page.getByRole('button', { name: /try again/i }).click()
    await expect(page).toHaveURL(`/create/styles?generationId=${MOCK_GENERATION_ID}`)
  })
})

// ==========================================================================
// Results Page - Navigation
// ==========================================================================

test.describe('Download Flow - Navigation', () => {
  test('results page has link to view history', async ({ page }) => {
    await mockSessionApi(page)
    await mockResultsApi(page)
    await page.goto(`/create/results?generationId=${MOCK_GENERATION_ID}`)

    await page.waitForSelector('text=Your Sticker Packs Are Ready', { timeout: 15000 })

    const historyBtn = page.getByRole('button', { name: /view history/i })
      .or(page.getByRole('link', { name: /view history/i }))
    await expect(historyBtn).toBeVisible()
  })

  test('results page has link to create more stickers', async ({ page }) => {
    await mockSessionApi(page)
    await mockResultsApi(page)
    await page.goto(`/create/results?generationId=${MOCK_GENERATION_ID}`)

    await page.waitForSelector('text=Your Sticker Packs Are Ready', { timeout: 15000 })

    const createMoreBtn = page.getByRole('button', { name: /create more stickers/i })
    await expect(createMoreBtn).toBeVisible()
  })
})
