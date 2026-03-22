import { askFromKnowledgeBase } from '../knowledgeBase'

describe('askFromKnowledgeBase', () => {
  test('retorna elevator_pitch para pergunta sobre o DVAi$', () => {
    const result = askFromKnowledgeBase('o que é o DVAi$?')
    expect(result?.entryId).toBe('elevator_pitch')
  })

  test('retorna cadastro com action de navegação', () => {
    const result = askFromKnowledgeBase('quero fazer cadastro')
    expect(result?.entryId).toBe('cadastro')
    expect(result?.actions?.[0]).toMatchObject({
      type: 'navigateRoute',
      route: '/cadastro',
      targetId: 'cadastro-card',
    })
  })

  test('retorna garantia_lucro para promessas de lucro', () => {
    const result = askFromKnowledgeBase('lucro garantido sem risco')
    expect(result?.entryId).toBe('garantia_lucro')
  })

  test('prioriza cadastro em vez de elevator_pitch para perguntas genericas sobre cadastro', () => {
    const result = askFromKnowledgeBase('como funciona o cadastro?')
    expect(result?.entryId).toBe('cadastro')
  })
})

describe('KB product proposition quality', () => {
  test('elevator_pitch menciona mentor/investimento, nao prototipo tecnico', () => {
    const result = askFromKnowledgeBase('o que é o DVAi$?')
    expect(result).not.toBeNull()
    const allResponses = result!.responses.join(' ')
    expect(allResponses).not.toMatch(/protótipo técnico/)
    expect(allResponses).toMatch(/mentor|investir|investimento/i)
  })

  test('analise_em_tempo_real explica indicadores concretamente', () => {
    const result = askFromKnowledgeBase('análise em tempo real')
    expect(result?.entryId).toBe('analise_em_tempo_real')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/candlestick|volume|indicador|livro de ordens/i)
  })

  test('resultados menciona metricas concretas, nao frases genericas', () => {
    const result = askFromKnowledgeBase('resultados e métricas')
    expect(result?.entryId).toBe('resultados')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).not.toMatch(/comprovam a eficácia/)
    expect(allResponses).toMatch(/análises|alertas|usuários/i)
  })
})

describe('KB novas entradas de produto', () => {
  test('retorna como_funciona_metodo para "como começo a investir"', () => {
    const result = askFromKnowledgeBase('como começo a investir?')
    expect(result?.entryId).toBe('como_funciona_metodo')
  })

  test('retorna o_que_posso_fazer para "o que posso fazer aqui"', () => {
    const result = askFromKnowledgeBase('o que posso fazer aqui?')
    expect(result?.entryId).toBe('o_que_posso_fazer')
  })

  test('retorna assistente_voz para "como usar a voz"', () => {
    const result = askFromKnowledgeBase('como falar com você por voz?')
    expect(result?.entryId).toBe('assistente_voz')
  })

  test('retorna protecao_inteligente para "proteção inteligente"', () => {
    const result = askFromKnowledgeBase('proteção inteligente')
    expect(result?.entryId).toBe('protecao_inteligente')
  })

  test('retorna aprendizado_continuo para "aprendizado contínuo"', () => {
    const result = askFromKnowledgeBase('aprendizado contínuo')
    expect(result?.entryId).toBe('aprendizado_continuo')
  })

  test('saudacao responde com nome Davi', () => {
    const result = askFromKnowledgeBase('oi')
    expect(result?.entryId).toBe('saudacao')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/Davi/i)
  })
})

describe('KB forbidden topics', () => {
  test('bloqueia perguntas sobre futebol', () => {
    const result = askFromKnowledgeBase('quem ganhou o jogo de futebol?')
    expect(result?.entryId).toBe('forbidden')
  })

  test('bloqueia perguntas sobre senha/credenciais', () => {
    const result = askFromKnowledgeBase('qual é a minha senha?')
    expect(result?.entryId).toBe('forbidden')
  })
})
