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

  test('mantém follow-up curto sem histórico fora de escopo', async () => {
    const kbSpy = vi.spyOn(knowledgeBase, 'askFromKnowledgeBase').mockReturnValue(null)

    const req = buildRequest(
      { question: 'e depois disso?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `2.3.4.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(callLLMMock).not.toHaveBeenCalled()

    kbSpy.mockRestore()
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

  test('preserva FAQ de login e deixa a resposta mais guiada', async () => {
    const req = buildRequest(
      { question: 'como funciona o login?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `3.4.3.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.entryId).toBe('login')
    expect(Array.isArray(data.responses)).toBe(true)
    expect(data.responses.some((value: string) => /valida[cç][aã]o|revis|se algo/i.test(value))).toBe(
      true
    )
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
    expect(String(data.spokenText)).toMatch(/voz cont[íi]nua|modo degradado em texto/i)
  })

  test('mantém KB para FAQ direta de compatibilidade no celular', async () => {
    const req = buildRequest(
      { question: 'funciona no celular?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `4.5.4.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBe('compatibilidade_navegador')
    expect(String(data.responses?.join(' '))).toMatch(/sem instalar app|modo degradado em texto|ligar o davi/i)
  })

  test('mantém KB para FAQ direta de uso da voz', async () => {
    const req = buildRequest(
      { question: 'como usar a voz?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `4.6.4.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBe('assistente_voz')
    expect(String(data.responses?.join(' '))).toMatch(/falar com davi|volto a escutar|modo degradado em texto/i)
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
    expect(String(data.spokenText)).toMatch(/voz cont[íi]nua|modo degradado em texto/i)
    expect(String(data.spokenText)).toMatch(/navegador|microfone|autoplay/i)
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
    expect(String(data.spokenText)).toMatch(/modo degradado em texto|browser|navegador/i)
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
    expect(String(data.spokenText)).toMatch(/modo degradado em texto|bloqueado o [áa]udio autom[aá]tico/i)
    expect(String(data.spokenText)).toMatch(/audio|áudio|voz/i)
  })

  test('bypassa KB para pergunta prática aberta sem âncora de FAQ', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText:
          'Na prática, o Davi te mostra a interface, explica cada área pública e sugere o próximo passo mais útil.',
        actions: [{ type: 'scrollToSection', targetId: 'features-section' }],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      { question: 'como isso funciona na prática?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `14.14.14.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toContain('Na prática')

    const llmRequest = callLLMMock.mock.calls[0][0] as Record<string, unknown>
    expect(String(llmRequest.effectiveQuestion)).toMatch(/na prática/i)
    expect(String(llmRequest.conversationContextBlock)).toMatch(/como funciona|prática/i)
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

    const llmRequest = callLLMMock.mock.calls[0][0] as Record<string, unknown>
    expect(String(llmRequest.clickContextBlock)).toMatch(/capacidades reais|voz opcional|ações guiadas/i)
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
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.spokenText).toContain('próximo passo')
    expect(data.entryId).toBeUndefined()
  })

  test('usa contexto de 3 turnos para continuar a conversa sem reiniciar o assunto', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText:
          'Na prática, essa parte mostra como o assistente orienta a navegação e destaca o que você pode abrir em seguida.',
        actions: [{ type: 'highlightSection', targetId: 'features-section' }],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      {
        question: 'e como isso funciona?',
        history: [
          { role: 'user', content: 'me explica melhor o produto' },
          {
            role: 'assistant',
            content: 'O Davi guia a navegação, explica a interface e mostra análise, segurança e aprendizado.',
          },
          { role: 'user', content: 'me explica isso' },
          {
            role: 'assistant',
            content: 'Essa seção resume as capacidades reais do assistente, como voz opcional, clique contextual e ações guiadas.',
          },
        ],
        context: {
          conversationSummary:
            'Último tópico: assistente. O usuário pediu mais detalhes sobre as capacidades reais do assistente.',
          lastQuestion: 'me explica isso',
          lastAnswer:
            'Essa seção resume as capacidades reais do assistente, como voz opcional, clique contextual e ações guiadas.',
          lastTopicHint: 'assistente',
          questionLooksIndependent: false,
        },
      },
      { userId: `unit-${Date.now()}`, ip: `15.15.15.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(String(data.spokenText)).toContain('Na prática')

    const llmRequest = callLLMMock.mock.calls[0][0] as Record<string, unknown>
    expect(String(llmRequest.effectiveQuestion)).not.toBe('e como isso funciona?')
    expect(String(llmRequest.conversationContextBlock)).toMatch(/última resposta|capacidades reais|assistente/i)
  })

  test('bypassa KB para follow-up de cadastro com histórico e não repete a mesma FAQ', async () => {
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
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toContain('Depois do cadastro')
    expect(data.actions?.[0]).toMatchObject({ type: 'navigateRoute', route: '/login' })
  })

  test('continua cadastro de forma determinística quando o usuário pergunta sobre dados errados', async () => {
    const req = buildRequest(
      {
        question: 'e se eu errar meus dados?',
        history: [
          { role: 'user', content: 'como funciona o cadastro?' },
          {
            role: 'assistant',
            content: 'Para se cadastrar, clique em Começar Agora, preencha o formulário e confirme seu email.',
          },
        ],
        context: {
          conversationSummary: 'Último tópico: cadastro. O usuário quer seguir no fluxo de entrada.',
          lastQuestion: 'como funciona o cadastro?',
          lastAnswer:
            'Para se cadastrar, clique em Começar Agora, preencha o formulário e confirme seu email.',
          lastTopicHint: 'cadastro',
          questionLooksIndependent: false,
        },
      },
      { userId: `unit-${Date.now()}`, ip: `8.1.8.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toMatch(/corrij|revise|formul[aá]rio|valida/i)
    expect(data.actions?.[0]).toMatchObject({ type: 'navigateRoute', route: '/cadastro' })
  })

  test('continua cadastro depois da confirmação de email sem repetir a FAQ inicial', async () => {
    const req = buildRequest(
      {
        question: 'e depois que eu confirmar o email?',
        history: [
          { role: 'user', content: 'como funciona o cadastro?' },
          {
            role: 'assistant',
            content: 'Para se cadastrar, clique em Começar Agora, preencha o formulário e confirme seu email.',
          },
        ],
        context: {
          conversationSummary: 'Último tópico: cadastro. O usuário quer saber o próximo passo após o email.',
          lastQuestion: 'como funciona o cadastro?',
          lastAnswer:
            'Para se cadastrar, clique em Começar Agora, preencha o formulário e confirme seu email.',
          lastTopicHint: 'cadastro',
          questionLooksIndependent: false,
        },
      },
      { userId: `unit-${Date.now()}`, ip: `8.2.8.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toMatch(/login|pr[oó]ximo passo/i)
    expect(String(data.spokenText)).not.toMatch(/clique em Come[çc]ar Agora/i)
    expect(data.actions?.[0]).toMatchObject({ type: 'navigateRoute', route: '/login' })
  })

  test('continua login de forma determinística quando o usuário pergunta e depois disso', async () => {
    const req = buildRequest(
      {
        question: 'e depois disso?',
        history: [
          { role: 'user', content: 'como funciona o login?' },
          {
            role: 'assistant',
            content: 'Abra a tela de login, preencha email e senha e confira as validações locais.',
          },
        ],
        context: {
          conversationSummary: 'Último tópico: login. O usuário quer a continuação do fluxo.',
          lastQuestion: 'como funciona o login?',
          lastAnswer:
            'Abra a tela de login, preencha email e senha e confira as validações locais.',
          lastTopicHint: 'login',
          questionLooksIndependent: false,
        },
      },
      { userId: `unit-${Date.now()}`, ip: `8.3.8.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toMatch(/email|senha|valida/i)
    expect(String(data.spokenText)).not.toMatch(/clique em "Login" no topo/i)
  })

  test('responde de forma determinística para esqueci a senha sem prometer reset inexistente', async () => {
    const req = buildRequest(
      { question: 'e se eu esquecer a senha?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `8.4.8.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toMatch(/contato|respons[aá]vel/i)
    expect(String(data.spokenText)).not.toMatch(/redefinir|reset/i)
  })

  test('responde de forma determinística quando o login não entra', async () => {
    const req = buildRequest(
      { question: 'o que eu faço se não entrar?', history: [], context: {} },
      { userId: `unit-${Date.now()}`, ip: `8.5.8.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toMatch(/email|senha|contato|valida/i)
  })

  test('continua login no celular sem cair no suporte genérico', async () => {
    const req = buildRequest(
      {
        question: 'e no celular?',
        history: [
          { role: 'user', content: 'como funciona o login?' },
          {
            role: 'assistant',
            content: 'Abra a tela de login, preencha email e senha e confira as validações locais.',
          },
        ],
        context: {
          conversationSummary: 'Último tópico: login. O usuário quer saber como seguir esse fluxo no celular.',
          lastQuestion: 'como funciona o login?',
          lastAnswer:
            'Abra a tela de login, preencha email e senha e confira as validações locais.',
          lastTopicHint: 'login',
          questionLooksIndependent: false,
        },
      },
      { userId: `unit-${Date.now()}`, ip: `8.6.8.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).not.toHaveBeenCalled()
    expect(data.entryId).toBeUndefined()
    expect(String(data.spokenText)).toMatch(/celular|texto \+ toque|formul[aá]rio/i)
    expect(String(data.spokenText)).toMatch(/login|email|senha/i)
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

  test('trata e no celular como continuação do último tópico quando há histórico do produto', async () => {
    callLLMMock.mockResolvedValue({
      type: 'response',
      response: {
        spokenText:
          'No celular, o Davi tenta seguir nessa mesma sessão por voz. Quando o navegador limitar a captura ou o áudio, ele explica o motivo e continua em modo degradado em texto.',
        actions: [],
        mode: 'normal',
      },
    })

    const req = buildRequest(
      {
        question: 'e no celular?',
        history: [
          { role: 'user', content: 'me explica melhor o produto' },
          {
            role: 'assistant',
            content:
              'O Davi te guia pela página, explica cada área pública e mostra análise, segurança e aprendizado.',
          },
        ],
        context: {
          conversationSummary:
            'Último tópico: produto. O usuário queria entender o produto de forma prática.',
          lastQuestion: 'me explica melhor o produto',
          lastAnswer:
            'O Davi te guia pela página, explica cada área pública e mostra análise, segurança e aprendizado.',
          lastTopicHint: 'produto',
          questionLooksIndependent: false,
        },
      },
      { userId: `unit-${Date.now()}`, ip: `16.16.16.${Math.floor(Math.random() * 200)}` }
    )

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(callLLMMock).toHaveBeenCalledTimes(1)
    expect(String(data.spokenText)).toContain('celular')

    const llmRequest = callLLMMock.mock.calls[0][0] as Record<string, unknown>
    expect(String(llmRequest.effectiveQuestion)).toMatch(/celular/i)
    expect(String(llmRequest.conversationContextBlock)).toMatch(/produto|último tópico/i)
    expect(String(llmRequest.conversationContextBlock)).toMatch(/sessão por voz|modo degradado|compatibilidade do navegador/i)
    expect(String(llmRequest.conversationContextBlock)).not.toMatch(/texto \+ toque|tocar para falar|selecionar item|ouvir resposta/i)
  })
})
