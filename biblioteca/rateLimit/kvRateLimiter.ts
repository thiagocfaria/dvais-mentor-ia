/**
 * Rate Limiting com Vercel KV (Redis)
 * 
 * Implementa rate limiting persistente usando Vercel KV com fallback automático
 * para rate limiting em memória. Sistema nunca quebra mesmo se KV falhar.
 * 
 * Estratégia:
 * - Tentar KV primeiro (compartilhado entre instâncias)
 * - Se KV falhar/não configurado → fallback para memória
 * - Ambos funcionam simultaneamente quando possível
 */

import { kv } from '@vercel/kv'
import { logOps } from '@/biblioteca/logs/logOps'

const RATE_LIMIT_PREFIX = 'ratelimit:'
const KV_TIMEOUT_MS = 2000 // 2 segundos timeout para evitar bloqueio

// Rate limiting em memória (fallback)
const memoryRateLimits = new Map<string, { count: number; resetAt: number }>()

// Verificar se KV está configurado
function isKVConfigured(): boolean {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN &&
    process.env.KV_REST_API_URL !== '' &&
    process.env.KV_REST_API_TOKEN !== ''
  )
}

// Timeout wrapper para operações KV
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('KV timeout')), timeoutMs)
    ),
  ])
}

// Gerar chave por hora para janela deslizante
function getHourKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`
}

/**
 * Verificar rate limit (KV primeiro, fallback para memória)
 * 
 * @param ip - IP do usuário
 * @param limit - Limite de requisições (padrão: 30)
 * @param windowSeconds - Janela de tempo em segundos (padrão: 3600 = 1 hora)
 * @returns { allowed: boolean; retryAfter?: number }
 */
export async function checkKVRateLimit(
  ip: string,
  limit: number = 30,
  windowSeconds: number = 3600
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const hourKey = getHourKey()
  const fullKey = `${RATE_LIMIT_PREFIX}${ip}:${hourKey}`

  // Tentar KV primeiro se configurado
  if (isKVConfigured()) {
    try {
      const count = await withTimeout(
        kv.incr(fullKey),
        KV_TIMEOUT_MS
      )

      // Se é a primeira requisição, definir TTL
      if (count === 1) {
        await withTimeout(
          kv.expire(fullKey, windowSeconds),
          KV_TIMEOUT_MS
        )
      }

      // Verificar se excedeu limite
      if (count > limit) {
        // Calcular retryAfter (segundos até próxima hora)
        const now = Date.now()
        const nextHour = new Date(now)
        nextHour.setUTCHours(nextHour.getUTCHours() + 1)
        nextHour.setUTCMinutes(0)
        nextHour.setUTCSeconds(0)
        nextHour.setUTCMilliseconds(0)
        const retryAfter = Math.ceil((nextHour.getTime() - now) / 1000)

        logOps({
          topic: 'rate_limit',
          status: 'kv_hit',
          user: ip,
        }).catch(() => {})

        return { allowed: false, retryAfter }
      }

      // Também atualizar memória (fallback rápido)
      memoryRateLimits.set(ip, {
        count,
        resetAt: Date.now() + windowSeconds * 1000,
      })

      return { allowed: true }
    } catch (error: unknown) {
      // KV falhou - usar fallback para memória
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      logOps({
        topic: 'rate_limit',
        status: 'kv_error',
        error: errorMessage,
        user: ip,
      }).catch(() => {})
      // Continuar para fallback de memória
    }
  }

  // Fallback: rate limiting em memória
  const now = Date.now()
  const memoryLimit = memoryRateLimits.get(ip)

  if (!memoryLimit || memoryLimit.resetAt < now) {
    // Reset ou criar novo limite
    memoryRateLimits.set(ip, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    })
    return { allowed: true }
  }

  if (memoryLimit.count >= limit) {
    const retryAfter = Math.ceil((memoryLimit.resetAt - now) / 1000)

    logOps({
      topic: 'rate_limit',
      status: 'memory_hit',
      user: ip,
    }).catch(() => {})

    return { allowed: false, retryAfter }
  }

  // Incrementar contador
  memoryLimit.count++
  memoryRateLimits.set(ip, memoryLimit)

  return { allowed: true }
}

/**
 * Limpar rate limits expirados da memória (limpeza periódica)
 */
export function cleanupMemoryRateLimits(): void {
  const now = Date.now()
  for (const [ip, limit] of memoryRateLimits.entries()) {
    if (limit.resetAt < now) {
      memoryRateLimits.delete(ip)
    }
  }
}







