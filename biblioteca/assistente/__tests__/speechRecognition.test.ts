import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import {
  startSpeechRecognition,
  stopSpeechRecognition,
} from '../speechRecognition'

class FakeRecognition {
  lang = ''
  continuous = false
  interimResults = false
  onstart?: () => void
  onresult?: (event: any) => void
  onerror?: (event: any) => void
  onend?: () => void

  static lastInstance: FakeRecognition | null = null

  start() {
    FakeRecognition.lastInstance = this
    this.onstart?.()
  }

  stop() {
    this.onend?.()
  }
}

function mockWindow() {
  vi.stubGlobal('window', { SpeechRecognition: FakeRecognition })
}

function mockNavigator(impl: () => Promise<any>) {
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: impl } })
}

describe('speechRecognition (mock)', () => {
  beforeEach(() => {
    FakeRecognition.lastInstance = null
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    stopSpeechRecognition()
  })

  test('retorna erro quando SpeechRecognition nao existe', async () => {
    vi.stubGlobal('window', {})

    const onError = vi.fn()
    await startSpeechRecognition({ onError })

    expect(onError).toHaveBeenCalled()
  })

  test('retorna erro quando permissao e negada', async () => {
    mockWindow()
    mockNavigator(() =>
      Promise.reject({ name: 'NotAllowedError', message: 'denied' })
    )

    const onError = vi.fn()
    await startSpeechRecognition({ onError })

    expect(onError).toHaveBeenCalled()
  })

  test('emite onStart e onResult no fluxo basico', async () => {
    mockWindow()
    mockNavigator(() =>
      Promise.resolve({ getTracks: () => [{ stop: vi.fn() }] })
    )

    const onStart = vi.fn()
    const onResult = vi.fn()

    const cleanup = await startSpeechRecognition({ onStart, onResult })
    const instance = FakeRecognition.lastInstance

    expect(onStart).toHaveBeenCalled()
    expect(instance).not.toBeNull()

    instance?.onresult?.({
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'olá davi', confidence: 0.9 },
          isFinal: true,
        },
      ],
    })

    expect(onResult).toHaveBeenCalled()
    cleanup()
  })
})
