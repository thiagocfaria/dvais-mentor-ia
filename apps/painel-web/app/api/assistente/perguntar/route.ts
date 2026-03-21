import { NextRequest, NextResponse } from 'next/server'
import { validateActions } from '@/biblioteca/assistente/actionValidator'
import type { Action } from '@/biblioteca/assistente/actionValidator'
import { enforceSpeechDuration } from '@/biblioteca/assistente/speechGate'
import { logOps } from '@/biblioteca/logs/logOps'
import { askFromKnowledgeBase } from '@/biblioteca/assistente/knowledgeBase'
import { sanitizeQuestion } from '@/biblioteca/assistente/sanitize'
import { incrementCacheHit, incrementCacheMiss, shouldResetMetrics, resetMetrics } from '@/biblioteca/logs/metrics'
import { detectIntent, getIntentBasedPrompt } from '@/biblioteca/assistente/intentDetection'
import { getFromCache, setInCache } from '@/biblioteca/cache/kvCache'
import { checkKVRateLimit, cleanupMemoryRateLimits } from '@/biblioteca/rateLimit/kvRateLimiter'
import { checkCircuit, registerSuccess, registerFailure } from '@/biblioteca/circuitBreaker/kvCircuitBreaker'
import { gzip } from 'zlib'
import { promisify } from 'util'
import { cache, MAX_CACHE_SIZE, KB_VERSION } from '../state'
import type { AssistantResponse } from '../state'
const gzipAsync = promisify(gzip)

// Configurações de orçamento
const SESSION_LIMIT = 5
const DAILY_LIMIT = 20
const GLOBAL_LIMIT = 1000

// Circuit breaker (constantes movidas para kvCircuitBreaker.ts)
// Mantidas aqui apenas para referência/comentários se necessário

// Cache
const CACHE_TTL_MS = 10 * 60 * 1000

let requestCount = 0

// Função para limpar cache expirado e fazer LRU se necessário
function cleanupCache() {
  const now = Date.now()
  
  // Remover expirados primeiro (já implementado, manter)
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key)
    }
  }
  
  // Se ainda estiver cheio, remover incrementalmente sem sort completo
  if (cache.size >= MAX_CACHE_SIZE) {
    const toRemove = cache.size - MAX_CACHE_SIZE + 1
    const candidates: Array<{ key: string; lastAccessed: number }> = []
    
    // Coletar candidatos para remoção (uma passada)
    for (const [key, entry] of cache.entries()) {
      candidates.push({ key, lastAccessed: entry.lastAccessed })
    }
    
    // Ordenar apenas os candidatos (não todo o cache)
    candidates.sort((a, b) => a.lastAccessed - b.lastAccessed)
    
    // Remover apenas os N mais antigos
    for (let i = 0; i < toRemove && i < candidates.length; i++) {
      cache.delete(candidates[i].key)
    }
  }
}

// Cache LRU verdadeiro para normalização
const normalizeCache = new Map<string, { value: string; lastUsed: number }>()
const MAX_NORMALIZE_CACHE = 1000

