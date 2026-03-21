import { logOps } from '@/biblioteca/logs/logOps'
import { enforceSpeechDuration } from '@/biblioteca/assistente/speechGate'
import { validateActions } from '@/biblioteca/assistente/actionValidator'
import type { Action } from '@/biblioteca/assistente/actionValidator'
import { getIntentBasedPrompt, type DetectedIntent } from '@/biblioteca/assistente/intentDetection'
import type { AssistantResponse } from '@/app/api/assistente/state'

// --- fetch helpers ---

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

  throw lastError || new Error('Max retries exceeded')
}

// --- system prompt ---

const BASE_SYSTEM_PROMPT = `Você é o assistente contextual do projeto DVAi$ - Mentor IA, uma vitrine técnica que demonstra navegação guiada, explicação de interface e uso responsável de IA.

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
NUNCA retorne selector CSS direto, sempre use targetId.`

// --- types ---

export type LLMResult =
  | { type: 'response'; response: AssistantResponse & { responses?: unknown; entryId?: string; ctas?: unknown } }
  | { type: 'stream'; streamResponse: Response }
  | { type: 'error'; status: number; message: string }

export type LLMRequest = {
  sanitizedQuestion: string
  validHistory: Array<{ role: string; content: string }>
  clickContextBlock: string
  detectedIntent: DetectedIntent
  streamMode: boolean
  allowedIds: readonly string[]
}

// --- adapter ---

/**
 * Chama o LLM (Groq ou OpenRouter) com retry, timeout e streaming support.
 */
export async function callLLM(
  request: LLMRequest,
  signal?: AbortSignal | null
): Promise<LLMResult> {
  const groqKey = process.env.GROQ_API_KEY
  const openRouterKey = process.env.OPENROUTER_API_KEY

  if (!groqKey && !openRouterKey) {
    return { type: 'error', status: 503, message: 'Assistente temporariamente indisponível.' }
  }

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

  // Build system prompt with click context
  const systemPrompt = getIntentBasedPrompt(
    request.detectedIntent,
    BASE_SYSTEM_PROMPT + request.clickContextBlock
  )

  // Build messages
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]
  for (const h of request.validHistory) {
    if (h.role === 'user' || h.role === 'assistant') {
      messages.push({ role: h.role as 'user' | 'assistant', content: h.content })
    }
  }
  messages.push({ role: 'user', content: request.sanitizedQuestion })

  const llmBody: Record<string, unknown> = {
    model: groqKey ? 'llama-3.3-70b-versatile' : 'mistralai/mistral-7b-instruct:free',
    messages,
    temperature: 0.7,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  }

  const timeoutMs = groqKey ? 10000 : 15000

  // Check abort before calling
  if (signal?.aborted) {
    return { type: 'error', status: 499, message: 'Requisição cancelada.' }
  }

  // --- streaming mode ---
  if (request.streamMode) {
    llmBody.stream = true

    const llmResp = await fetchWithRetry(
      llmUrl,
      { method: 'POST', headers: llmHeaders, body: JSON.stringify(llmBody) },
      timeoutMs,
      2
    )

    if (!llmResp.ok) {
      throw new Error(`LLM error: ${llmResp.status}`)
    }

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
            buffer = lines.pop() || ''

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

    return {
      type: 'stream',
      streamResponse: new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }),
    }
  }

  // --- non-streaming mode ---
  const llmResp = await fetchWithRetry(
    llmUrl,
    { method: 'POST', headers: llmHeaders, body: JSON.stringify(llmBody) },
    timeoutMs,
    2
  )

  if (!llmResp.ok) {
    return { type: 'error', status: 500, message: `LLM ${llmResp.status}` }
  }

  const llmData = await llmResp.json()
  const content = llmData.choices?.[0]?.message?.content
  if (!content) {
    return { type: 'error', status: 500, message: 'llm_no_content' }
  }

  let parsed: AssistantResponse & { responses?: unknown; entryId?: string; ctas?: unknown }
  try {
    parsed = JSON.parse(content)
  } catch {
    return { type: 'error', status: 500, message: 'llm_invalid_json' }
  }

  if (!parsed.spokenText || typeof parsed.spokenText !== 'string') {
    return { type: 'error', status: 500, message: 'llm_invalid_schema' }
  }

  const spoken = enforceSpeechDuration(parsed.spokenText)
  const actions = validateActions(
    Array.isArray(parsed.actions) ? (parsed.actions as Action[]) : [],
    [...request.allowedIds]
  )

  return {
    type: 'response',
    response: {
      spokenText: spoken,
      onScreenTopic: parsed.onScreenTopic,
      actions,
      requiresUserClick: parsed.requiresUserClick ?? false,
      confidence: parsed.confidence ?? 0.8,
      mode: parsed.mode || 'normal',
    },
  }
}
