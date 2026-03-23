import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

async function installVoiceStubs(page: Page, mode: 'success' | 'blocked' | 'unavailable' | 'first-block-then-play') {
  await page.addInitScript(
    ({ mode }) => {
      class FakeRecognition {
        lang = ''
        continuous = false
        interimResults = false
        onstart = null
        onresult = null
        onerror = null
        onend = null
        static lastInstance = null

        start() {
          FakeRecognition.lastInstance = this
          this.onstart?.()
        }

        stop() {
          this.onend?.()
        }
      }

      const speechCalls: Array<{ text?: string; type: string }> = []
      let callCount = 0

      Object.defineProperty(window, 'SpeechRecognition', {
        configurable: true,
        value: FakeRecognition,
      })

      Object.defineProperty(window, 'webkitSpeechRecognition', {
        configurable: true,
        value: FakeRecognition,
      })

      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => ({
            getTracks: () => [{ stop() {} }],
          }),
        },
      })

      if (mode !== 'unavailable') {
        const synth: any =
          'speechSynthesis' in window && window.speechSynthesis
            ? window.speechSynthesis
            : {
                speaking: false,
                pending: false,
                onvoiceschanged: null,
              }

        synth.getVoices = () => []
        synth.cancel = () => {
          speechCalls.push({ type: 'cancel' })
        }
        synth.speak = (utterance: SpeechSynthesisUtterance) => {
          callCount += 1
          speechCalls.push({ type: 'speak', text: utterance.text })
          if (mode === 'blocked' || (mode === 'first-block-then-play' && callCount === 1)) {
            utterance.onerror?.({ error: 'not-allowed' })
            return
          }
          setTimeout(() => utterance.onend?.(new Event('end')), 180)
        }

        Object.defineProperty(window, 'speechSynthesis', {
          configurable: true,
          get: () => synth,
        })
      }

      ;(window as Window & { __speechCalls?: typeof speechCalls }).__speechCalls = speechCalls
      ;(window as Window & { __emitSpeech?: (text: string) => void }).__emitSpeech = (text: string) => {
        const instance = (FakeRecognition as typeof FakeRecognition & { lastInstance?: any }).lastInstance
        if (!instance) return
        instance.onresult?.({
          resultIndex: 0,
          results: [
            {
              0: { transcript: text, confidence: 0.93 },
              isFinal: true,
            },
          ],
        })
        instance.onend?.()
      }
    },
    { mode }
  )
}

test.describe('Pipeline de voz', () => {
  test('pergunta por texto recebe resposta em voz', async ({ page }) => {
    await installVoiceStubs(page, 'success')
    await page.route('**/api/assistente/perguntar', async route => {
      await route.fulfill({
        json: {
          spokenText: 'Resposta falada do assistente.',
          actions: [],
          confidence: 0.9,
          mode: 'normal',
        },
      })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /falar com davi/i }).click()
    await page.getByPlaceholder(/pergunte algo/i).fill('como funciona o cadastro?')
    await page.getByRole('button', { name: /enviar/i }).click()

    await expect(page.getByText(/o assistente está falando/i)).toBeVisible()
    await expect(page.getByText(/resposta falada do assistente/i)).toBeVisible()
  })

  test('pergunta por voz em push-to-talk autoenvia e recebe resposta em voz', async ({ page }) => {
    await installVoiceStubs(page, 'success')
    await page.route('**/api/assistente/perguntar', async route => {
      await route.fulfill({
        json: {
          spokenText: 'Entendi sua pergunta e respondi por voz.',
          actions: [],
          confidence: 0.9,
          mode: 'normal',
        },
      })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /falar com davi/i }).click()
    await page.getByRole('button', { name: /tocar para falar/i }).click()
    await page.evaluate(() => (window as Window & { __emitSpeech?: (text: string) => void }).__emitSpeech?.('como funciona o login'))

    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            ((window as Window & { __speechCalls?: Array<{ text?: string; type: string }> }).__speechCalls ?? []).some(
              call => call.type === 'speak' && /entendi sua pergunta e respondi por voz/i.test(call.text ?? '')
            )
        )
      )
      .toBe(true)
    await expect(page.getByText(/entendi sua pergunta e respondi por voz/i)).toBeVisible()
  })

  test('explica quando autoplay bloqueia o áudio e permite replay manual', async ({ page }) => {
    await installVoiceStubs(page, 'first-block-then-play')
    await page.route('**/api/assistente/perguntar', async route => {
      await route.fulfill({
        json: {
          spokenText: 'Resposta com autoplay bloqueado.',
          actions: [],
          confidence: 0.9,
          mode: 'normal',
        },
      })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /falar com davi/i }).click()
    await page.getByPlaceholder(/pergunte algo/i).fill('teste de voz')
    await page.getByRole('button', { name: /enviar/i }).click()

    await expect(page.getByRole('button', { name: /ouvir resposta/i })).toBeVisible()
    await expect(page.getByText(/não liberou áudio automático/i)).toBeVisible()

    const beforeReplayCalls = await page.evaluate(
      () => ((window as Window & { __speechCalls?: Array<{ text?: string; type: string }> }).__speechCalls ?? []).length
    )
    await page.getByRole('button', { name: /ouvir resposta/i }).click()
    await expect
      .poll(
        async () =>
          page.evaluate(
            () => ((window as Window & { __speechCalls?: Array<{ text?: string; type: string }> }).__speechCalls ?? []).length
          )
      )
      .toBeGreaterThan(beforeReplayCalls)
  })

  test('mantém fluxo previsível no mobile com tocar para falar e fallback textual', async ({ page }) => {
    await installVoiceStubs(page, 'success')
    await page.route('**/api/assistente/perguntar', async route => {
      await route.fulfill({
        json: {
          spokenText: 'Resposta em voz no mobile.',
          actions: [],
          confidence: 0.9,
          mode: 'normal',
        },
      })
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /falar com davi/i }).click()
    await expect(page.getByRole('button', { name: /tocar para falar/i })).toBeVisible()
    await page.getByRole('button', { name: /tocar para falar/i }).click()
    await page.evaluate(() => (window as Window & { __emitSpeech?: (text: string) => void }).__emitSpeech?.('como funciona o cadastro'))

    await expect(page.getByText(/o assistente está falando/i)).toBeVisible()
    await expect(page.getByText(/resposta em voz no mobile/i)).toBeVisible()
    await expect(page.getByPlaceholder(/pergunte algo/i)).toBeVisible()
  })
})
