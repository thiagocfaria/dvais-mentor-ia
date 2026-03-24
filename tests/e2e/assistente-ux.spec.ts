import { expect, test } from '@playwright/test'

test.describe('Assistente UX simplificada', () => {
  test('abre com 1 clique e entra direto em sessão de voz', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /falar com davi/i }).click()

    await expect(page.getByRole('button', { name: /desativar davi/i })).toBeVisible()

    await expect(page.getByRole('button', { name: /ativar assistente/i })).toHaveCount(0)
    await expect(page.getByText(/escolha o modo do assistente/i)).toHaveCount(0)
    await expect(page.getByText(/como usar/i)).toHaveCount(0)
    await expect(page.getByText(/assistente ativado/i)).toHaveCount(0)
  })

  test('fluxo principal não mostra controles manuais extras', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /falar com davi/i }).click()

    await expect(page.getByRole('button', { name: /selecionar item/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /tocar para falar/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /ouvir resposta/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /enviar/i })).toHaveCount(0)
    await expect(page.getByPlaceholder(/pergunte algo/i)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /guia rápido/i })).toHaveCount(0)
  })

  test('sem microfone disponível o davi cai para modo degradado com mensagem clara', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /falar com davi/i }).click()

    await expect(page.getByText('Modo degradado em texto', { exact: true })).toBeVisible()
    await expect(page.getByPlaceholder(/digite sua pergunta sobre a plataforma/i)).toBeVisible()
  })

  test('ocultar não desliga a sessão e o launcher vira "Desativar Davi"', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /falar com davi/i }).click()
    await expect(page.getByRole('button', { name: /ocultar/i })).toBeVisible()

    await page.getByRole('button', { name: /ocultar/i }).click()

    await expect(page.getByRole('button', { name: /desativar davi/i })).toBeVisible()
    await expect(page.locator('#assistente-live-widget')).toBeHidden()
  })
})
