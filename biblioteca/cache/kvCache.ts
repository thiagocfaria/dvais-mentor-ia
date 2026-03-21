/**
 * Cache Persistente com Vercel KV (Redis)
 * 
 * Implementa cache persistente usando Vercel KV com fallback automático
 * para cache em memória. Sistema nunca quebra mesmo se KV falhar.
 * 
 * Estratégia:
 * - Tentar KV primeiro (persistente, compartilhado)
 * - Se KV falhar/não configurado → fallback para memória
 * - Ambos atualizados simultaneamente quando possível
 */

import { kv } from '@vercel/kv'
import { logOps } from '@/biblioteca/logs/logOps'
import type { CacheEntry } from '@/app/api/assistente/state'
import { cache } from '@/app/api/assistente/state'

const CACHE_PREFIX = 'assistente:'
const KV_TIMEOUT_MS = 2000 // 2 segundos timeout para evitar bloqueio
const KV_TTL_SECONDS = 600 // 10 minutos (mesmo que CACHE_TTL_MS / 1000)

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

/**
 * Obter valor do cache (KV primeiro, fallback para memória)
 * 
 * @param key - Chave do cache
 * @returns CacheEntry ou null se não encontrado
 */
export async function getFromCache(key: string): Promise<CacheEntry | null> {
  const fullKey = `${CACHE_PREFIX}${key}`

  // Tentar KV primeiro se configurado
  if (isKVConfigured()) {
    try {
      const kvValue = await withTimeout(
        kv.get<CacheEntry>(fullKey),
        KV_TIMEOUT_MS
      )

      if (kvValue && kvValue.expiresAt > Date.now()) {
        // Cache hit do KV - atualizar lastAccessed e retornar
        kvValue.lastAccessed = Date.now()
        
        // Também atualizar cache em memória (fallback rápido)
        cache.set(key, kvValue)
        
        // Log estruturado
        logOps({
          topic: 'cache',
          status: 'kv_hit',
          latencyMs: 0, // Será preenchido pelo caller
        }).catch(() => {})

        return kvValue
      }

      // Cache expirado ou não encontrado no KV
      // Tentar memória como fallback
    } catch (error: unknown) {
      // KV falhou - usar fallback para memória
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      logOps({
        topic: 'cache',
        status: 'kv_error',
        error: errorMessage,
      }).catch(() => {})
      // Continuar para fallback de memória
    }
  }

  // Fallback: cache em memória
  const memoryValue = cache.get(key)
  if (memoryValue && memoryValue.expiresAt > Date.now()) {
    // Atualizar lastAccessed
    memoryValue.lastAccessed = Date.now()

    // Log estruturado
    logOps({
      topic: 'cache',
      status: 'memory_hit',
      latencyMs: 0, // Será preenchido pelo caller
    }).catch(() => {})

    return memoryValue
  }

  // Cache miss em ambos
  return null
}

/**
 * Salvar valor no cache (KV e memória simultaneamente)
 * 
 * @param key - Chave do cache
 * @param value - Valor a salvar
 */
export async function setInCache(key: string, value: CacheEntry): Promise<void> {
  const fullKey = `${CACHE_PREFIX}${key}`

  // Sempre salvar em memória primeiro (fallback rápido)
  cache.set(key, value)

  // Tentar salvar no KV se configurado (não bloqueante)
  if (isKVConfigured()) {
    try {
      // Salvar no KV com TTL
      await withTimeout(
        kv.set(fullKey, value, { ex: KV_TTL_SECONDS }),
        KV_TIMEOUT_MS
      )
    } catch (error: unknown) {
      // KV falhou - mas memória já foi salva, então não é crítico
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      logOps({
        topic: 'cache',
        status: 'kv_error',
        error: `set failed: ${errorMessage}`,
      }).catch(() => {})
      // Não lançar erro - cache em memória já está salvo
    }
  }
}

/**
 * Invalidar cache por padrão (opcional, para futuras melhorias)
 * 
 * @param pattern - Padrão de chaves a invalidar
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const fullPattern = `${CACHE_PREFIX}${pattern}`

  // Invalidar em memória primeiro
  const keysToDelete: string[] = []
  for (const [key] of cache.entries()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => cache.delete(key))

  // Tentar invalidar no KV se configurado
  if (isKVConfigured()) {
    try {
      // Buscar todas as chaves que correspondem ao padrão
      const keys = await withTimeout(
        kv.keys(`${fullPattern}*`),
        KV_TIMEOUT_MS
      )

      if (keys.length > 0) {
        await withTimeout(kv.del(...keys), KV_TIMEOUT_MS)
      }
    } catch (error: unknown) {
      // KV falhou - mas memória já foi limpa
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      logOps({
        topic: 'cache',
        status: 'kv_error',
        error: `invalidate failed: ${errorMessage}`,
      }).catch(() => {})
      // Não lançar erro - cache em memória já foi limpo
    }
  }
}

/**
 * Verificar se KV está disponível e funcionando
 * Útil para debugging e monitoramento
 */
export async function checkKVHealth(): Promise<{
  configured: boolean
  available: boolean
  latency?: number
}> {
  if (!isKVConfigured()) {
    return { configured: false, available: false }
  }

  try {
    const start = Date.now()
    await withTimeout(kv.ping(), KV_TIMEOUT_MS)
    const latency = Date.now() - start

    return {
      configured: true,
      available: true,
      latency,
    }
  } catch (error: unknown) {
    return {
      configured: true,
      available: false,
    }
  }
}

