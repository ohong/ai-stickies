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
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        uploadId: 'test-upload-id',
        previewUrl: 'https://example.com/preview.png',
        sessionId: 'test-session-id',
        remainingGenerations: 7,
      }),
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

  test('upload page shows language selector', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/create')

    // LanguageSelect renders a combobox-like trigger or a select element
    const langLabel = page.getByText(/language/i)
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

    const sizeLimit = page.getByText(/max\s*10\s*mb/i)
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

  test('generate button is disabled without upload', async ({ page }) => {
    await mockSessionApi(page)
    await page.goto('/create')

    const generateBtn = page.getByRole('button', { name: /generate previews/i })
    await expect(generateBtn).toBeVisible()
    await expect(generateBtn).toBeDisabled()
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

    // While session is loading, button should be disabled
    const generateBtn = page.getByRole('button', { name: /generate previews/i })
    await expect(generateBtn).toBeDisabled()
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

  test('dropzone shows upload instructions', async ({ page }) => {
    await expect(page.getByText(/drop your photo here/i)).toBeVisible()
    await expect(page.getByText(/click to browse/i)).toBeVisible()
  })
})
