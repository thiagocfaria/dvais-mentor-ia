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

  test('rodapé exibe a assinatura do autor de forma discreta', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await expect(page.locator('footer')).toContainText(/Desenvolvido por Thiago Caetano Faria/i)
  })

  test('login e cadastro deixam explícito que auth é apenas uma demo de interface', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })
    await expect(page.getByText(/demo de interface/i)).toBeVisible()

    await page.goto('/cadastro', { waitUntil: 'networkidle' })
    await expect(page.getByText(/demo de interface/i)).toBeVisible()
  })

  test('assistente mobile abre direto no chat sem etapa de ativação', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'networkidle' })

    // 1 clique: abre o chat direto
    await page.getByRole('button', { name: /falar com davi/i }).click()

    // Chat já está pronto — sem "Ativar assistente" nem ConsentModal
    await expect(page.getByRole('button', { name: /ativar assistente/i })).toHaveCount(0)
    await expect(page.getByText(/escolha o modo do assistente/i)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /desativar davi/i })).toBeVisible()
    await expect(page.getByText(/sessão por voz|modo degradado em texto|microfone bloqueado/i).first()).toBeVisible()

    // O caminho principal não expõe mais controles manuais antigos
    await expect(page.getByRole('button', { name: /selecionar item/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /tocar para falar/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /ouvir resposta/i })).toHaveCount(0)
  })
})
