/**
 * Circuit Breaker com Vercel KV (Redis) + Estado Half-Open
 * 
 * Implementa circuit breaker persistente usando Vercel KV com fallback automático
 * para circuit breaker em memória. Sistema nunca quebra mesmo se KV falhar.
 * 
 * Estados:
 * - CLOSED: Permite requisições normalmente
 * - OPEN: Bloqueia após 3 falhas em 5min, bloqueia por 15min
 * - HALF_OPEN: Testa recuperação (3 tentativas, 2 sucessos necessários)
 * 
 * Transições:
 * - CLOSED → OPEN: 3 falhas em 5min
 * - OPEN → HALF_OPEN: Bloqueio expira
 * - HALF_OPEN → CLOSED: 2 de 3 sucessos
 * - HALF_OPEN → OPEN: Falha durante teste (bloqueio dobrado: 30min)
 */

import { kv } from '@vercel/kv'
import { logOps } from '@/biblioteca/logs/logOps'

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

type CircuitData = {
  state: CircuitState
  failures: number[]
  lastFailure: number
  blockedUntil: number
  halfOpenAttempts: number
  lastSuccessInHalfOpen: number
}

const CIRCUIT_PREFIX = 'circuit:'
const KV_TIMEOUT_MS = 2000 // 2 segundos timeout para evitar bloqueio
const KV_TTL_SECONDS = 3600 // 1 hora

// Configurações do Circuit Breaker
const FAILURE_THRESHOLD = 3
const FAILURE_WINDOW_MS = 5 * 60 * 1000 // 5 minutos
const BLOCK_TIME_MS = 15 * 60 * 1000 // 15 minutos
const HALF_OPEN_MAX_ATTEMPTS = 3 // Testar 3 requisições
const HALF_OPEN_SUCCESS_THRESHOLD = 2 // 2 de 3 precisam passar

// Circuit breaker em memória (fallback)
const memoryCircuitBreaker = new Map<string, CircuitData>()

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

// Obter dados do circuit breaker (KV primeiro, fallback memória)
async function getCircuitData(userId: string): Promise<CircuitData> {
  const key = `${CIRCUIT_PREFIX}${userId}`

  // Tentar KV primeiro se configurado
  if (isKVConfigured()) {
    try {
      const data = await withTimeout(
        kv.get<CircuitData>(key),
        KV_TIMEOUT_MS
      )

      if (data) {
        // Também atualizar memória (fallback rápido)
        memoryCircuitBreaker.set(userId, data)
        return data
      }
    } catch (error: unknown) {
      // KV falhou - usar fallback para memória
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      logOps({
        topic: 'circuit_breaker',
        status: 'kv_error',
        error: `get failed: ${errorMessage}`,
        user: userId,
      }).catch(() => {})
      // Continuar para fallback de memória
    }
  }

  // Fallback: circuit breaker em memória
  const memoryData = memoryCircuitBreaker.get(userId)
  if (memoryData) {
    return memoryData
  }

  // Dados padrão (CLOSED)
  const defaultData: CircuitData = {
    state: 'CLOSED',
    failures: [],
    lastFailure: 0,
    blockedUntil: 0,
    halfOpenAttempts: 0,
    lastSuccessInHalfOpen: 0,
  }

  memoryCircuitBreaker.set(userId, defaultData)
  return defaultData
}

// Salvar dados do circuit breaker (KV e memória simultaneamente)
async function setCircuitData(userId: string, data: CircuitData): Promise<void> {
  const key = `${CIRCUIT_PREFIX}${userId}`

  // Sempre salvar em memória primeiro (fallback rápido)
  memoryCircuitBreaker.set(userId, data)

  // Tentar salvar no KV se configurado (não bloqueante)
  if (isKVConfigured()) {
    try {
      await withTimeout(
        kv.set(key, data, { ex: KV_TTL_SECONDS }),
        KV_TIMEOUT_MS
      )
    } catch (error: unknown) {
      // KV falhou - mas memória já foi salva, então não é crítico
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      logOps({
        topic: 'circuit_breaker',
        status: 'kv_error',
        error: `set failed: ${errorMessage}`,
        user: userId,
      }).catch(() => {})
      // Não lançar erro - circuit breaker em memória já está salvo
    }
  }
}

/**
 * Verificar se circuito permite requisição
 * 
 * @param userId - ID do usuário
 * @returns { allowed: boolean; state: CircuitState; reason?: string }
 */
