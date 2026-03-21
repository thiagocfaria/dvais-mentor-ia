import { describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import * as knowledgeBase from '@/biblioteca/assistente/knowledgeBase'

vi.mock('@/biblioteca/logs/logOps', () => ({
  logOps: vi.fn().mockResolvedValue(undefined),
}))

function buildRequest(body: Record<string, unknown>, opts?: { userId?: string; ip?: string }) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (opts?.userId) headers['x-user-id'] = opts.userId
  if (opts?.ip) headers['x-forwarded-for'] = opts.ip
  headers['cookie'] = `assistente_session=${opts?.userId || 'unit-session'}`

  return new NextRequest('http://localhost/api/assistente/perguntar', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/assistente/perguntar', () => {
  test('retorna 400 para pergunta fora de escopo', async () => {
    const kbSpy = vi
      .spyOn(knowledgeBase, 'askFromKnowledgeBase')
      .mockReturnValue(null)
    const req = buildRequest(
      { question: 'qzxwvu ytsrpn', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `1.1.1.${Math.floor(Math.random() * 200)}` }
    )
    const res = await POST(req)
    expect(res.status).toBe(400)
    kbSpy.mockRestore()
  })

  test('retorna KB quando ha match', async () => {
    const req = buildRequest(
      { question: 'o que é o DVAi$?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `2.2.2.${Math.floor(Math.random() * 200)}` }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.entryId).toBe('elevator_pitch')
    expect(Array.isArray(data.responses)).toBe(true)
  })

  test('retorna actions esperadas para cadastro', async () => {
    const req = buildRequest(
      { question: 'quero fazer cadastro', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `3.3.3.${Math.floor(Math.random() * 200)}` }
    )
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.entryId).toBe('cadastro')
    expect(data.actions?.[0]).toMatchObject({
      type: 'navigateRoute',
      route: '/cadastro',
      targetId: 'cadastro-card',
    })
  })
})
