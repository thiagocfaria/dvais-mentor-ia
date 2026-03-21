import { NextResponse } from 'next/server'
import { getCacheStats } from '@/biblioteca/logs/metrics'

const startTime = Date.now()

// Importar cache e circuit do route.ts dinamicamente (lazy)
let cache: Map<string, unknown> | null = null
let circuit: { failures?: Map<string, { blockedUntil?: number }> } | null = null
let MAX_CACHE_SIZE = 500
let KB_VERSION = '1.0.0'

async function loadAssistenteMetrics() {
  if (cache && circuit) return
  try {
    const stateModule = await import('../assistente/state')
    cache = (stateModule.cache as Map<string, unknown>) || null
    circuit = (stateModule.circuit as typeof circuit) || null
    MAX_CACHE_SIZE = stateModule.MAX_CACHE_SIZE || 500
    KB_VERSION = stateModule.KB_VERSION || '1.0.0'
  } catch {
    // Em ambiente serverless, pode não conseguir importar
  }
}

export async function GET() {
  try {
    await loadAssistenteMetrics()
    const uptime = Math.floor((Date.now() - startTime) / 1000)
    const memory = process.memoryUsage()

    const cacheSize = cache?.size || 0
    const cacheStats = getCacheStats()
    const cacheHitRate = cacheStats.hitRate

    // Contar bloqueados no circuit breaker
    let blockedCount = 0
    if (circuit?.failures) {
      const now = Date.now()
      for (const state of circuit.failures.values()) {
        if (state?.blockedUntil && state.blockedUntil > now) {
          blockedCount++
        }
      }
    }

    const status = blockedCount > 10 ? 'degraded' : 'ok'

    return NextResponse.json({
      status,
      cache: {
        size: cacheSize,
        maxSize: MAX_CACHE_SIZE,
        hitRate: Math.round(cacheHitRate * 100) / 100,
      },
      circuitBreaker: {
        active: blockedCount > 0,
        blocked: blockedCount,
      },
      uptime,
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        limit: Math.round(memory.heapTotal / 1024 / 1024),
      },
      kbVersion: KB_VERSION,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
