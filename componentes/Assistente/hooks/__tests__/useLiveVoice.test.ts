import { describe, expect, test } from 'vitest'
import {
  createVoiceSessionState,
  mapSpeechErrorToVoiceIssue,
  shouldResumeVoiceSession,
} from '../useLiveVoice'

describe('useLiveVoice helpers', () => {
  test('cria sessão de voz ativa já ouvindo ao ligar o Davi', () => {
    expect(createVoiceSessionState({ active: true, hidden: false, degradedText: false })).toBe(
      'listening'
    )
    expect(createVoiceSessionState({ active: true, hidden: true, degradedText: false })).toBe(
      'hidden'
    )
    expect(createVoiceSessionState({ active: true, hidden: false, degradedText: true })).toBe(
      'degraded_text'
    )
    expect(createVoiceSessionState({ active: false, hidden: false, degradedText: false })).toBe(
      'off'
    )
  })

  test('mapeia erros de STT para issues de voz visíveis na UI', () => {
    expect(
      mapSpeechErrorToVoiceIssue({
        code: 'mic_permission_denied',
        message: 'Permissão negada',
      })
    ).toBe('mic_denied')
    expect(
      mapSpeechErrorToVoiceIssue({
        code: 'speech_not_supported',
        message: 'Sem suporte',
      })
    ).toBe('speech_not_supported')
  })

  test('retoma a sessão de voz automaticamente quando o Davi continua ligado', () => {
    expect(
      shouldResumeVoiceSession({
        sessionActive: true,
        uiHidden: false,
        degradedText: false,
        isThinking: false,
        isTTSSpeaking: false,
        documentVisible: true,
        speechAvailable: true,
      })
    ).toBe(true)

    expect(
      shouldResumeVoiceSession({
        sessionActive: true,
        uiHidden: false,
        degradedText: true,
        isThinking: false,
        isTTSSpeaking: false,
        documentVisible: true,
        speechAvailable: true,
      })
    ).toBe(false)

    expect(
      shouldResumeVoiceSession({
        sessionActive: true,
        uiHidden: true,
        degradedText: false,
        isThinking: false,
        isTTSSpeaking: false,
        documentVisible: false,
        speechAvailable: true,
      })
    ).toBe(false)

    expect(
      shouldResumeVoiceSession({
        sessionActive: false,
        uiHidden: false,
        degradedText: false,
        isThinking: false,
        isTTSSpeaking: false,
        documentVisible: true,
        speechAvailable: true,
      })
    ).toBe(false)
  })
})