export async function checkCircuit(userId: string): Promise<{
  allowed: boolean
  state: CircuitState
  reason?: string
}> {
  const now = Date.now()
  const data = await getCircuitData(userId)

  // CLOSED: Permitir
  if (data.state === 'CLOSED') {
    return { allowed: true, state: 'CLOSED' }
  }

  // OPEN: Verificar se deve transicionar para HALF_OPEN
  if (data.state === 'OPEN') {
    if (now > data.blockedUntil) {
      // Transicionar para HALF_OPEN
      const newData: CircuitData = {
        ...data,
        state: 'HALF_OPEN',
        halfOpenAttempts: 0,
        lastSuccessInHalfOpen: 0,
      }
      await setCircuitData(userId, newData)

      logOps({
        topic: 'circuit_breaker',
        status: 'half_open',
        user: userId,
      }).catch(() => {})

      return { allowed: true, state: 'HALF_OPEN', reason: 'Testando recuperação...' }
    }

    const waitSeconds = Math.ceil((data.blockedUntil - now) / 1000)
    return {
      allowed: false,
      state: 'OPEN',
      reason: `Circuito aberto. Aguarde ${waitSeconds}s.`,
    }
  }

  // HALF_OPEN: Permitir requisições de teste limitadas
  if (data.state === 'HALF_OPEN') {
    if (data.halfOpenAttempts < HALF_OPEN_MAX_ATTEMPTS) {
      return { allowed: true, state: 'HALF_OPEN', reason: 'Teste de recuperação' }
    }

    // Já atingiu max attempts - aguardar resultado dos testes
    return { allowed: false, state: 'HALF_OPEN', reason: 'Aguardando resultado dos testes' }
  }

  return { allowed: true, state: 'CLOSED' }
}

/**
 * Registrar sucesso
 * 
 * @param userId - ID do usuário
 */
export async function registerSuccess(userId: string): Promise<void> {
  const data = await getCircuitData(userId)

  if (data.state === 'HALF_OPEN') {
    const newSuccessCount = data.lastSuccessInHalfOpen + 1
    const newAttempts = data.halfOpenAttempts + 1

    if (newSuccessCount >= HALF_OPEN_SUCCESS_THRESHOLD) {
      // Passou no teste - voltar para CLOSED
      const newData: CircuitData = {
        state: 'CLOSED',
        failures: [],
        lastFailure: 0,
        blockedUntil: 0,
        halfOpenAttempts: 0,
        lastSuccessInHalfOpen: 0,
      }
      await setCircuitData(userId, newData)

      logOps({
        topic: 'circuit_breaker',
        status: 'closed',
        user: userId,
      }).catch(() => {})
    } else {
      // Ainda testando
      const newData: CircuitData = {
        ...data,
        halfOpenAttempts: newAttempts,
        lastSuccessInHalfOpen: newSuccessCount,
      }
      await setCircuitData(userId, newData)
    }
  } else if (data.state === 'CLOSED') {
    // Sucesso em CLOSED - limpar falhas antigas
    if (data.failures.length > 0) {
      const newData: CircuitData = {
        ...data,
        failures: [],
      }
      await setCircuitData(userId, newData)
    }
  }
}

/**
 * Registrar falha
 * 
 * @param userId - ID do usuário
 */
export async function registerFailure(userId: string): Promise<void> {
  const now = Date.now()
  const data = await getCircuitData(userId)

  if (data.state === 'HALF_OPEN') {
    // Falha durante teste - voltar para OPEN com tempo maior
    const newData: CircuitData = {
      ...data,
      state: 'OPEN',
      blockedUntil: now + BLOCK_TIME_MS * 2, // Dobrar o tempo de bloqueio
      halfOpenAttempts: 0,
      lastSuccessInHalfOpen: 0,
    }
    await setCircuitData(userId, newData)

    logOps({
      topic: 'circuit_breaker',
      status: 'open',
      user: userId,
      error: 'Falha durante teste Half-Open',
    }).catch(() => {})

    return
  }

  // CLOSED: Registrar falha
  const recentFailures = data.failures.filter(t => now - t < FAILURE_WINDOW_MS)
  recentFailures.push(now)

  if (recentFailures.length >= FAILURE_THRESHOLD) {
    // Abrir circuito
    const newData: CircuitData = {
      ...data,
      state: 'OPEN',
      failures: recentFailures,
      lastFailure: now,
      blockedUntil: now + BLOCK_TIME_MS,
    }
    await setCircuitData(userId, newData)

    logOps({
      topic: 'circuit_breaker',
      status: 'open',
      user: userId,
      error: `${recentFailures.length} falhas em ${FAILURE_WINDOW_MS / 1000}s`,
    }).catch(() => {})
  } else {
    // Apenas registrar falha
    const newData: CircuitData = {
      ...data,
      failures: recentFailures,
      lastFailure: now,
    }
    await setCircuitData(userId, newData)
  }
}







