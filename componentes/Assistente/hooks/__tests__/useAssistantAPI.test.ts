import { describe, expect, it } from 'vitest'
import { buildConversationHistory } from '../useAssistantAPI'

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
})
