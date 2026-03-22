import { afterEach, describe, expect, test, vi } from 'vitest'

type SpeechSynthesisMock = {
  speak: ReturnType<typeof vi.fn>
  cancel: ReturnType<typeof vi.fn>
  getVoices: ReturnType<typeof vi.fn>
  onvoiceschanged?: (() => void) | null
}

function createSpeechSynthesisMock() {
  const mock: SpeechSynthesisMock = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [{ name: 'pt-BR', lang: 'pt-BR' }]),
    onvoiceschanged: null,
  }

  return mock
}

async function loadModuleWithWindow(windowMock?: Record<string, unknown>) {
  vi.resetModules()
  vi.unstubAllGlobals()
  if (windowMock) {
    vi.stubGlobal('window', windowMock)
  }
  class FakeUtterance {
    text: string
    lang = ''
    rate = 1
    pitch = 1
    voice?: SpeechSynthesisVoice
    onend?: (event: SpeechSynthesisEvent) => void
    onerror?: (event: SpeechSynthesisErrorEvent) => void

    constructor(text: string) {
      this.text = text
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance as unknown as typeof SpeechSynthesisUtterance)
  const module = await import('../textToSpeech')
  module.resetTTSStateForTests()
  return module
}

describe('textToSpeech', () => {
  afterEach(async () => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  test('fala com sucesso via speechSynthesis', async () => {
    const speech = createSpeechSynthesisMock()
    speech.speak.mockImplementation((utterance: SpeechSynthesisUtterance) => {
      utterance.onend?.(new Event('end') as SpeechSynthesisEvent)
    })

    const { speakText } = await loadModuleWithWindow({ speechSynthesis: speech })
    const result = await speakText('Olá mundo', { kind: 'assistant-answer' })

    expect(result).toEqual({ ok: true, via: 'speechSynthesis' })
    expect(speech.speak).toHaveBeenCalledTimes(1)
  })

  test('retorna autoplay_blocked quando a fala é bloqueada', async () => {
    const speech = createSpeechSynthesisMock()
    speech.speak.mockImplementation((utterance: SpeechSynthesisUtterance) => {
      utterance.onerror?.({ error: 'not-allowed' } as SpeechSynthesisErrorEvent)
    })

    const { speakText } = await loadModuleWithWindow({ speechSynthesis: speech })
    const result = await speakText('Olá bloqueado', { kind: 'assistant-answer' })

    expect(result).toEqual({ ok: false, reason: 'autoplay_blocked' })
  })

  test('retorna tts_unavailable quando o navegador não oferece speechSynthesis', async () => {
    const { speakText } = await loadModuleWithWindow({})
    const result = await speakText('Sem suporte', { kind: 'assistant-answer' })

    expect(result).toEqual({ ok: false, reason: 'tts_unavailable' })
  })

  test('não corta resposta principal quando chega uma fala de baixa prioridade', async () => {
    const speech = createSpeechSynthesisMock()
    let currentUtterance: SpeechSynthesisUtterance | null = null
    speech.speak.mockImplementation((utterance: SpeechSynthesisUtterance) => {
      currentUtterance = utterance
    })

    const { speakText } = await loadModuleWithWindow({ speechSynthesis: speech })
    const pending = speakText('Resposta principal', { kind: 'assistant-answer' })
    const interrupted = await speakText('Guia rápido', { kind: 'guide' })

    expect(interrupted).toEqual({ ok: false, reason: 'interrupted' })
    expect(speech.cancel).not.toHaveBeenCalled()

    currentUtterance?.onend?.(new Event('end') as SpeechSynthesisEvent)
    await expect(pending).resolves.toEqual({ ok: true, via: 'speechSynthesis' })
  })

  test('replay manual interrompe a fala anterior e toca a nova', async () => {
    const speech = createSpeechSynthesisMock()
    let utterances: SpeechSynthesisUtterance[] = []
    speech.speak.mockImplementation((utterance: SpeechSynthesisUtterance) => {
      utterances.push(utterance)
      if (utterances.length === 2) {
        utterance.onend?.(new Event('end') as SpeechSynthesisEvent)
      }
    })

    const { speakText } = await loadModuleWithWindow({ speechSynthesis: speech })
    void speakText('Resposta em andamento', { kind: 'assistant-answer' })
    const replay = await speakText('Replay manual', { kind: 'replay', interrupt: true })

    expect(speech.cancel).toHaveBeenCalledTimes(1)
    expect(replay).toEqual({ ok: true, via: 'speechSynthesis' })
  })
})
