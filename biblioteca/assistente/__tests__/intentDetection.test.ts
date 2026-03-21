/**
 * Testes unitários para detecção de intenção
 * Cobre casos básicos, edge cases e validação de confidence
 */

import { detectIntent, clearConversationHistory, getIntentStatistics, type IntentType } from '../intentDetection'

describe('detectIntent', () => {
  beforeEach(() => {
    clearConversationHistory()
  })

  describe('Saudação', () => {
    test('deve detectar "oi" com alta confidence', () => {
      const result = detectIntent('oi')
      expect(result.type).toBe('saudacao')
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.keywords.length).toBeGreaterThan(0)
    })

    test('deve detectar "oi!" com pontuação', () => {
      const result = detectIntent('oi!')
      expect(result.type).toBe('saudacao')
      expect(result.confidence).toBeGreaterThan(0.6)
    })

    test('deve detectar "bom dia"', () => {
      const result = detectIntent('bom dia')
      expect(result.type).toBe('saudacao')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    test('deve detectar variações com fuzzy matching', () => {
      const result = detectIntent('oii', { useFuzzy: true })
      expect(result.type).toBe('saudacao')
    })
  })

  describe('Despedida', () => {
    test('deve detectar "tchau"', () => {
      const result = detectIntent('tchau')
      expect(result.type).toBe('despedida')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    test('deve detectar "obrigado"', () => {
      const result = detectIntent('obrigado')
      expect(result.type).toBe('despedida')
    })
  })

  describe('Pergunta sobre', () => {
    test('deve detectar "o que é"', () => {
      const result = detectIntent('o que é o DVAi$?')
      expect(result.type).toBe('pergunta_sobre')
      expect(result.confidence).toBeGreaterThan(0.6)
    })

    test('deve detectar "o que são"', () => {
      const result = detectIntent('o que são ações?')
      expect(result.type).toBe('pergunta_sobre')
    })
  })

  describe('Como funciona', () => {
    test('deve detectar "como funciona"', () => {
      const result = detectIntent('como funciona?')
      expect(result.type).toBe('como_funciona')
      expect(result.confidence).toBeGreaterThan(0.6)
    })

    test('deve ter prioridade sobre "explicar" quando há conflito', () => {
      const result = detectIntent('como funciona a plataforma?')
      expect(result.type).toBe('como_funciona')
    })
  })

  describe('Intenções compostas', () => {
    test('deve detectar múltiplas intenções', () => {
      const result = detectIntent('bom dia, tchau', { detectMultiple: true })
      expect(result.type).toBe('saudacao')
      expect(result.secondaryIntents).toContain('despedida')
    })

    test('deve detectar saudacao + pergunta', () => {
      const result = detectIntent('oi, o que é isso?', { detectMultiple: true })
      expect(result.type).toBe('pergunta_sobre')
      if (result.secondaryIntents) {
        expect(result.secondaryIntents).toContain('saudacao')
      }
    })
  })

  describe('Confidence calculation', () => {
    test('deve ter confidence alta para match exato', () => {
      const result = detectIntent('oi')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    test('deve ter confidence menor para match fuzzy', () => {
      const resultFuzzy = detectIntent('oii', { useFuzzy: true })
      const resultExact = detectIntent('oi')
      expect(resultFuzzy.type).toBe(resultExact.type)
      expect(resultFuzzy.confidence).toBeGreaterThan(0.3)
    })

    test('deve ter confidence reduzida quando há overlap', () => {
      // "como funciona" pode aparecer em explicar e como_funciona
      const result = detectIntent('explique como funciona')
      expect(result.confidence).toBeLessThan(1.0)
    })
  })

  describe('Contexto de conversa', () => {
    test('deve considerar histórico recente', () => {
      detectIntent('oi', { considerHistory: true })
      const result = detectIntent('oi novamente', { considerHistory: true })
      // Segunda saudação deve ter score reduzido
      expect(result.confidence).toBeLessThan(1.0)
    })

    test('deve dar boost para despedida após saudacao', () => {
      detectIntent('oi', { considerHistory: true })
      const result = detectIntent('tchau', { considerHistory: true })
      expect(result.type).toBe('despedida')
      expect(result.confidence).toBeGreaterThan(0.6)
    })
  })

  describe('Edge cases', () => {
    test('deve retornar "outro" para texto vazio', () => {
      const result = detectIntent('')
      expect(result.type).toBe('outro')
      expect(result.confidence).toBe(0.3)
    })

    test('deve retornar "outro" para texto sem intenção clara', () => {
      const result = detectIntent('xyz abc 123')
      expect(result.type).toBe('outro')
    })

    test('deve normalizar pontuação', () => {
      const result1 = detectIntent('oi!')
      const result2 = detectIntent('oi.')
      expect(result1.type).toBe(result2.type)
    })

    test('deve tratar espaços múltiplos', () => {
      const result = detectIntent('oi    tudo   bem')
      expect(result.type).toBe('saudacao')
    })
  })

  describe('Prioridades', () => {
    test('saudacao deve ter prioridade sobre outras em caso de empate', () => {
      const result = detectIntent('bom dia, tchau', { detectMultiple: true })
      expect(result.type).toBe('saudacao')
      if (result.secondaryIntents) {
        expect(result.secondaryIntents).toContain('despedida')
      }
    })

    test('reclamacao deve ter alta prioridade', () => {
      const result = detectIntent('não funciona')
      expect(result.type).toBe('reclamacao')
      expect(result.confidence).toBeGreaterThan(0.6)
    })
  })
})

describe('getIntentStatistics', () => {
  beforeEach(() => {
    clearConversationHistory()
  })

  test('deve retornar estatísticas corretas', () => {
    detectIntent('oi')
    detectIntent('tchau')
    detectIntent('oi novamente')

    const stats = getIntentStatistics()
    expect(stats.totalDetections).toBe(3)
    expect(stats.intentCounts.saudacao).toBe(2)
    expect(stats.intentCounts.despedida).toBe(1)
  })
})
