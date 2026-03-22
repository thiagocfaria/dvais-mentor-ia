import { describe, expect, test } from 'vitest'
import {
  shouldAutoSubmitManualTranscript,
  shouldRestartContinuousListening,
} from '../useLiveVoice'

describe('useLiveVoice helpers', () => {
  test('autoenvia transcript final útil no modo manual', () => {
    expect(shouldAutoSubmitManualTranscript({ text: 'olá davi', isFinal: true })).toBe(true)
    expect(shouldAutoSubmitManualTranscript({ text: 'oi', isFinal: true })).toBe(false)
    expect(shouldAutoSubmitManualTranscript({ text: 'olá davi', isFinal: false })).toBe(false)
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
