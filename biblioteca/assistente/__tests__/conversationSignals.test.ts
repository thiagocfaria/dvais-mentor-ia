import {
  inferTopicHintFromText,
  isContinuationQuestion,
  questionLooksIndependent,
} from '../conversationSignals'

describe('conversationSignals', () => {
  test('separa login de cadastro ao inferir o tópico principal', () => {
    expect(inferTopicHintFromText('como funciona o cadastro?')).toBe('cadastro')
    expect(inferTopicHintFromText('como funciona o login?')).toBe('login')
  })

  test('mantém follow-up curto como continuação quando existe tópico de login', () => {
    expect(isContinuationQuestion('e depois disso?')).toBe(true)
    expect(questionLooksIndependent('e depois disso?', 'login')).toBe(false)
  })

  test('marca mudança explícita de assunto mesmo saindo de login', () => {
    expect(questionLooksIndependent('mudando de assunto, me explica a segurança', 'login')).toBe(
      true
    )
  })
})
