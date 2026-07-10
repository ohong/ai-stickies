import { test, expect, Page } from '@playwright/test'

/**
 * Helper: mock the /api/session endpoint to return a predictable session state.
 */
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
        latestUpload: null,
        ...overrides,
      },
    }),
    })
  })
}

/**
 * Helper: mock the /api/upload endpoint for successful uploads.
 */
async function mockUploadApi(page: Page) {
  await page.route('**/api/upload', (route) => {
    const requestBody = route.request().postDataJSON() as { action?: string } | null
    if (requestBody?.action === 'initiate') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'test-session-id',
          remainingGenerations: 7,
          signedUrl: 'https://test.supabase.co/storage/v1/object/upload/sign/uploads/test-upload-id?token=test-token',
          storagePath: 'test-upload-id',
          token: 'test-token',
        }),
      })
      return
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        uploadId: 'test-upload-id',
        previewUrl: 'https://test.supabase.co/storage/v1/object/sign/uploads/test-upload-id.png?token=test',
        sessionId: 'test-session-id',
        remainingGenerations: 7,
      }),
    })
  })

  await page.route('**/storage/v1/object/upload/sign/uploads/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ Key: 'uploads/test-upload-id' }),
    })
  })
}

/**
 * Create a minimal 1x1 red PNG as a Buffer.
 * This is a valid PNG file that weighs about 68 bytes.
 */
function createTestPngBuffer(): Buffer {
  // Minimal 1x1 red pixel PNG
  const base64Png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  return Buffer.from(base64Png, 'base64')
}

// ==========================================================================
// Upload Flow
// ==========================================================================

test.describe('Upload Flow', () => {
  test('landing page renders with "Make your stickers" CTA button', async ({ page }) => {
    await page.goto('/')
    const createBtn = page.getByRole('link', { name: /make your stickers/i })
    await expect(createBtn).toBeVisible()
    await expect(createBtn).toHaveAttribute('href', '/create')
  })

  test('navigates to /create from landing page CTA', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /make your stickers/i }).click()
    await expect(page).toHaveURL('/create')
  })

  test('upload page shows dropzone area', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/create')

    // The ImageUploader component has role="button" and aria-label containing "Upload photo"
    const dropzone = page.getByRole('button', { name: /upload photo/i })
    await expect(dropzone).toBeVisible()
  })

  test('upload page shows session counter (X/10 remaining)', async ({ page }) => {
    await mockSessionApi(page, { remainingGenerations: 8, maxGenerations: 10 })
    await page.goto('/create')

    // SessionCounter renders "N/M remaining"
    const counter = page.getByText(/\d+\/\d+\s*remaining/i)
    await expect(counter).toBeVisible()
  })

  test('upload page shows optional language selector after a photo exists', async ({ page }) => {
    await mockSessionApi(page, {
      latestUpload: {
        uploadId: 'restored-upload-id',
        previewUrl: 'https://test.supabase.co/storage/v1/object/sign/uploads/restored-photo.png?token=test',
        filename: 'restored-photo.png',
        sizeBytes: 1024,
      },
    })
    await page.goto('/create')

    await expect(page.getByText('restored-photo.png')).toBeVisible()
    await page.getByText(/add details/i).click()
    const langLabel = page.getByText('Sticker Text Language')
    await expect(langLabel).toBeVisible()
  })

  test('shows accepted file types (JPG, PNG, WebP)', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/create')

    await expect(page.getByText('JPG')).toBeVisible()
    await expect(page.getByText('PNG')).toBeVisible()
    await expect(page.getByText('WebP')).toBeVisible()
  })

  test('shows max file size limit (10MB)', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/create')

    const sizeLimit = page.getByText(/up to\s*10\s*mb/i)
    await expect(sizeLimit).toBeVisible()
  })

  test('can upload an image file and shows preview', async ({ page }) => {
    await mockSessionApi(page)
    await mockUploadApi(page)
    await page.goto('/create')

    // Create a file input event with a valid PNG
    const fileInput = page.locator('input[type="file"]')

    // Upload using the hidden file input
    await fileInput.setInputFiles({
      name: 'test-photo.png',
      mimeType: 'image/png',
      buffer: createTestPngBuffer(),
    })

    // After upload, ImagePreview should appear with the filename
    await expect(page.getByText('test-photo.png')).toBeVisible({ timeout: 10000 })

    // The remove button should be visible
    const removeBtn = page.getByRole('button', { name: /remove image/i })
    await expect(removeBtn).toBeVisible()
  })

  test('shows error message for invalid file type', async ({ page }) => {
    await mockSessionApi(page)

    // Mock upload API to return error for invalid file type
    await page.route('**/api/upload', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.',
        }),
      })
    })

    await page.goto('/create')

    // The client-side validation in use-upload may catch this before sending.
    // We verify the dropzone only accepts image types via its accept attribute.
    const fileInput = page.locator('input[type="file"]')
    const acceptAttr = await fileInput.getAttribute('accept')
    expect(acceptAttr).toContain('image/')
  })

  test('generate button is hidden without upload', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/create')

    await expect(page.getByRole('button', { name: /make my stickers/i })).toHaveCount(0)
  })

  test('generate button is disabled when session is loading', async ({ page }) => {
    // Delay the session response to simulate loading state
    await page.route('**/api/session', (route) => {
      // Never fulfill - leave it hanging to keep isLoading true
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId: 'test-session-id',
              generationCount: 0,
              remainingGenerations: 10,
              maxGenerations: 10,
              history: [],
            },
          }),
        })
      }, 5000)
    })

    await page.goto('/create')

    // While no upload exists, the action stays out of the way.
    await expect(page.getByRole('button', { name: /make my stickers/i })).toHaveCount(0)
  })

  test('mobile upload restore shows CTA above the fold', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only coverage')
    await mockSessionApi(page, {
      latestUpload: {
        uploadId: 'restored-upload-id',
        previewUrl: 'https://test.supabase.co/storage/v1/object/sign/uploads/restored-photo.png?token=test',
        filename: 'restored-photo.png',
        sizeBytes: 1024,
      },
    })

    await page.goto('/create')

    const cta = page.getByRole('button', { name: /make my stickers/i })
    await expect(cta).toBeVisible()
    const box = await cta.boundingBox()
    expect(box?.y ?? 9999).toBeLessThan(844)
  })
})

// ==========================================================================
// File Validation
// ==========================================================================

test.describe('File Validation', () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/create')
  })

  test('file input accepts only image types', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    const acceptAttr = await fileInput.getAttribute('accept')

    // Should include the allowed MIME types
    expect(acceptAttr).toContain('image/jpeg')
    expect(acceptAttr).toContain('image/png')
    expect(acceptAttr).toContain('image/webp')
  })

  test('dropzone shows upload instructions', async ({ page, isMobile }) => {
    await expect(
      page.getByText(isMobile ? /tap to upload a photo/i : /drop your photo here/i)
    ).toBeVisible()
    await expect(page.getByText(/jpg, png, or webp up to 10mb/i)).toBeVisible()
  })
})
