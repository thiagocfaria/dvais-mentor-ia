import { describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as knowledgeBase from '@/biblioteca/assistente/knowledgeBase'
import { POST } from '../route'

vi.mock('@/biblioteca/logs/logOps', () => ({
  logOps: vi.fn().mockResolvedValue(undefined),
}))

const callLLMMock = vi.fn()

vi.mock('@/biblioteca/assistente/llmAdapter', () => ({
  callLLM: (...args: unknown[]) => callLLMMock(...args),
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
  test.beforeEach(() => {
    callLLMMock.mockReset()
  })

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

  test('responde com suporte contextual para uso no iphone sem depender do LLM', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Resposta genérica que não deveria ser usada.',
        actions: [],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      { question: 'nao consigo usar no iphone', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `4.4.4.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(String(data.spokenText)).toContain('Texto + toque')
  })

  test('responde com diagnóstico contextual para celular sem depender do LLM', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Verifique sua conexão.',
        actions: [],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      { question: 'nao funciona no celular', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `11.11.11.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(String(data.spokenText)).toMatch(/texto \+ toque/i)
    expect(String(data.spokenText)).toMatch(/navegador|compatibilidade/i)
  })

  test('responde com diagnóstico contextual para microfone sem depender do LLM', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Tente novamente mais tarde.',
        actions: [],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      { question: 'o microfone nao funciona', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `12.12.12.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(String(data.spokenText)).toMatch(/microfone|permiss[aã]o/i)
    expect(String(data.spokenText)).toMatch(/tocar para falar|push-to-talk/i)
  })

  test('responde com diagnóstico contextual para voz sem fala sem depender do LLM', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Algo deu errado.',
        actions: [],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      { question: 'a voz nao fala', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `13.13.13.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(String(data.spokenText)).toMatch(/ouvir resposta|toque na tela|gesto/i)
    expect(String(data.spokenText)).toMatch(/audio|áudio|voz/i)
  })

  test('bypassa KB para pergunta generica com contexto de clique e usa LLM', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Esse card resume as capacidades do assistente contextual por voz e clique.',
        actions: [{ type: 'highlightSection', targetId: 'features-section' }],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      {
        question: 'o que e isso?',
        history: [],
        context: {
          clickedTargetId: 'features-section',
          clickedText: 'Assistente contextual por voz e clique',
          clickedTag: 'button',
        },
      },
      { userId: `unit-${Date.now()}`, ip: `5.5.5.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(data.spokenText).toContain('assistente contextual')
  })

  test('aceita contexto de clique em payload legado no topo do body', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Esse item resume as funcionalidades principais do assistente.',
        actions: [{ type: 'highlightSection', targetId: 'features-section' }],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      {
        question: 'me explica isso',
        history: [],
        clickedTargetId: 'features-section',
        clickedText: 'Assistente contextual por voz e clique',
        clickedTag: 'button',
      },
      { userId: `unit-${Date.now()}`, ip: `6.6.6.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(data.spokenText).toContain('funcionalidades')
  })

  test('usa histórico recente para aceitar follow-up elíptico de cadastro', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Depois do cadastro, o próximo passo é entrar e seguir a navegação guiada para análise, proteção e aprendizado.',
        actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      {
        question: 'e depois disso?',
        history: [
          { role: 'user', content: 'como funciona o cadastro?' },
          {
            role: 'assistant',
            content: 'Para se cadastrar, clique em Começar Agora, preencha seus dados e confirme seu email.',
          },
        ],
        context: {},
      },
      { userId: `unit-${Date.now()}`, ip: `7.7.7.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(data.spokenText).toContain('próximo passo')
    expect(data.entryId).toBeUndefined()
  })

  test('bypassa KB para follow-up de cadastro com histórico e não repete a mesma FAQ', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Depois do cadastro, você pode entrar e explorar as áreas públicas guiadas da plataforma ou seguir para a demo de login.',
        actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      {
        question: 'e depois do cadastro?',
        history: [
          { role: 'user', content: 'como funciona o cadastro?' },
          {
            role: 'assistant',
            content: 'Para se cadastrar, clique em Começar Agora, preencha seus dados e confirme seu email.',
          },
        ],
        context: {},
      },
      { userId: `unit-${Date.now()}`, ip: `8.8.8.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toContain('Depois do cadastro')
  })

  test('bypassa KB para pergunta técnica sobre como o assistente decide entre KB e IA', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'Eu uso a base de conhecimento para perguntas diretas e recorro à IA quando a pergunta depende de contexto, histórico ou explicação aberta.',
        actions: [],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      { question: 'como vocês decidem quando usar KB ou IA?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `9.9.9.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toContain('base de conhecimento')
  })

  test('aceita pergunta aberta sobre o produto sem retornar out_of_scope seco', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText: 'O DVAi$ é uma vitrine técnica com assistente que guia o usuário, explica o que a página oferece e usa IA com validação de ações.',
        actions: [{ type: 'highlightSection', targetId: 'hero-content' }],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      { question: 'me explica melhor o produto', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `10.10.10.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(String(data.spokenText)).toContain('vitrine técnica')
  })
})
