import { NextRequest, NextResponse } from 'next/server'
import { validateActions, type Action } from '@/biblioteca/assistente/actionValidator'
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
import { analyzeConversationContext } from '@/biblioteca/assistente/followUpContext'
import { buildProductSupportResponse } from '@/biblioteca/assistente/supportResponses'
import { buildAuthFlowGuidance } from '@/biblioteca/assistente/authFlowGuidance'

const IP_LIMIT = 30
const IP_WINDOW_MS = 60 * 60 * 1000
const KB_MIN_CONFIDENCE = 0.62
const KB_MIN_CONFIDENCE_ELEVATOR = 0.78

const GENERIC_CLICK_QUESTION_RE =
  /^(o que (e|é) isso|me explica isso|explica isso|como isso funciona|o que significa isso)$/i

const ASSISTANT_TECHNICAL_RE =
  /\b(assistente|chat|voz|microfone|mobile|celular|audio|áudio|toque|clique|contexto|click context|resposta|acao|ações|navega[cç][aã]o|cache|rate limit|circuit breaker|quota|token|api)\b/i

const ASSISTANT_USAGE_FAQ_RE =
  /\b(funciona no celular|tem app|tem aplicativo|como usar a voz|como usar voz|assistente de voz|tocar para falar|ouvir resposta|falar com voce)\b/i

function mentionsPlatformIdentity(question: string): boolean {
  return /\b(dvais|davi|mentor|plataforma)\b/i.test(question)
}

