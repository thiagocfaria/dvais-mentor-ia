#!/usr/bin/env npx tsx
/**
 * Diagnóstico rápido do assistente.
 * Uso: npx tsx scripts/check_assistant.ts [base_url]
 *
 * Verifica:
 * 1. Variáveis de ambiente (GROQ_API_KEY / OPENROUTER_API_KEY)
 * 2. Health endpoint (llm.configured, llm.status)
 * 3. Rota principal do assistente (se provider configurado)
 *
 * Exit code 0 = tudo ok, 1 = falha crítica
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const TIMEOUT_MS = 10_000

type HealthResponse = {
  status: string
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
  error?: string
  errorType?: string
}

function log(icon: string, msg: string) {
  console.log(`  ${icon}  ${msg}`)
}

async function fetchJSON<T>(url: string): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    const data = (await res.json()) as T
    return { ok: res.ok, status: res.status, data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 0, data: null }
  }
}

async function main() {
  let failures = 0
  console.log(`\n  Diagnóstico do Assistente — ${BASE_URL}\n`)

  // 1. Variáveis de ambiente
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
    log('!', 'Nenhuma chave LLM configurada — apenas respostas KB funcionarão')
  }

  // 2. Health endpoint
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
    if (h.llm.lastKnownErrorType) {
      log('!', `llm.lastKnownErrorType: ${h.llm.lastKnownErrorType}`)
    }
    if (!h.llm.configured) {
      log('!', 'LLM não configurado — cenários que exigem IA livre falharão com erro explícito')
    }
  }

  // 3. Rota do assistente
  console.log('\n  --- Rota /api/assistente/perguntar ---')
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${BASE_URL}/api/assistente/perguntar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'check-script',
      },
      body: JSON.stringify({
        question: 'o que é o DVAi$?',
        history: [],
        context: {},
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const elapsed = Date.now() - start
    const data = (await res.json()) as AssistantResponse

    if (res.ok && data.spokenText) {
      log('✓', `Resposta OK em ${elapsed}ms`)
      log('→', `spokenText: ${data.spokenText.slice(0, 120)}...`)
    } else if (data.errorType === 'missing_api_key') {
      log('!', `LLM não configurado — erro esperado (${elapsed}ms)`)
      log('→', `errorType: ${data.errorType}`)
    } else {
      log('✗', `Erro inesperado (status: ${res.status}, ${elapsed}ms)`)
      log('→', JSON.stringify(data).slice(0, 200))
      failures++
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log('✗', `Falha de conexão: ${msg}`)
    failures++
  }

  // Resultado final
  console.log('\n  --- Resultado ---')
  if (failures > 0) {
    log('✗', `${failures} falha(s) encontrada(s)`)
    process.exit(1)
  } else {
    log('✓', 'Diagnóstico concluído sem falhas críticas')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
