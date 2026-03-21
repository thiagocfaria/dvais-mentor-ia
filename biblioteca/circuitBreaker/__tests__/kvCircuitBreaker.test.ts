import { checkCircuit, registerFailure } from '../kvCircuitBreaker'

describe('kvCircuitBreaker (fallback em memória)', () => {
  const originalUrl = process.env.KV_REST_API_URL
  const originalToken = process.env.KV_REST_API_TOKEN

  beforeEach(() => {
    process.env.KV_REST_API_URL = ''
    process.env.KV_REST_API_TOKEN = ''
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    process.env.KV_REST_API_URL = originalUrl
    process.env.KV_REST_API_TOKEN = originalToken
  })

  test('abre o circuito após falhas consecutivas', async () => {
    const user = `circuit-${Date.now()}`
    await registerFailure(user)
    await registerFailure(user)
    await registerFailure(user)

    const status = await checkCircuit(user)
    expect(status.allowed).toBe(false)
    expect(status.state).toBe('OPEN')
  })

  test('transiciona para HALF_OPEN após expirar o bloqueio', async () => {
    const user = `circuit-half-${Date.now()}`
    await registerFailure(user)
    await registerFailure(user)
    await registerFailure(user)

    const before = await checkCircuit(user)
    expect(before.state).toBe('OPEN')

    vi.advanceTimersByTime(15 * 60 * 1000 + 1000)
    const after = await checkCircuit(user)
    expect(after.state).toBe('HALF_OPEN')
    expect(after.allowed).toBe(true)
  })
})
