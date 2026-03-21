import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })
test.setTimeout(60000)

const disableMotion = async (page: any) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: `
      html { scroll-behavior: auto !important; }
      *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
      body, body * { pointer-events: none !important; }
      .comet-trail, .comet-trail-highlight { display: none !important; }
      [data-testid="assistente-widget"] { display: none !important; }
    `,
  })
}

test.describe('Visual snapshots', () => {
  test('home (above the fold)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/', { waitUntil: 'networkidle' })
    await disableMotion(page)
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('home-desktop.png', {
      fullPage: true,
      timeout: 20000,
    })
  })

  test('login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/login', { waitUntil: 'networkidle' })
    await disableMotion(page)
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('login-desktop.png', {
      fullPage: true,
      timeout: 20000,
    })
  })
})
