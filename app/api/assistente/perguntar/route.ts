import { NextRequest, NextResponse } from 'next/server'
import { validateActions } from '@/biblioteca/assistente/actionValidator'
import { logOps } from '@/biblioteca/logs/logOps'
import { askFromKnowledgeBase } from '@/biblioteca/assistente/knowledgeBase'
import { incrementCacheHit, incrementCacheMiss, shouldResetMetrics, resetMetrics } from '@/biblioteca/logs/metrics'
import { detectIntent } from '@/biblioteca/assistente/intentDetection'
import { getFromCache, setInCache } from '@/biblioteca/cache/kvCache'
import { checkKVRateLimit } from '@/biblioteca/rateLimit/kvRateLimiter'
import { checkCircuit, registerSuccess, registerFailure } from '@/biblioteca/circuitBreaker/kvCircuitBreaker'

import { idFromReq, validateRequestBody } from '@/biblioteca/assistente/requestValidation'
import { checkBudget } from '@/biblioteca/assistente/budgetTracker'
import { getCacheKey, cleanupCache, CACHE_TTL_MS, runPeriodicMaintenance } from '@/biblioteca/assistente/cacheUtils'
import { ALLOWED_IDS, isInScope, extractClickContext } from '@/biblioteca/assistente/scopeValidator'
import { createOptimizedResponse } from '@/biblioteca/assistente/responseBuilder'
import { callLLM } from '@/biblioteca/assistente/llmAdapter'

