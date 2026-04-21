import { expect, test } from '@playwright/test'

test('app loads without console errors', async ({ page }) => {
  const errors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  page.on('pageerror', (err) => {
    errors.push(err.message)
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  expect(errors).toEqual([])
})

test('connect screen shows the hero in dark theme', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await expect(
    page.getByRole('heading', { name: /generate images/i }),
  ).toBeVisible()
  await expect(page.getByPlaceholder('https://sia.storage')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connect' })).toBeVisible()

  const bg = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  )
  expect(bg).toBe('rgb(10, 11, 13)')
})
