import { describe, expect, it } from 'vitest'
import {
  buildConversationHistory,
  buildConversationPayload,
  getVoiceDiagnosticMessage,
  mapTtsResultToVoiceIssue,
} from '../useAssistantAPI'

describe('buildConversationHistory', () => {
  it('envia as ultimas trocas completas em ordem user/assistant', () => {
    const history = [
      {
        question: 'Primeira pergunta',
        answer: 'Primeira resposta',
        timestamp: 1,
      },
      {
        question: 'Segunda pergunta',
        answer: 'Segunda resposta',
        timestamp: 2,
      },
      {
        question: 'Terceira pergunta',
        answer: '',
        timestamp: 3,
      },
    ]

    expect(buildConversationHistory(history)).toEqual([
      { role: 'user', content: 'Primeira pergunta' },
      { role: 'assistant', content: 'Primeira resposta' },
      { role: 'user', content: 'Segunda pergunta' },
      { role: 'assistant', content: 'Segunda resposta' },
      { role: 'user', content: 'Terceira pergunta' },
    ])
  })

  it('prioriza as ultimas tres trocas completas e expõe resumo do último tópico forte', () => {
    const history = [
      {
        question: 'O que é o Davi?',
        answer: 'O Davi guia a navegação da página e explica o produto.',
        timestamp: 1,
      },
      {
        question: 'Como funciona o cadastro?',
        answer:
          'Para se cadastrar, clique em Começar Agora, preencha seus dados e confirme seu email para seguir.',
        timestamp: 2,
      },
      {
        question: 'E depois do cadastro?',
        answer:
          'Depois do cadastro, você pode entrar, navegar pelas áreas públicas e seguir para login.',
        timestamp: 3,
      },
      {
        question: 'Me explica melhor a segurança',
        answer:
          'A área de segurança mostra validação de ações, limites e proteções para tornar a resposta mais previsível.',
        timestamp: 4,
      },
    ]

    const payload = buildConversationPayload(history, 'e como isso funciona?')

    expect(payload.history).toHaveLength(6)
    expect(payload.lastQuestion).toBe('Me explica melhor a segurança')
    expect(payload.lastAnswer).toContain('validação de ações')
    expect(payload.lastTopicHint).toBe('seguranca')
    expect(payload.summary).toContain('seguranca')
    expect(payload.questionLooksIndependent).toBe(false)
  })

  it('marca mudança explícita de assunto para evitar contaminação do histórico', () => {
    const history = [
      {
        question: 'Como funciona o cadastro?',
        answer: 'Clique em Começar Agora e confirme seu email.',
        timestamp: 1,
      },
    ]

    const payload = buildConversationPayload(history, 'mudando de assunto, me explica melhor a segurança')

    expect(payload.questionLooksIndependent).toBe(true)
    expect(payload.lastTopicHint).toBe('cadastro')
  })

  it('mapeia autoplay bloqueado para issue e mensagem úteis', () => {
    const issue = mapTtsResultToVoiceIssue({ ok: false, reason: 'autoplay_blocked' })

    expect(issue).toBe('autoplay_blocked')
    expect(getVoiceDiagnosticMessage(issue)).toMatch(/modo degradado|chat/i)
  })

  it('mapeia TTS indisponível para fallback textual explícito', () => {
    const issue = mapTtsResultToVoiceIssue({ ok: false, reason: 'tts_unavailable' })

    expect(issue).toBe('tts_unavailable')
    expect(getVoiceDiagnosticMessage(issue)).toMatch(/modo texto/i)
  })
})
