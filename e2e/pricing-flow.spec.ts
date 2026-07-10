import { test, expect } from '@playwright/test'

test.describe('Pricing Return State', () => {
  test('shows payment success confirmation after Stripe return', async ({ page }) => {
    await page.goto('/pricing?success=true')

    await expect(page.getByRole('heading', { name: /buy credits/i })).toBeVisible()
    await expect(page.getByText(/payment received/i)).toBeVisible()
    await expect(page.getByText(/credits can take a few seconds/i)).toBeVisible()
  })

  test('shows checkout canceled confirmation after Stripe return', async ({ page }) => {
    await page.goto('/pricing?canceled=true')

    await expect(page.getByRole('heading', { name: /buy credits/i })).toBeVisible()
    await expect(page.getByText(/checkout was canceled/i)).toBeVisible()
    await expect(page.getByText(/no credits were purchased/i)).toBeVisible()
  })
})
