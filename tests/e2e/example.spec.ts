import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('deve carregar a página inicial', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    // Verificar se o título está presente
    await expect(page).toHaveTitle(/DVAi\$/)
    
    // Verificar se elementos principais estão visíveis
    await expect(page.locator('h1')).toBeVisible()
  })

  test('deve ter navegação funcional', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    // Verificar se links de navegação existem
    const navLinks = page.locator('nav a, header a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('API Health Check', () => {
  test('deve retornar status ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('status')
  })
})
