export type AssistantResponse = {
  spokenText?: string
  onScreenTopic?: string
  actions?: Array<Record<string, unknown>>
  requiresUserClick?: boolean
  confidence?: number
  mode?: string
}

export type CacheEntry = {
  response: AssistantResponse
  expiresAt: number
  lastAccessed: number
}

export type CircuitFailure = { timestamps: number[]; blockedUntil?: number }
export type CircuitState = { failures: Map<string, CircuitFailure> }

export const MAX_CACHE_SIZE = 500
export const KB_VERSION = '1.0.0'

/**
 * Cache em memória (fallback)
 * 
 * Estratégia de Cache Duplo:
 * - KV Cache (persistente): Usado primeiro quando configurado via Vercel KV
 *   - Persistente entre deploys
 *   - Compartilhado entre instâncias serverless
 *   - Disponível em cold starts
 * 
 * - Memory Cache (fallback): Usado quando KV não disponível
 *   - Instantâneo (sem latência de rede)
 *   - Local à instância
 *   - Fallback automático se KV falhar
 * 
 * Ambos são atualizados simultaneamente quando possível.
 * O sistema sempre funciona mesmo se KV não estiver configurado ou falhar.
 * 
 * @see biblioteca/cache/kvCache.ts para funções de cache persistente
 */
export const cache = new Map<string, CacheEntry>()

/**
 * Circuit Breaker em memória (fallback)
 * 
 * Nota: O circuit breaker principal agora está em biblioteca/circuitBreaker/kvCircuitBreaker.ts
 * com suporte a KV (compartilhado) e estado Half-Open.
 * Este Map é mantido apenas para compatibilidade retroativa.
 * 
 * @see biblioteca/circuitBreaker/kvCircuitBreaker.ts para circuit breaker completo
 */
export const circuit: CircuitState = {
  failures: new Map(),
}
