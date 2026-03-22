import { cache, MAX_CACHE_SIZE, KB_VERSION } from '@/app/api/assistente/state'
import { cleanupMemoryRateLimits } from '@/biblioteca/rateLimit/kvRateLimiter'
import { logOps } from '@/biblioteca/logs/logOps'

export const CACHE_TTL_MS = 10 * 60 * 1000

let requestCount = 0

/**
 * Limpa cache expirado e faz LRU se necessário.
 */
export function cleanupCache(): void {
  const now = Date.now()

  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key)
    }
  }

  if (cache.size >= MAX_CACHE_SIZE) {
    const toRemove = cache.size - MAX_CACHE_SIZE + 1
    const candidates: Array<{ key: string; lastAccessed: number }> = []

    for (const [key, entry] of cache.entries()) {
      candidates.push({ key, lastAccessed: entry.lastAccessed })
    }

    candidates.sort((a, b) => a.lastAccessed - b.lastAccessed)

    for (let i = 0; i < toRemove && i < candidates.length; i++) {
      cache.delete(candidates[i].key)
    }
  }
}

// Cache LRU para normalização de perguntas
const normalizeCache = new Map<string, { value: string; lastUsed: number }>()
const MAX_NORMALIZE_CACHE = 1000

export function normalizeQuestion(q: string): string {
  const cached = normalizeCache.get(q)
  if (cached) {
    cached.lastUsed = Date.now()
    return cached.value
  }

  const normalized = q
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '')

  if (normalizeCache.size >= MAX_NORMALIZE_CACHE) {
    let oldestKey = ''
    let oldestTime = Date.now()
    for (const [key, entry] of normalizeCache.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed
        oldestKey = key
      }
    }
    if (oldestKey) normalizeCache.delete(oldestKey)
  }

  normalizeCache.set(q, { value: normalized, lastUsed: Date.now() })
  return normalized
}

export function getCacheKey(topic: string, question: string, qualifiers: string[] = []): string {
  const suffix = qualifiers
    .map(normalizeQuestion)
    .filter(Boolean)
    .join(':')

  return suffix
    ? `${topic}:${normalizeQuestion(question)}:${suffix}:${KB_VERSION}`
    : `${topic}:${normalizeQuestion(question)}:${KB_VERSION}`
}

/**
 * Manutenção periódica: limpeza de cache e rate limits a cada N requisições,
 * monitoramento de memória a cada 100.
 */
export function runPeriodicMaintenance(): void {
  requestCount++

  if (requestCount % 50 === 0) {
    cleanupCache()
  }

  if (requestCount % 100 === 0) {
    cleanupMemoryRateLimits()

    const memory = process.memoryUsage()
    const MEMORY_THRESHOLD_DEV = 500 * 1024 * 1024
    const MEMORY_THRESHOLD_PROD = 1024 * 1024 * 1024
    const threshold = process.env.NODE_ENV === 'production' ? MEMORY_THRESHOLD_PROD : MEMORY_THRESHOLD_DEV

    logOps({
      topic: 'assistente',
      status: 'memory_check',
      memoryUsed: Math.round(memory.heapUsed / 1024 / 1024),
      memoryTotal: Math.round(memory.heapTotal / 1024 / 1024),
    }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log memory check:', logError)
      }
    })

    if (memory.heapUsed > threshold) {
      cleanupCache()
      logOps({
        topic: 'assistente',
        status: 'memory_high',
        memoryUsed: Math.round(memory.heapUsed / 1024 / 1024),
      }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log memory high:', logError)
        }
      })
    }
  }
}
