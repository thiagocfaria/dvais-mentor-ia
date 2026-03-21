import { NextRequest, NextResponse } from 'next/server'
import { sanitizeQuestion } from '@/biblioteca/assistente/sanitize'
import { logOps } from '@/biblioteca/logs/logOps'

export function idFromReq(req: NextRequest): string {
  const uid = req.headers.get('x-user-id')
  if (uid) return uid
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'anon'
  return String(ip)
}

type ValidationSuccess = {
  ok: true
  question: string
  sanitized: string
  historyRaw: unknown[]
  contextRaw: unknown
}

type ValidationFailure = {
  ok: false
  response: NextResponse
}

/**
 * Valida body da requisição: tamanho, formato da pergunta e sanitização.
 * Retorna early com NextResponse se inválido.
 */
export async function validateRequestBody(
  req: NextRequest,
  user: string
): Promise<ValidationSuccess | ValidationFailure> {
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
      return { ok: false, response: NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 }) }
    }
  }

  const body = await req.json().catch(() => ({}))

  const bodySize = JSON.stringify(body).length
  if (bodySize > 10 * 1024) {
    logOps({ topic: 'assistente', status: 'body_too_large_parsed', user }).catch((logError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[LogOps] Failed to log body too large parsed:', logError)
      }
    })
    return { ok: false, response: NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 }) }
  }

  const { question, history: historyRaw = [], context: contextRaw = {} } = body
  if (!question || typeof question !== 'string') {
    return { ok: false, response: NextResponse.json({ error: 'Pergunta inválida' }, { status: 400 }) }
  }
  if (question.length > 300) {
    return { ok: false, response: NextResponse.json({ error: 'Pergunta longa. Resuma em 300 caracteres.' }, { status: 400 }) }
  }

  const sanitized = sanitizeQuestion(question)
  if (!sanitized || sanitized.length === 0) {
    return { ok: false, response: NextResponse.json({ error: 'Pergunta inválida após sanitização.' }, { status: 400 }) }
  }

  return { ok: true, question, sanitized, historyRaw, contextRaw }
}
