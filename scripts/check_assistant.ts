#!/usr/bin/env npx tsx
/**
 * Diagnóstico rápido do assistente.
 * Uso: npx tsx scripts/check_assistant.ts [base_url]
 *
 * Verifica:
 * 1. Variáveis de ambiente locais (informativo)
 * 2. Health endpoint (llm, kbVersion e build/deploy info)
 * 3. Smoke do assistente para perguntas críticas de demo
 *
 * Exit code 0 = tudo ok, 1 = falha crítica
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const TIMEOUT_MS = 10_000

type HealthResponse = {
  status: string
  kbVersion?: string | null
  build?: {
    gitSha?: string | null
    gitShortSha?: string | null
    buildId?: string | null
  }
  llm: {
    configured: boolean
    status: 'ok' | 'degraded' | 'unconfigured'
    provider: string | null
    model: string | null
    lastKnownErrorType: string | null
    lastSuccessAt: number | null
  }
}

type AssistantResponse = {
  spokenText?: string
  responses?: string[]
  entryId?: string
  error?: string
  errorType?: string
}

type SmokeCase = {
  question: string
  expectedAny: string[]
  expectedAll?: string[]
}

const SMOKE_CASES: SmokeCase[] = [
  {
    question: 'o que é o DVAi$?',
    expectedAny: ['plataforma', 'mentoria', 'investimentos'],
  },
  {
    question: 'o que vocês oferecem?',
    expectedAny: ['análise', 'proteção', 'aprendizado'],
  },
  {
    question: 'funciona no celular?',
    expectedAny: ['ligar o davi', 'modo degradado em texto', 'voz contínua'],
    expectedAll: ['navegador'],
  },
  {
    question: 'como usar a voz?',
    expectedAny: ['falar com davi', 'volto a escutar', 'modo degradado em texto'],
  },
]

function log(icon: string, msg: string) {
  console.log(`  ${icon}  ${msg}`)
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isLocalBaseUrl(baseUrl: string): boolean {
  return /localhost|127\.0\.0\.1/.test(baseUrl)
}

function extractAssistantTexts(data: AssistantResponse): string[] {
  if (typeof data.spokenText === 'string' && data.spokenText.trim().length > 0) {
    return [data.spokenText]
  }

  if (Array.isArray(data.responses) && data.responses.length > 0) {
    return data.responses.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  }

  return []
}

function matchesExpectation(texts: string[], expectedAny: string[], expectedAll?: string[]): boolean {
  const joined = normalizeText(texts.join(' '))
  const anyMatch = expectedAny.some(term => joined.includes(normalizeText(term)))
  const allMatch = (expectedAll || []).every(term => joined.includes(normalizeText(term)))
  return anyMatch && allMatch
}

async function fetchJSON<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    const data = (await res.json()) as T
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: null }
  }
}

async function main() {
  let failures = 0
  console.log(`\n  Diagnóstico do Assistente — ${BASE_URL}\n`)

  console.log('  --- Variáveis de ambiente ---')
  const groq = process.env.GROQ_API_KEY
  const openrouter = process.env.OPENROUTER_API_KEY
  if (groq) {
    log('✓', `GROQ_API_KEY configurada (${groq.slice(0, 8)}...)`)
  } else {
    log('–', 'GROQ_API_KEY ausente')
  }
  if (openrouter) {
    log('✓', `OPENROUTER_API_KEY configurada (${openrouter.slice(0, 8)}...)`)
  } else {
    log('–', 'OPENROUTER_API_KEY ausente')
  }
  if (!groq && !openrouter) {
    log('–', 'Sem chave LLM local — isso é aceitável se você estiver checando apenas a produção remota')
  }

  console.log('\n  --- Health endpoint ---')
  const health = await fetchJSON<HealthResponse>(`${BASE_URL}/api/health`)
  if (!health.ok || !health.data) {
    log('✗', `Falha ao acessar /api/health (status: ${health.status})`)
    failures++
  } else {
    const h = health.data
    log(h.status === 'ok' ? '✓' : '!', `status: ${h.status}`)
    log(h.llm.configured ? '✓' : '!', `llm.configured: ${h.llm.configured}`)
    log('→', `llm.status: ${h.llm.status}`)
    log('→', `llm.provider: ${h.llm.provider || 'nenhum'}`)
    log('→', `llm.model: ${h.llm.model || 'nenhum'}`)
    log('→', `kbVersion: ${h.kbVersion || 'ausente'}`)
    log(
      '→',
      `build: sha=${h.build?.gitShortSha || h.build?.gitSha || 'ausente'} buildId=${h.build?.buildId || 'ausente'}`
    )

    if (!h.kbVersion || h.kbVersion === '1.0.0') {
      log('✗', 'kbVersion ainda está genérica; o health não está provando o rollout real')
      failures++
    }

    if (!isLocalBaseUrl(BASE_URL) && !h.build?.gitSha && !h.build?.buildId) {
      log('✗', 'produção sem gitSha/buildId no health; não dá para confirmar qual build está no ar')
      failures++
    }
  }

  console.log('\n  --- Smoke do assistente ---')
  for (const smokeCase of SMOKE_CASES) {
    const userId = `check-script-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const response = await fetchJSON<AssistantResponse>(`${BASE_URL}/api/assistente/perguntar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        question: smokeCase.question,
        history: [],
        context: {},
      }),
    })

    if (!response.ok || !response.data) {
      log('✗', `Falha ao consultar "${smokeCase.question}" (status: ${response.status})`)
      failures++
      continue
    }

    const data = response.data
    const texts = extractAssistantTexts(data)

    if (data.errorType === 'missing_api_key') {
      log('✗', `Pergunta "${smokeCase.question}" falhou por missing_api_key`)
      failures++
      continue
    }

    if (texts.length === 0) {
      log('✗', `Pergunta "${smokeCase.question}" retornou payload sem spokenText/responses válidos`)
      log('→', JSON.stringify(data).slice(0, 220))
      failures++
      continue
    }

    if (!matchesExpectation(texts, smokeCase.expectedAny, smokeCase.expectedAll)) {
      log('✗', `Pergunta "${smokeCase.question}" respondeu fora do esperado`)
      log('→', texts[0].slice(0, 160))
      failures++
      continue
    }

    log('✓', `Pergunta "${smokeCase.question}" OK`)
    log('→', texts[0].slice(0, 160))
  }

  console.log('\n  --- Resultado ---')
  if (failures > 0) {
    log('✗', `${failures} falha(s) encontrada(s)`)
    process.exit(1)
  }

  log('✓', 'Diagnóstico concluído sem falhas críticas')
  process.exit(0)
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