function normalizeQuestion(q: string): string {
  // Verificar cache primeiro
  const cached = normalizeCache.get(q)
  if (cached) {
    // Atualizar lastUsed para LRU
    cached.lastUsed = Date.now()
    return cached.value
  }
  
  // Calcular normalização
  const normalized = q
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '')
  
  // Limpar cache se necessário (LRU verdadeiro)
  if (normalizeCache.size >= MAX_NORMALIZE_CACHE) {
    // Encontrar entrada menos usada recentemente
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

function getCacheKey(topic: string, question: string): string {
  return `${topic}:${normalizeQuestion(question)}:${KB_VERSION}`
}

type BudgetState = {
  session: Map<string, number>
  day: Map<string, number>
  global: number
}

const budget: BudgetState = {
  session: new Map(),
  day: new Map(),
  global: 0,
}

// Rate limiting por IP (constantes para uso no kvRateLimiter)
const IP_LIMIT = 30
const IP_WINDOW_MS = 60 * 60 * 1000 // 1 hora

const ALLOWED_IDS = [
  'hero-content',
  'features-section',
  'stats-section',
  'analise-hero',
  'analise-publico',
  'analise-dados',
  'analise-exclusivos',
  'seguranca-hero',
  'seguranca-cards',
  'seguranca-alertas',
  'seguranca-guia',
  'aprendizado-hero',
  'voce-aprende',
  'aprende-realidade',
  'aprende-mercado',
  'transparencia-controle',
  'funcionamento',
  'login-card',
  'cadastro-card',
  'button-comecar-agora',
  'button-login',
  'nav-analise',
  'nav-seguranca',
  'nav-aprendizado',
]
const SCOPE_KEYWORDS = [
  'cadastro', 'análise', 'analise', 'proteção', 'segurança', 'aprendizado', 'resultado', 'métrica', 'estatística',
  'dvais', 'mentor', 'plataforma', 'como funciona', 'o que é', 'investimento', 'corretora', 'guia', 'funcionalidade',
  'preço', 'valor', 'plano', 'assinatura', 'suporte', 'ajuda', 'tutorial', 'iniciante', 'aventureiro', 'analista'
]

function idFromReq(req: NextRequest) {
  const uid = req.headers.get('x-user-id')
  if (uid) return uid
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'anon'
  return String(ip)
}

function todayKey(user: string) {
  const d = new Date()
  return `${user}-${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
}

function checkBudget(user: string, sessionId: string) {
  const sessionUsed = budget.session.get(sessionId) ?? 0
  const dayKey = todayKey(user)
  const dayUsed = budget.day.get(dayKey) ?? 0
  
  // Verificar limites ANTES de incrementar
  if (sessionUsed >= SESSION_LIMIT) return false
  if (dayUsed >= DAILY_LIMIT) return false
  if (budget.global >= GLOBAL_LIMIT) return false
  
  // Incrementar apenas se passou nas verificações
  budget.session.set(sessionId, sessionUsed + 1)
  budget.day.set(dayKey, dayUsed + 1)
  budget.global += 1
  return true
}

// Circuit breaker antigo mantido em state.ts para compatibilidade
// As novas funções já têm fallback interno para memória

// Funções para timeout e retry de requisições LLM (apenas fetch nativo)
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
      }
      return await fetchWithTimeout(url, options, timeoutMs)
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      lastError = err
      const isRetryable = err.message === 'Request timeout'
      if (!isRetryable || attempt === maxRetries) {
        throw err
      }
      logOps({ topic: 'assistente', status: 'llm_retry', attempt, error: err.message, user: 'system' }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log retry:', logError)
        }
      })
    }
  }
  
  // Este código nunca será alcançado em condições normais, mas mantido para segurança do TypeScript
  throw lastError || new Error('Max retries exceeded')
}

export async function POST(req: NextRequest) {
  // Verificar se requisição foi cancelada ANTES de operações longas
  if (req.signal?.aborted) {
    return NextResponse.json({ error: 'Requisição cancelada.' }, { status: 499 })
  }
  
  const started = performance.now()
  requestCount++
  
  // Limpeza periódica do cache a cada 50 requisições
  if (requestCount % 50 === 0) {
    cleanupCache()
  }
  
  // Limpeza periódica de rate limits em memória a cada 100 requisições (KV expira automaticamente)
  if (requestCount % 100 === 0) {
    cleanupMemoryRateLimits()
    
    // Monitoramento de memória a cada 100 requisições
    const memory = process.memoryUsage()
    const MEMORY_THRESHOLD_DEV = 500 * 1024 * 1024 // 500MB
    const MEMORY_THRESHOLD_PROD = 1024 * 1024 * 1024 // 1GB
    const threshold = process.env.NODE_ENV === 'production' ? MEMORY_THRESHOLD_PROD : MEMORY_THRESHOLD_DEV
    
    logOps({
      topic: 'assistente',
      status: 'memory_check',
      memoryUsed: Math.round(memory.heapUsed / 1024 / 1024),
      memoryTotal: Math.round(memory.heapTotal / 1024 / 1024)
    }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log memory check:', logError)
      }
    })
    
    if (memory.heapUsed > threshold) {
      // Limpar cache agressivamente
      cleanupCache()
      logOps({
        topic: 'assistente',
        status: 'memory_high',
        memoryUsed: Math.round(memory.heapUsed / 1024 / 1024)
      }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log memory high:', logError)
        }
      })
    }
  }
  
  const user = idFromReq(req)
  const sessionId = req.cookies.get('assistente_session')?.value ?? user
  
  // Rate limiting por IP ANTES de parse do body (economia de recursos)
  // Em dev, desativar rate limit para não bloquear testes locais
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? user
  const isDev = process.env.NODE_ENV !== 'production'
  if (!isDev) {
    // Usar KV primeiro (compartilhado), fallback para memória se KV não disponível
    const rateLimitResult = await checkKVRateLimit(String(ip), IP_LIMIT, IP_WINDOW_MS / 1000)
    if (!rateLimitResult.allowed) {
      logOps({ topic: 'assistente', status: 'ip_rate_limit', user: String(ip) }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log rate limit:', logError)
        }
      })
      const retryAfter = rateLimitResult.retryAfter ? ` Aguarde ${rateLimitResult.retryAfter}s.` : ''
      return NextResponse.json(
        { error: `Muitas requisições.${retryAfter}` },
        { 
          status: 429,
          headers: rateLimitResult.retryAfter ? {
            'Retry-After': String(rateLimitResult.retryAfter),
          } : {},
        }
      )
    }
  }
  
  // Circuit breaker com KV (compartilhado) e Half-Open, fallback para memória
  const circuitResult = await checkCircuit(user)
  if (!circuitResult.allowed) {
    logOps({ 
      topic: 'assistente', 
      status: 'circuit_block', 
      user,
      error: circuitResult.reason || `Circuito ${circuitResult.state}`,
    }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log circuit block:', logError)
      }
    })
    return NextResponse.json({ 
      error: circuitResult.reason || 'Modo econômico/seguro ativo. Tente mais tarde.', 
      mode: 'economico' 
    }, { status: 429 })
  }

  // Validação de tamanho do body (proteção DoS)
  const contentLength = req.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (isNaN(size) || size > 10 * 1024) {
      logOps({ topic: 'assistente', status: 'body_too_large', user }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log body too large:', logError)
        }
      })
      return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 })
    }
  }

  const body = await req.json().catch(() => ({}))
  
  // Validar tamanho após parse também (para chunked encoding)
  const bodySize = JSON.stringify(body).length
  if (bodySize > 10 * 1024) {
    logOps({ topic: 'assistente', status: 'body_too_large_parsed', user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log body too large parsed:', logError)
      }
    })
    return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 })
  }

  const { question, history: historyRaw = [], context: contextRaw = {} } = body
  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Pergunta inválida' }, { status: 400 })
  }
  if (question.length > 300) {
    return NextResponse.json({ error: 'Pergunta longa. Resuma em 300 caracteres.' }, { status: 400 })
  }

  // Sanitizar question (proteção injection)
  const sanitized = sanitizeQuestion(question)
  if (!sanitized || sanitized.length === 0) {
    return NextResponse.json({ error: 'Pergunta inválida após sanitização.' }, { status: 400 })
  }

  // Reset métricas a cada hora
  if (shouldResetMetrics()) {
    resetMetrics()
  }

  // Verificar cache PRIMEIRO (usar question original para cache key)
  // Cache KV primeiro (persistente), fallback para memória se KV não disponível
  const cacheKey = getCacheKey('assistente', question)
  const cached = await getFromCache(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    // Cache hit (KV ou memória) - atualizar lastAccessed já foi feito em getFromCache
    incrementCacheHit()
    logOps({ topic: 'assistente', status: 'cache_hit', latencyMs: Math.round(performance.now() - started), user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log cache hit:', logError)
      }
    })
    return createOptimizedResponse(cached.response, true) // Cache hit
  }
  
  incrementCacheMiss()

  // KB PRIMEIRO (fonte da verdade) - antes de qualquer filtro (usar sanitized)
  const kbReplyRaw = askFromKnowledgeBase(sanitized)
  if (kbReplyRaw) {
    // Retornar entryId e responses (client escolhe variação via sessionStorage)
    const actions = validateActions(kbReplyRaw.actions || [], ALLOWED_IDS)
    const response = {
      entryId: kbReplyRaw.entryId,
      responses: kbReplyRaw.responses,
      actions,
      ctas: kbReplyRaw.ctas,
      mode: 'normal' as const,
    }

    // Limpar cache antes de adicionar nova entrada (se necessário)
    cleanupCache()
    
    // Salvar no cache (KV e memória simultaneamente)
    await setInCache(cacheKey, {
      response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      lastAccessed: Date.now(),
    })

    await registerSuccess(user) // Circuit breaker: registrar sucesso (KV + fallback memória)
    const latency = Math.round(performance.now() - started)
    logOps({ topic: 'assistente', status: 'kb_hit', latencyMs: latency, mode: 'normal', user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log KB hit:', logError)
      }
    })
    return createOptimizedResponse(response, false) // KB hit (não é cache hit do endpoint)
  }

  // Se KB não tiver resposta, validar history apenas quando necessário (lazy evaluation)
  const validHistory: Array<{ role: string; content: string }> = []
  if (Array.isArray(historyRaw)) {
    const limitedHistory = historyRaw.length > 10 ? historyRaw.slice(-10) : historyRaw
    
    // Loop único combinando filter+map (mais eficiente)
    for (const h of limitedHistory) {
      if (h && typeof h === 'object' && h.role && h.content) {
        validHistory.push({
          role: String(h.role),
          content: String(h.content).slice(0, 200) // Truncar para 200 caracteres
        })
      }
    }
  }

  // Preparar contexto do clique (quando usuário seleciona um item da página)
  const context =
    contextRaw && typeof contextRaw === 'object' ? (contextRaw as Record<string, unknown>) : {}
  const clickedTargetId =
    typeof context.clickedTargetId === 'string' ? context.clickedTargetId.slice(0, 64) : ''
  const clickedTextRaw = typeof context.clickedText === 'string' ? context.clickedText : ''
  const clickedText = clickedTextRaw
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
  const clickedTag =
    typeof context.clickedTag === 'string' ? context.clickedTag.slice(0, 32) : ''
  const safeClickedTargetId = ALLOWED_IDS.includes(clickedTargetId) ? clickedTargetId : ''
  const hasClickContext = Boolean(safeClickedTargetId || clickedText)

  // Se KB não tiver resposta, aplicar filtro de escopo ANTES de chamar LLM (usar sanitized)
  const normalized = sanitized.toLowerCase()
  const inScope = hasClickContext || SCOPE_KEYWORDS.some((k) => normalized.includes(k))
  if (!inScope) {
    logOps({ topic: 'assistente', status: 'out_of_scope', user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log out of scope:', logError)
      }
    })
    return NextResponse.json({ error: 'Fora de escopo. Pergunte sobre cadastro, análise, proteção, aprendizado ou resultados.' }, { status: 400 })
  }

  // Verificar budget antes de chamar LLM
  const ok = checkBudget(user, sessionId)
  if (!ok) {
    logOps({ topic: 'assistente', status: 'budget_exceeded', user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log budget exceeded:', logError)
      }
    })
    return NextResponse.json({ error: 'Limite atingido. Tente mais tarde.' }, { status: 429 })
  }

  // Se KB não tiver resposta, chamar LLM
  const groqKey = process.env.GROQ_API_KEY
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (!groqKey && !openRouterKey) {
    await registerFailure(user) // Circuit breaker: registrar falha (KV + fallback memória)
    logOps({ topic: 'assistente', status: 'no_api_key', user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log no API key:', logError)
      }
    })
    return NextResponse.json({ error: 'Assistente temporariamente indisponível.' }, { status: 503 })
  }

  // Verificar se streaming foi solicitado (query param)
  const streamMode = req.nextUrl.searchParams.get('stream') === 'true'

  // Detectar intenção do usuário ANTES de construir o prompt
  // Usar detectMultiple=true para detectar intenções compostas
  // Usar considerHistory=true para considerar contexto de conversa
  const detectedIntent = detectIntent(sanitized, {
    detectMultiple: true,
    considerHistory: true,
    useFuzzy: true,
  })
  
  // Log da intenção detectada (para debugging)
    logOps({
      topic: 'assistente',
      status: 'intent_detected',
      intent: detectedIntent.type,
      confidence: detectedIntent.confidence,
      keywords: detectedIntent.keywords.join(', '),
      secondaryIntents: detectedIntent.secondaryIntents?.join(', ') || '',
      user,
    }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log intent detected:', logError)
      }
    })

  const clickContextBlock = hasClickContext
    ? `\nCONTEXTO DO CLIQUE:\n- targetId: ${safeClickedTargetId || 'não mapeado'}\n- texto: ${clickedText || 'sem texto visível'}\n- elemento: ${clickedTag || 'desconhecido'}\n`
    : ''

  const baseSystemPrompt = `Você é um assistente de vendas da plataforma DVAi$ - Mentor IA, uma plataforma de investimentos que usa IA para guiar usuários nas principais corretoras.

REGRAS OBRIGATÓRIAS (NUNCA VIOLAR):
1. NUNCA pedir senha, 2FA, código SMS, seed phrase, chave privada.
2. NUNCA prometer lucro garantido, "risco zero", "100% certo".
3. NUNCA afirmar que é corretora, banco, ou que faz custódia.
4. NUNCA falar de código interno, repositório, Vercel, variáveis secretas.
5. NUNCA mencionar "MVP", "em breve", "futuro", "ainda não existe".
6. NUNCA mencionar avatar 3D.
7. NUNCA entrar em assuntos fora do produto (futebol/política/religião).
8. Sempre usar linguagem responsável e educacional.
9. Ao falar o nome da plataforma, pronuncie como "Davi".

REGRAS PARA CLIQUE NA PÁGINA:
- Se houver CONTEXTO DO CLIQUE, responda levando em conta o item selecionado.
- Se não houver targetId mapeado, explique de forma simples o que o item representa pelo texto visível e pergunte o que o usuário quer saber mais.
- Se a pergunta for genérica ("o que é isso?"), use o CONTEXTO DO CLIQUE para responder.

QUANDO USAR CADA ACTION:
- navigateRoute: Quando a informação está em outra página (ex: análise em tempo real, segurança, aprendizado).
- scrollToSection: Quando a informação está na mesma página, mas em outra seção.
- highlightSection: Quando quer destacar visualmente uma seção (pode combinar com scrollToSection).
- showTooltip: Quando quer mostrar dica contextual sobre um elemento.

Sua resposta deve ser curta (máximo 15 segundos de fala, ~250 caracteres).
Sempre responda em JSON válido com este formato:
{
  "spokenText": "sua resposta curta aqui",
  "actions": [{"type": "navigateRoute"|"scrollToSection"|"highlightSection"|"showTooltip", "route": "...", "targetId": "..."}],
  "mode": "normal"
}

targetId permitidos: hero-content, features-section, stats-section, analise-hero, seguranca-hero, aprendizado-hero, login-card, cadastro-card, button-comecar-agora, button-login, nav-analise, nav-seguranca, nav-aprendizado, etc.
Rotas permitidas: /, /cadastro, /login, /seguranca, /analise-tempo-real, /aprendizado-continuo.
NUNCA retorne selector CSS direto, sempre use targetId.${clickContextBlock}`

  // Ajustar prompt baseado na intenção detectada
  const systemPrompt = getIntentBasedPrompt(detectedIntent, baseSystemPrompt)

  // Verificar se requisição foi cancelada antes de chamar LLM
  if (req.signal?.aborted) {
    return NextResponse.json({ error: 'Requisição cancelada.' }, { status: 499 })
  }

  try {
    const llmUrl = groqKey
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions'
    const llmHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (groqKey) {
      llmHeaders['Authorization'] = `Bearer ${groqKey}`
    } else if (openRouterKey) {
      llmHeaders['Authorization'] = `Bearer ${openRouterKey}`
      llmHeaders['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL || 'https://dvais-mentor-ia.vercel.app'
      llmHeaders['X-Title'] = 'DVAi$ - Mentor IA'
    }

    // Construir mensagens com histórico (últimas 10 mensagens)
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]
    
    // Adicionar histórico de conversa validado (já processado acima quando KB não respondeu - lazy evaluation)
    for (const h of validHistory) {
      if (h.role === 'user' || h.role === 'assistant') {
        messages.push({ role: h.role as 'user' | 'assistant', content: h.content })
      }
    }
    
    // Adicionar pergunta atual (usar sanitized)
    messages.push({ role: 'user', content: sanitized })

    const llmBody: Record<string, unknown> = {
      model: groqKey ? 'llama-3.3-70b-versatile' : 'mistralai/mistral-7b-instruct:free',
      messages,
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    }

    // Se streaming solicitado, processar stream
    if (streamMode) {
      try {
        llmBody.stream = true // Ativar streaming no LLM
        
        // Timeout: 10s para Groq, 15s para OpenRouter
        const timeoutMs = groqKey ? 10000 : 15000
        const llmResp = await fetchWithRetry(
          llmUrl,
          {
            method: 'POST',
            headers: llmHeaders,
            body: JSON.stringify(llmBody),
          },
          timeoutMs,
          2 // maxRetries
        )
        
        if (!llmResp.ok) {
          throw new Error(`LLM error: ${llmResp.status}`)
        }
        
        // Criar ReadableStream para SSE
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const reader = llmResp.body?.getReader()
              const decoder = new TextDecoder()
              let buffer = ''
              
              while (true) {
                const { done, value } = await reader!.read()
                if (done) break
                
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || '' // Manter última linha incompleta
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') {
                      controller.close()
                      return
                    }
                    
                    try {
                      const chunk = JSON.parse(data)
                      const token = chunk.choices?.[0]?.delta?.content
                      if (token) {
                        controller.enqueue(
                          new TextEncoder().encode(`data: ${JSON.stringify({ token })}\n\n`)
                        )
                      }
                    } catch {
                      // Ignorar linhas inválidas
                    }
                  }
                }
              }
              
              controller.close()
            } catch (error: unknown) {
              controller.error(error instanceof Error ? error : new Error('stream_error'))
            }
          },
        })
        
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } catch (error: unknown) {
        await registerFailure(user) // Circuit breaker: registrar falha
        const message = error instanceof Error ? error.message : 'unknown'
        logOps({ topic: 'assistente', status: 'stream_error', error: message, user }).catch((logError) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('[LogOps] Failed to log stream error:', logError)
          }
        })
        return NextResponse.json({ error: 'Erro ao processar streaming.' }, { status: 500 })
      }
    }

    // Modo não-streaming (lógica existente)
    // Timeout: 10s para Groq, 15s para OpenRouter
    const timeoutMs = groqKey ? 10000 : 15000
    const llmResp = await fetchWithRetry(
      llmUrl,
      {
        method: 'POST',
        headers: llmHeaders,
        body: JSON.stringify(llmBody),
      },
      timeoutMs,
      2 // maxRetries
    )

    if (!llmResp.ok) {
      await registerFailure(user) // Circuit breaker: registrar falha (KV + fallback memória)
      logOps({ topic: 'assistente', status: 'llm_error', error: `LLM ${llmResp.status}`, user }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log LLM error:', logError)
        }
      })
      return NextResponse.json({ error: 'Erro ao processar pergunta.' }, { status: 500 })
    }

    const llmData = await llmResp.json()
    const content = llmData.choices?.[0]?.message?.content
    if (!content) {
      await registerFailure(user) // Circuit breaker: registrar falha (KV + fallback memória)
      logOps({ topic: 'assistente', status: 'llm_no_content', user }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log LLM no content:', logError)
        }
      })
      return NextResponse.json({ error: 'Resposta inválida do assistente.' }, { status: 500 })
    }

    let parsed: AssistantResponse & { responses?: unknown; entryId?: string; ctas?: unknown }
    try {
      parsed = JSON.parse(content)
    } catch {
      await registerFailure(user) // Circuit breaker: registrar falha (KV + fallback memória)
      logOps({ topic: 'assistente', status: 'llm_invalid_json', user }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log LLM invalid JSON:', logError)
        }
      })
      return NextResponse.json({ error: 'Resposta inválida do assistente.' }, { status: 500 })
    }

    if (!parsed.spokenText || typeof parsed.spokenText !== 'string') {
      await registerFailure(user) // Circuit breaker: registrar falha (KV + fallback memória)
      logOps({ topic: 'assistente', status: 'llm_invalid_schema', user }).catch((logError) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[LogOps] Failed to log LLM invalid schema:', logError)
        }
      })
      return NextResponse.json({ error: 'Resposta inválida do assistente.' }, { status: 500 })
    }

    const spoken = enforceSpeechDuration(parsed.spokenText)
    const actions = validateActions(
      Array.isArray(parsed.actions) ? (parsed.actions as Action[]) : [],
      ALLOWED_IDS
    )

    const response = {
      spokenText: spoken,
      onScreenTopic: parsed.onScreenTopic,
      actions,
      requiresUserClick: parsed.requiresUserClick ?? false,
      confidence: parsed.confidence ?? 0.8,
      mode: parsed.mode || 'normal',
    }

    // Limpar cache antes de adicionar nova entrada (se necessário)
    cleanupCache()
    
    // Salvar no cache (KV e memória simultaneamente)
    await setInCache(cacheKey, {
      response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      lastAccessed: Date.now(),
    })

    await registerSuccess(user) // Circuit breaker: registrar sucesso (KV + fallback memória)
    const latency = Math.round(performance.now() - started)
    logOps({ topic: 'assistente', status: 'ok', latencyMs: latency, tokens: llmData.usage?.total_tokens, mode: response.mode, user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log OK:', logError)
      }
    })
    return createOptimizedResponse(response, false) // LLM response (não é cache hit)
  } catch (error: unknown) {
    await registerFailure(user) // Circuit breaker: registrar falha (KV + fallback memória)
    const message = error instanceof Error ? error.message : 'unknown'
    logOps({ topic: 'assistente', status: 'llm_exception', error: message, user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log LLM exception:', logError)
      }
    })
    return NextResponse.json({ error: 'Erro ao processar pergunta.' }, { status: 500 })
  }
}

// Helper para criar resposta otimizada com cache headers e compression
async function createOptimizedResponse(data: AssistantResponse, isCacheHit: boolean = false): Promise<NextResponse> {
  const jsonString = JSON.stringify(data)
  
  // Comprimir resposta se maior que 1KB
  const shouldCompress = process.env.NODE_ENV === 'production' && jsonString.length > 1024
  let body: BodyInit = jsonString
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (shouldCompress) {
    try {
      const compressed = await gzipAsync(Buffer.from(jsonString))
      body = new Uint8Array(compressed)
      headers['Content-Encoding'] = 'gzip'
    } catch {
      // Se compressão falhar, usar resposta não comprimida
      body = jsonString
    }
  }

  // Em desenvolvimento, evitar cache para não mascarar mudanças locais
  if (process.env.NODE_ENV !== 'production') {
    headers['Cache-Control'] = 'no-store'
    return new NextResponse(body, {
      headers,
    })
  }
  
  // Edge caching headers (Vercel CDN)
  if (isCacheHit) {
    // Cache hit: cachear por mais tempo na edge
    headers['Cache-Control'] = 'public, s-maxage=600, stale-while-revalidate=300, max-age=60'
    headers['CDN-Cache-Control'] = 'public, s-maxage=600'
    headers['Vercel-CDN-Cache-Control'] = 'public, s-maxage=600'
  } else {
    // Cache miss: cachear por menos tempo (mas ainda cachear)
    headers['Cache-Control'] = 'public, s-maxage=300, stale-while-revalidate=60, max-age=30'
    headers['CDN-Cache-Control'] = 'public, s-maxage=300'
    headers['Vercel-CDN-Cache-Control'] = 'public, s-maxage=300'
  }
  
  return new NextResponse(body, {
    headers,
  })
}