const IP_LIMIT = 30
const IP_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  // 1. Abort check
  if (req.signal?.aborted) {
    return NextResponse.json({ error: 'Requisição cancelada.' }, { status: 499 })
  }

  const started = performance.now()

  // 2. Periodic maintenance (cache cleanup, memory check)
  runPeriodicMaintenance()

  const user = idFromReq(req)
  const sessionId = req.cookies.get('assistente_session')?.value ?? user

  // 3. Rate limiting (skip in dev)
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? user
  const isDev = process.env.NODE_ENV !== 'production'
  if (!isDev) {
    const rateLimitResult = await checkKVRateLimit(String(ip), IP_LIMIT, IP_WINDOW_MS / 1000)
    if (!rateLimitResult.allowed) {
      logOps({ topic: 'assistente', status: 'ip_rate_limit', user: String(ip) }).catch(() => {})
      const retryAfter = rateLimitResult.retryAfter ? ` Aguarde ${rateLimitResult.retryAfter}s.` : ''
      return NextResponse.json(
        { error: `Muitas requisições.${retryAfter}` },
        {
          status: 429,
          headers: rateLimitResult.retryAfter ? { 'Retry-After': String(rateLimitResult.retryAfter) } : {},
        }
      )
    }
  }

  // 4. Circuit breaker
  const circuitResult = await checkCircuit(user)
  if (!circuitResult.allowed) {
    logOps({
      topic: 'assistente',
      status: 'circuit_block',
      user,
      error: circuitResult.reason || `Circuito ${circuitResult.state}`,
    }).catch(() => {})
    return NextResponse.json({
      error: circuitResult.reason || 'Modo econômico/seguro ativo. Tente mais tarde.',
      mode: 'economico',
    }, { status: 429 })
  }

  // 5. Request validation (body size, question format, sanitization)
  const validated = await validateRequestBody(req, user)
  if (!validated.ok) {
    return validated.response
  }
  const { question, sanitized, historyRaw, contextRaw } = validated

  // 6. Metrics reset
  if (shouldResetMetrics()) {
    resetMetrics()
  }

  // 7. Cache lookup
  const cacheKey = getCacheKey('assistente', question)
  const cached = await getFromCache(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    incrementCacheHit()
    logOps({ topic: 'assistente', status: 'cache_hit', latencyMs: Math.round(performance.now() - started), user }).catch(() => {})
    return createOptimizedResponse(cached.response, true)
  }
  incrementCacheMiss()

  // 8. Knowledge Base (first responder before LLM)
  const kbReplyRaw = askFromKnowledgeBase(sanitized)
  if (kbReplyRaw) {
    const actions = validateActions(kbReplyRaw.actions || [], [...ALLOWED_IDS])
    const response = {
      entryId: kbReplyRaw.entryId,
      responses: kbReplyRaw.responses,
      actions,
      ctas: kbReplyRaw.ctas,
      mode: 'normal' as const,
    }

    cleanupCache()
    await setInCache(cacheKey, {
      response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      lastAccessed: Date.now(),
    })

    await registerSuccess(user)
    const latency = Math.round(performance.now() - started)
    logOps({ topic: 'assistente', status: 'kb_hit', latencyMs: latency, mode: 'normal', user }).catch(() => {})
    return createOptimizedResponse(response, false)
  }

  // 9. Validate history (lazy — only when KB didn't answer)
  const validHistory: Array<{ role: string; content: string }> = []
  if (Array.isArray(historyRaw)) {
    const limitedHistory = historyRaw.length > 10 ? historyRaw.slice(-10) : historyRaw
    for (const h of limitedHistory) {
      if (h && typeof h === 'object' && (h as Record<string, unknown>).role && (h as Record<string, unknown>).content) {
        const entry = h as Record<string, unknown>
        validHistory.push({
          role: String(entry.role),
          content: String(entry.content).slice(0, 200),
        })
      }
    }
  }

  // 10. Click context extraction
  const context =
    contextRaw && typeof contextRaw === 'object' ? (contextRaw as Record<string, unknown>) : {}
  const { hasClickContext, clickContextBlock } = extractClickContext(context)

  // 11. Scope validation
  if (!isInScope(sanitized, hasClickContext)) {
    logOps({ topic: 'assistente', status: 'out_of_scope', user }).catch(() => {})
    return NextResponse.json(
      { error: 'Fora de escopo. Pergunte sobre cadastro, análise, proteção, aprendizado ou resultados.' },
      { status: 400 }
    )
  }

  // 12. Budget check
  if (!checkBudget(user, sessionId)) {
    logOps({ topic: 'assistente', status: 'budget_exceeded', user }).catch(() => {})
    return NextResponse.json({ error: 'Limite atingido. Tente mais tarde.' }, { status: 429 })
  }

  // 13. Intent detection
  const streamMode = req.nextUrl.searchParams.get('stream') === 'true'
  const detectedIntent = detectIntent(sanitized, {
    detectMultiple: true,
    considerHistory: true,
    useFuzzy: true,
  })

  logOps({
    topic: 'assistente',
    status: 'intent_detected',
    intent: detectedIntent.type,
    confidence: detectedIntent.confidence,
    keywords: detectedIntent.keywords.join(', '),
    secondaryIntents: detectedIntent.secondaryIntents?.join(', ') || '',
    user,
  }).catch(() => {})

  // 14. LLM call
  try {
    const llmResult = await callLLM(
      {
        sanitizedQuestion: sanitized,
        validHistory,
        clickContextBlock,
        detectedIntent,
        streamMode,
        allowedIds: ALLOWED_IDS,
      },
      req.signal
    )

    if (llmResult.type === 'error') {
      await registerFailure(user)
      logOps({ topic: 'assistente', status: llmResult.message, user }).catch(() => {})
      return NextResponse.json(
        { error: llmResult.message === 'Assistente temporariamente indisponível.' ? llmResult.message : 'Erro ao processar pergunta.' },
        { status: llmResult.status }
      )
    }

    if (llmResult.type === 'stream') {
      return llmResult.streamResponse
    }

    // 15. Cache result + register success
    const response = llmResult.response
    cleanupCache()
    await setInCache(cacheKey, {
      response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      lastAccessed: Date.now(),
    })

    await registerSuccess(user)
    const latency = Math.round(performance.now() - started)
    logOps({ topic: 'assistente', status: 'ok', latencyMs: latency, mode: response.mode, user }).catch(() => {})

    // 16. Return optimized response
    return createOptimizedResponse(response, false)
  } catch (error: unknown) {
    await registerFailure(user)
    const message = error instanceof Error ? error.message : 'unknown'
    logOps({ topic: 'assistente', status: 'llm_exception', error: message, user }).catch(() => {})
    return NextResponse.json({ error: 'Erro ao processar pergunta.' }, { status: 500 })
  }
}
