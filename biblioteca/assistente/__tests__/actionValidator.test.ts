import { validateActions } from '../actionValidator'

describe('validateActions', () => {
  test('aceita action válida e injeta selector', () => {
    const actions = [{ type: 'scrollToSection', targetId: 'hero-content' }]
    const validated = validateActions(actions, ['hero-content'])
    expect(validated).toHaveLength(1)
    expect(validated[0]).toMatchObject({
      type: 'scrollToSection',
      targetId: 'hero-content',
      selector: '#hero-content',
    })
  })

  test('remove action com rota inválida', () => {
    const actions = [{ type: 'navigateRoute', route: '/rota-invalida' }]
    const validated = validateActions(actions, ['hero-content'])
    expect(validated).toHaveLength(0)
  })

  test('remove action com targetId não permitido', () => {
    const actions = [{ type: 'highlightSection', targetId: 'inexistente' }]
    const validated = validateActions(actions, ['hero-content'])
    expect(validated).toHaveLength(0)
  })
})
