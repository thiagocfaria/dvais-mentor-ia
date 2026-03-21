/**
 * Módulo compartilhado para métricas do servidor
 * Permite acesso às métricas de cache, circuit breaker, etc.
 */

let cacheHits = 0
let cacheMisses = 0
let lastResetTime = Date.now()

export function incrementCacheHit() {
  cacheHits++
}

export function incrementCacheMiss() {
  cacheMisses++
}

export function getCacheHitRate(): number {
  const total = cacheHits + cacheMisses
  return total > 0 ? cacheHits / total : 0
}

export function resetMetrics() {
  cacheHits = 0
  cacheMisses = 0
  lastResetTime = Date.now()
}

export function shouldResetMetrics(): boolean {
  return Date.now() - lastResetTime > 60 * 60 * 1000 // 1 hora
}

export function getCacheStats() {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: getCacheHitRate(),
  }
}
