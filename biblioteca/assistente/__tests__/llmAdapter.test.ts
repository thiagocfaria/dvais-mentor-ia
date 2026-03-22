import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock logOps before importing callLLM
vi.mock('@/biblioteca/logs/logOps', () => ({
  logOps: vi.fn(),
}))

// Mock updateLLMHealth
vi.mock('@/app/api/assistente/state', () => ({
  updateLLMHealth: vi.fn(),
}))

// Mock enforceSpeechDuration
vi.mock('@/biblioteca/assistente/speechGate', () => ({
  enforceSpeechDuration: (text: string) => text,
}))

// Mock validateActions
vi.mock('@/biblioteca/assistente/actionValidator', () => ({
  validateActions: (actions: unknown[]) => actions,
}))

// Mock intentDetection
vi.mock('@/biblioteca/assistente/intentDetection', () => ({
  getIntentBasedPrompt: (_intent: unknown, base: string) => base,
}))

import { callLLM } from '../llmAdapter'
import type { LLMRequest } from '../llmAdapter'

function makeRequest(overrides?: Partial<LLMRequest>): LLMRequest {
  return {
    sanitizedQuestion: 'o que e o DVAi$?',
    effectiveQuestion: 'o que e o DVAi$?',
    validHistory: [],
    clickContextBlock: '',
    conversationContextBlock: '',
    detectedIntent: { type: 'pergunta_especifica', confidence: 0.9 },
    streamMode: false,
    allowedIds: [],
    ...overrides,
  }
}

describe('callLLM', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.GROQ_API_KEY
    delete process.env.OPENROUTER_API_KEY
  })

  afterEach(() => {
    process.env.GROQ_API_KEY = originalEnv.GROQ_API_KEY
    process.env.OPENROUTER_API_KEY = originalEnv.OPENROUTER_API_KEY
    vi.restoreAllMocks()
  })

  test('retorna 503 missing_api_key quando nenhuma chave esta configurada', async () => {
    const result = await callLLM(makeRequest())

    expect(result.type).toBe('error')
    expect(result.status).toBe(503)
    expect(result.errorType).toBe('missing_api_key')
    expect(result.message).toContain('chave de IA')
  })

  test('usa provider groq quando GROQ_API_KEY esta configurada', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key'

    const llmJson = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              spokenText: 'O DVAi$ e um assistente de IA.',
              actions: [],
            }),
          },
        },
      ],
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(llmJson),
        text: () => Promise.resolve(JSON.stringify(llmJson)),
      })
    )

    const result = await callLLM(makeRequest())

    expect(result.type).toBe('response')
    expect(result.provider).toBe('groq')
    expect(result.model).toBe('llama-3.3-70b-versatile')
    if (result.type === 'response') {
      expect(result.response.spokenText).toBeTruthy()
    }
  })
})