function shouldBypassKnowledgeBase(args: {
  sanitized: string
  hasClickContext: boolean
  detectedIntentType: string
  shouldBypassKB: boolean
  kbBypassReason: string | null
}) {
  const { sanitized, hasClickContext, detectedIntentType, shouldBypassKB, kbBypassReason } = args
  const normalizedQuestion = sanitized.toLowerCase().replace(/[?!.,;:]/g, '').trim()

  if (shouldBypassKB) {
    return kbBypassReason || 'conversation_context'
  }

  if (hasClickContext && GENERIC_CLICK_QUESTION_RE.test(normalizedQuestion)) {
    return 'generic_click_context'
  }

  if (detectedIntentType === 'reclamacao' || detectedIntentType === 'comparar') {
    return `intent:${detectedIntentType}`
  }

  if (ASSISTANT_USAGE_FAQ_RE.test(normalizedQuestion)) {
    return null
  }

  if (ASSISTANT_TECHNICAL_RE.test(normalizedQuestion)) {
    return 'assistant_technical_question'
  }

  return null
}

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

  const context =
    contextRaw && typeof contextRaw === 'object' ? (contextRaw as Record<string, unknown>) : {}
  const { hasClickContext, clickContextBlock, safeClickedTargetId } = extractClickContext(context)
  const contextSignals = {
    conversationSummary:
      typeof context.conversationSummary === 'string'
        ? context.conversationSummary.slice(0, 320)
        : undefined,
    lastQuestion:
      typeof context.lastQuestion === 'string' ? context.lastQuestion.slice(0, 180) : undefined,
    lastAnswer:
      typeof context.lastAnswer === 'string' ? context.lastAnswer.slice(0, 240) : undefined,
    lastTopicHint:
      typeof context.lastTopicHint === 'string' ? context.lastTopicHint.slice(0, 32) : undefined,
    questionLooksIndependent:
      typeof context.questionLooksIndependent === 'boolean'
        ? context.questionLooksIndependent
        : undefined,
  }

  // 6a. Validate history before scope and KB gating
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

  const conversationContext = analyzeConversationContext({
    sanitizedQuestion: sanitized,
    validHistory,
    contextSignals,
  })

  const preDetectedIntent = detectIntent(sanitized, {
    detectMultiple: true,
    considerHistory: false,
    useFuzzy: true,
  })
  const kbBypassReason = shouldBypassKnowledgeBase({
    sanitized,
    hasClickContext,
    detectedIntentType: preDetectedIntent.type,
    shouldBypassKB: conversationContext.shouldBypassKB,
    kbBypassReason: conversationContext.kbBypassReason,
  })
  const authFlowGuidance = buildAuthFlowGuidance({
    sanitizedQuestion: sanitized,
    flowHint: conversationContext.flowHint,
    hasUsefulHistory: conversationContext.hasUsefulHistory,
  })
  const supportResponse = buildProductSupportResponse(sanitized)

  // 7. Cache lookup
  const cacheKey = getCacheKey('assistente', question, [
    String(context.currentPage || ''),
    safeClickedTargetId || '',
    hasClickContext ? 'click_context' : '',
    conversationContext.hasUsefulHistory ? 'history_present' : 'history_empty',
    conversationContext.topicHint ? `topic:${conversationContext.topicHint}` : '',
    conversationContext.flowHint ? `flow:${conversationContext.flowHint}` : '',
    conversationContext.isEllipticalFollowUp ? 'elliptical_followup' : '',
    conversationContext.isTechnicalMetaQuestion ? 'technical_meta' : '',
    conversationContext.isOpenProductQuestion ? 'product_overview' : '',
    conversationContext.kbBypassReason || '',
    authFlowGuidance ? `auth_flow:${authFlowGuidance.subtype}` : '',
    supportResponse ? `support:${supportResponse.subtype}` : '',
  ])
  const cached = await getFromCache(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    incrementCacheHit()
    logOps({ topic: 'assistente', status: 'cache_hit', latencyMs: Math.round(performance.now() - started), user }).catch(() => {})
    return createOptimizedResponse(cached.response, true)
  }
  incrementCacheMiss()

  // 7a. Deterministic auth-flow responses for cadastro/login guidance
  if (authFlowGuidance) {
    const authActions = Array.isArray(authFlowGuidance.response.actions)
      ? (authFlowGuidance.response.actions as Action[])
      : []
    const response = {
      ...authFlowGuidance.response,
      actions: validateActions(authActions, [...ALLOWED_IDS]),
    }

    cleanupCache()
    await setInCache(cacheKey, {
      response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      lastAccessed: Date.now(),
    })

    await registerSuccess(user)
    const latency = Math.round(performance.now() - started)
    logOps({
      topic: 'assistente',
      status: 'auth_flow_guidance',
      latencyMs: latency,
      kbReason: authFlowGuidance.subtype,
      user,
    }).catch(() => {})

    return createOptimizedResponse(response, false)
  }

  // 7b. Product support responses for mobile/voice issues
  if (supportResponse) {
    cleanupCache()
    await setInCache(cacheKey, {
      response: supportResponse.response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      lastAccessed: Date.now(),
    })

    await registerSuccess(user)
    const latency = Math.round(performance.now() - started)
    logOps({
      topic: 'assistente',
      status: 'support_deterministic',
      latencyMs: latency,
      kbReason: supportResponse.subtype,
      user,
    }).catch(() => {})

    return createOptimizedResponse(supportResponse.response, false)
  }

  // 8. Knowledge Base (first responder before LLM)
  const kbReplyRaw = kbBypassReason ? null : askFromKnowledgeBase(sanitized)
  const kbMinConfidence =
    kbReplyRaw?.entryId === 'elevator_pitch' && !mentionsPlatformIdentity(sanitized)
      ? KB_MIN_CONFIDENCE_ELEVATOR
      : KB_MIN_CONFIDENCE

  if (kbBypassReason) {
    logOps({
      topic: 'assistente',
      status: 'kb_bypass_intent',
      kbReason: kbBypassReason,
      intent: preDetectedIntent.type,
      confidence: preDetectedIntent.confidence,
      user,
    }).catch(() => {})
  } else if (kbReplyRaw && (kbReplyRaw.confidence ?? 0) < kbMinConfidence) {
    logOps({
      topic: 'assistente',
      status: 'kb_bypass_low_confidence',
      kbConfidence: kbReplyRaw.confidence,
      kbReason: kbReplyRaw.reason,
      user,
    }).catch(() => {})
  }

  if (kbReplyRaw && (kbReplyRaw.confidence ?? 0) >= kbMinConfidence) {
    const actions = validateActions(kbReplyRaw.actions || [], [...ALLOWED_IDS])
    const response = {
      entryId: kbReplyRaw.entryId,
      responses: kbReplyRaw.responses,
      actions,
      ctas: kbReplyRaw.ctas,
      confidence: kbReplyRaw.confidence,
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
    logOps({
      topic: 'assistente',
      status: 'kb_hit',
      latencyMs: latency,
      mode: 'normal',
      kbConfidence: kbReplyRaw.confidence,
      kbReason: kbReplyRaw.reason,
      user,
    }).catch(() => {})
    return createOptimizedResponse(response, false)
  }

  // 11. Scope validation
  if (
    !isInScope(sanitized, hasClickContext, {
      allowContextualFollowUp: conversationContext.shouldTreatAsInScope,
      topicHint: conversationContext.topicHint,
    })
  ) {
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
  const detectedIntent = detectIntent(conversationContext.effectiveQuestion, {
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
        effectiveQuestion: conversationContext.effectiveQuestion,
        validHistory,
        clickContextBlock,
        conversationContextBlock: conversationContext.conversationContextBlock,
        detectedIntent,
        streamMode: false,
        allowedIds: ALLOWED_IDS,
      },
      req.signal
    )

    if (llmResult.type === 'error') {
      await registerFailure(user)
      logOps({
        topic: 'assistente',
        status: 'llm_http_error',
        error: llmResult.message,
        errorType: llmResult.errorType,
        provider: llmResult.provider || undefined,
        model: llmResult.model || undefined,
        httpStatus: llmResult.httpStatus ?? undefined,
        user,
      }).catch(() => {})
      return NextResponse.json(
        {
          error: llmResult.message,
          errorType: llmResult.errorType,
          provider: llmResult.provider,
        },
        { status: llmResult.status }
      )
    }

    if (llmResult.type !== 'response') {
      await registerFailure(user)
      return NextResponse.json(
        { error: 'Modo de streaming não está habilitado neste cliente.' },
        { status: 501 }
      )
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
    logOps({
      topic: 'assistente',
      status: 'llm_hit',
      latencyMs: latency,
      mode: response.mode,
      provider: llmResult.provider,
      model: llmResult.model,
      user,
    }).catch(() => {})

    // 16. Return optimized response
    return createOptimizedResponse(response, false)
  } catch (error: unknown) {
    await registerFailure(user)
    const message = error instanceof Error ? error.message : 'unknown'
    logOps({ topic: 'assistente', status: 'llm_exception', error: message, user }).catch(() => {})
    return NextResponse.json({ error: 'Erro ao processar pergunta.' }, { status: 500 })
  }
}
