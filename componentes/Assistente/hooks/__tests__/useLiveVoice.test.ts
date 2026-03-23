import { describe, expect, test } from 'vitest'
import {
  mapSpeechErrorToVoiceIssue,
  shouldAutoSubmitManualTranscript,
  shouldRestartContinuousListening,
} from '../useLiveVoice'

describe('useLiveVoice helpers', () => {
  test('autoenvia transcript final útil no modo manual', () => {
    expect(shouldAutoSubmitManualTranscript({ text: 'olá davi', isFinal: true })).toBe(true)
    expect(shouldAutoSubmitManualTranscript({ text: 'oi', isFinal: true })).toBe(true)
    expect(shouldAutoSubmitManualTranscript({ text: 'olá davi', isFinal: false })).toBe(false)
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

  test('reinicia escuta contínua só quando o encerramento não veio de uma pergunta já enviada', () => {
    expect(
      shouldRestartContinuousListening({
        continuousMode: true,
        isActive: true,
        isThinking: false,
        isTTSSpeaking: false,
        submittedInSession: false,
        endReason: 'ended',
      })
    ).toBe(true)

    expect(
      shouldRestartContinuousListening({
        continuousMode: true,
        isActive: true,
        isThinking: false,
        isTTSSpeaking: false,
        submittedInSession: true,
        endReason: 'ended',
      })
    ).toBe(false)

    expect(
      shouldRestartContinuousListening({
        continuousMode: true,
        isActive: true,
        isThinking: false,
        isTTSSpeaking: false,
        submittedInSession: false,
        endReason: 'manual_stop',
      })
    ).toBe(false)
  })
})
