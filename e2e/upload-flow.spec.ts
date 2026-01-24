import { test, expect } from '@playwright/test'

test.describe('Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('landing page shows create button', async ({ page }) => {
    const createBtn = page.getByRole('link', { name: /create/i })
    await expect(createBtn).toBeVisible()
  })

  test('navigates to upload page from landing', async ({ page }) => {
    await page.getByRole('link', { name: /create/i }).click()
    await expect(page).toHaveURL('/create')
  })

  test('shows file upload dropzone on create page', async ({ page }) => {
    await page.goto('/create')
    const dropzone = page.locator('[data-testid="upload-dropzone"]')
      .or(page.getByText(/drag.*drop|upload/i).first())
    await expect(dropzone).toBeVisible()
  })

  test('shows session counter in header', async ({ page }) => {
    await page.goto('/create')
    // Session counter shows remaining generations
    const counter = page.getByText(/\d+\s*\/\s*\d+|remaining/i)
    await expect(counter).toBeVisible()
  })

  test('shows language selector', async ({ page }) => {
    await page.goto('/create')
    // Check for language select or dropdown
    const langSelect = page.getByRole('combobox').first()
      .or(page.getByLabel(/language/i))
    await expect(langSelect).toBeVisible()
  })
})

test.describe('File Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create')
  })

  test('accepts valid image types', async ({ page }) => {
    // Check that accepted file types are shown or documented
    const acceptedTypes = page.getByText(/jpg|jpeg|png|webp/i)
    await expect(acceptedTypes).toBeVisible()
  })

  test('shows max file size limit', async ({ page }) => {
    // Check for 10MB limit indication
    const sizeLimit = page.getByText(/10\s*mb|max.*size/i)
    await expect(sizeLimit).toBeVisible()
  })
})
