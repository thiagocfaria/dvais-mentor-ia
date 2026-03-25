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
      ;(window as Window & { __voiceReady?: () => boolean }).__voiceReady = () => {
        return Boolean((FakeRecognition as typeof FakeRecognition & { lastInstance?: any }).lastInstance)
      }
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
  test('ao ligar o Davi ele já entra ouvindo e responde por voz', async ({ page }) => {
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
    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __voiceReady?: () => boolean }).__voiceReady?.() ?? false))
      .toBe(true)
    await page.evaluate(() => (window as Window & { __emitSpeech?: (text: string) => void }).__emitSpeech?.('como funciona o cadastro?'))

    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            ((window as Window & { __speechCalls?: Array<{ text?: string; type: string }> }).__speechCalls ?? []).some(
              call => call.type === 'speak' && /resposta falada do assistente/i.test(call.text ?? '')
            )
        )
      )
      .toBe(true)
    await expect(page.getByText(/resposta falada do assistente/i)).toBeVisible()
  })

  test('depois de responder ele volta a ouvir sem clique extra', async ({ page }) => {
    await installVoiceStubs(page, 'success')
    let callCount = 0
    await page.route('**/api/assistente/perguntar', async route => {
      callCount += 1
      await route.fulfill({
        json: {
          spokenText:
            callCount === 1
              ? 'Entendi sua primeira pergunta.'
              : 'Entendi sua segunda pergunta.',
          actions: [],
          confidence: 0.9,
          mode: 'normal',
        },
      })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /falar com davi/i }).click()
    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __voiceReady?: () => boolean }).__voiceReady?.() ?? false))
      .toBe(true)
    await page.evaluate(() => (window as Window & { __emitSpeech?: (text: string) => void }).__emitSpeech?.('como funciona o login'))

    await expect(page.getByText(/entendi sua primeira pergunta/i)).toBeVisible()
    await expect(page.getByText(/^pode falar$/i)).toBeVisible()

    await page.evaluate(() => (window as Window & { __emitSpeech?: (text: string) => void }).__emitSpeech?.('e depois disso'))
    await expect(page.getByText(/entendi sua segunda pergunta/i)).toBeVisible()
  })

  test('em autoplay bloqueado cai para modo degradado e mostra fallback textual', async ({ page }) => {
    await installVoiceStubs(page, 'blocked')
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
    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __voiceReady?: () => boolean }).__voiceReady?.() ?? false))
      .toBe(true)
    await page.evaluate(() => (window as Window & { __emitSpeech?: (text: string) => void }).__emitSpeech?.('teste de voz'))

    await expect(page.getByText(/o navegador bloqueou o áudio automático/i).first()).toBeVisible()
    await expect(page.getByPlaceholder(/digite sua pergunta|escreva sua pergunta|pergunte algo/i)).toBeVisible()
  })

  test('ocultar mantém a sessão ativa e desativar davi encerra a captura', async ({ page }) => {
    await installVoiceStubs(page, 'success')
    await page.route('**/api/assistente/perguntar', async route => {
      await route.fulfill({
        json: {
          spokenText: 'Sessão ainda ativa.',
          actions: [],
          confidence: 0.9,
          mode: 'normal',
        },
      })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /falar com davi/i }).click()
    await page.getByRole('button', { name: /ocultar/i }).click()
    await expect(page.getByRole('button', { name: /desativar davi/i })).toBeVisible()

    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __voiceReady?: () => boolean }).__voiceReady?.() ?? false))
      .toBe(true)
    await page.evaluate(() => (window as Window & { __emitSpeech?: (text: string) => void }).__emitSpeech?.('como funciona o cadastro'))
    await page.getByRole('button', { name: /desativar davi/i }).click()

    await expect(page.getByRole('button', { name: /falar com davi/i })).toBeVisible()
    await expect(page.getByText(/sessão ainda ativa/i)).toHaveCount(0)
  })
})
