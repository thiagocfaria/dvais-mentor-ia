import { checkKVRateLimit, cleanupMemoryRateLimits } from '../kvRateLimiter'

describe('checkKVRateLimit (fallback em memória)', () => {
  const originalUrl = process.env.KV_REST_API_URL
  const originalToken = process.env.KV_REST_API_TOKEN

  beforeEach(() => {
    process.env.KV_REST_API_URL = ''
    process.env.KV_REST_API_TOKEN = ''
  })

  afterEach(() => {
    process.env.KV_REST_API_URL = originalUrl
    process.env.KV_REST_API_TOKEN = originalToken
  })

  test('bloqueia quando excede o limite', async () => {
    const ip = `rate-limit-${Date.now()}`
    const limit = 2
    const windowSeconds = 60

    const first = await checkKVRateLimit(ip, limit, windowSeconds)
    const second = await checkKVRateLimit(ip, limit, windowSeconds)
    const third = await checkKVRateLimit(ip, limit, windowSeconds)

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfter).toBeGreaterThan(0)
  })

  test('limpa entradas expiradas em memória', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))

    const ip = `rate-limit-expire-${Date.now()}`
    await checkKVRateLimit(ip, 1, 1)

    vi.advanceTimersByTime(2000)
    cleanupMemoryRateLimits()

    const result = await checkKVRateLimit(ip, 1, 1)
    expect(result.allowed).toBe(true)

    vi.useRealTimers()
  })
})
