import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('Vitrine pública', () => {
  test('menu mobile expande navegação e CTA principal leva à seção de funcionalidades', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const mobileMenuButton = page.getByRole('button', { name: /abrir menu/i })
    await mobileMenuButton.click()

    const mobileNavigation = page.locator('#mobile-navigation')
    await expect(mobileNavigation).toBeVisible()
    await expect(mobileNavigation.getByRole('link', { name: /ver funcionalidades/i })).toBeVisible()

    await page.locator('#hero-content').getByRole('link', { name: /conhecer funcionalidades/i }).click()

    await expect(page.locator('#features')).toBeInViewport()
  })

  test('rodapé não expõe links placeholder', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const placeholderLinks = page.locator('footer a[href="#"]')
    await expect(placeholderLinks).toHaveCount(0)
  })

  test('login e cadastro deixam explícito que auth é apenas uma demo de interface', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })
    await expect(page.getByText(/demo de interface/i)).toBeVisible()

    await page.goto('/cadastro', { waitUntil: 'networkidle' })
    await expect(page.getByText(/demo de interface/i)).toBeVisible()
  })
})
