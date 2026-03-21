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
    const result = askFromKnowledgeBase('tem garantia de lucro?')
    expect(result?.entryId).toBe('garantia_lucro')
  })
})
