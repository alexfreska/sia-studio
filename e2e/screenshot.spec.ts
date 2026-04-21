import { expect, test } from '@playwright/test'

test('screenshot: connect screen', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(
    page.getByRole('heading', { name: /generate images/i }),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/connect.png',
    fullPage: true,
  })
})
