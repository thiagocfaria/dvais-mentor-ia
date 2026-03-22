import {
  inferAuthFlowHintFromText,
  inferTopicHintFromText,
  isContinuationQuestion,
  isExplicitTopicShift,
  isPracticalOpenQuestion,
  normalizeConversationText,
  type AuthFlowHint,
  type TopicHint,
} from '@/biblioteca/assistente/conversationSignals'

export type ConversationTurn = { role: string; content: string }

type ConversationSignals = {
  conversationSummary?: string
  lastQuestion?: string
  lastAnswer?: string
  lastTopicHint?: string | null
  questionLooksIndependent?: boolean
}

export type ConversationContextAnalysis = {
  hasUsefulHistory: boolean
  isEllipticalFollowUp: boolean
  isPracticalOpenQuestion: boolean
  isTechnicalMetaQuestion: boolean
  isOpenProductQuestion: boolean
  isMobileVoiceComplaint: boolean
  topicHint: TopicHint
  flowHint: AuthFlowHint
  shouldTreatAsInScope: boolean
  shouldBypassKB: boolean
  kbBypassReason: string | null
  effectiveQuestion: string
  conversationContextBlock: string
}

const ELLIPTICAL_FOLLOWUP_RE =
  /^(e\s+depois(\s+(disso|do\s+cadastro|da\s+analise|da\s+seguranca|disso\s+ai|disso\s+ai))?|e\s+agora|e\s+nisso(\s+ai)?|qual\s+o\s+proximo\s+passo|me\s+explica\s+melhor|me\s+explica\s+mais|explica\s+melhor|e\s+como\s+isso\s+funciona|e\s+no\s+celular)$/i

const TECHNICAL_META_RE =
  /\b(base de conhecimento|kb|ia|llm|modelo|provider|roteamento|contexto|historico|como voces decidem|como decide|quando usar|como funciona a ia|como funciona o assistente)\b/i

const OPEN_PRODUCT_RE =
  /\b(produto|projeto|plataforma|site|pagina|o que voces oferecem|o que tem aqui|o que entrega)\b/i

const MOBILE_VOICE_RE =
  /\b(celular|mobile|iphone|android|microfone|voz|audio|toque|falar|ouvir)\b/i

const COMPLAINT_RE =
  /\b(nao funciona|nao consigo|travou|falhou|erro|quebrou|nao fala|nao capta|nao ouve)\b/i

function getLastTurn(history: ConversationTurn[], role: 'user' | 'assistant') {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const turn = history[i]
    if (turn.role === role && turn.content) return turn.content
  }
  return ''
}

function buildHistorySummary(history: ConversationTurn[]): string {
  return history
    .slice(-4)
    .map(turn => `${turn.role}: ${turn.content}`)
    .join(' | ')
    .slice(0, 320)
}

function parseTopicHint(value?: string | null): TopicHint {
  return value === 'cadastro' ||
    value === 'login' ||
    value === 'produto' ||
    value === 'assistente' ||
    value === 'mobile_voz' ||
    value === 'seguranca' ||
    value === 'analise'
    ? value
    : null
}

export function analyzeConversationContext(args: {
  sanitizedQuestion: string
  validHistory: ConversationTurn[]
  contextSignals?: ConversationSignals
}): ConversationContextAnalysis {
  const { sanitizedQuestion, validHistory, contextSignals } = args
  const normalizedQuestion = normalizeConversationText(sanitizedQuestion)
  const hasUsefulHistory = validHistory.length >= 2
  const questionLooksIndependent = Boolean(contextSignals?.questionLooksIndependent || isExplicitTopicShift(normalizedQuestion))
  const isEllipticalFollowUp =
    normalizedQuestion.length <= 48 && ELLIPTICAL_FOLLOWUP_RE.test(normalizedQuestion)
  const practicalOpenQuestion = isPracticalOpenQuestion(normalizedQuestion)
  const continuationQuestion = isContinuationQuestion(normalizedQuestion)
  const isTechnicalMetaQuestion = TECHNICAL_META_RE.test(normalizedQuestion)
  const isOpenProductQuestion = OPEN_PRODUCT_RE.test(normalizedQuestion)
  const isMobileVoiceComplaint =
    MOBILE_VOICE_RE.test(normalizedQuestion) && COMPLAINT_RE.test(normalizedQuestion)
  const isMobileContinuation = MOBILE_VOICE_RE.test(normalizedQuestion) && !isMobileVoiceComplaint
  const historySummary = buildHistorySummary(validHistory)
  const historyQuestion = contextSignals?.lastQuestion || getLastTurn(validHistory, 'user')
  const historyAnswer = contextSignals?.lastAnswer || getLastTurn(validHistory, 'assistant')
  const explicitFlowHint = inferAuthFlowHintFromText(normalizedQuestion)
  const historyFlowHint = inferAuthFlowHintFromText(
    historyQuestion,
    historyAnswer,
    contextSignals?.conversationSummary || historySummary
  )
  const historyTopicHint =
    parseTopicHint(contextSignals?.lastTopicHint) ||
    inferTopicHintFromText(historyQuestion, historyAnswer, historySummary)
  const topicHint = questionLooksIndependent
    ? inferTopicHintFromText(normalizedQuestion)
    : historyTopicHint || inferTopicHintFromText(normalizedQuestion)
  const flowHint = questionLooksIndependent ? explicitFlowHint : historyFlowHint || explicitFlowHint

  let conversationContextBlock = ''
  let effectiveQuestion = sanitizedQuestion
  let kbBypassReason: string | null = null

  if ((isEllipticalFollowUp || continuationQuestion) && hasUsefulHistory && historyTopicHint && !questionLooksIndependent) {
    kbBypassReason = 'contextual_follow_up'
    effectiveQuestion = `Pergunta atual: "${sanitizedQuestion}". Continue a conversa a partir do último tópico (${historyTopicHint.replace('_', ' ')}). Última pergunta do usuário: "${historyQuestion || 'não informada'}". Última resposta do assistente: "${historyAnswer || 'não informada'}". Responda sem recomeçar do zero e avance a explicação com um próximo passo útil quando couber.`
    conversationContextBlock += `\nCONTEXTO DE CONVERSA:\n- último tópico forte: ${historyTopicHint}\n- última pergunta: ${historyQuestion || 'não informada'}\n- última resposta: ${historyAnswer || 'não informada'}\n- histórico resumido: ${contextSignals?.conversationSummary || historySummary || 'sem resumo'}\n- trate a nova pergunta como continuação natural, sem repetir a abertura da resposta anterior.\n`

    if (flowHint === 'cadastro') {
      conversationContextBlock += `\nCONTINUAÇÃO SEGURA DE CADASTRO:\n- trate como continuação de um fluxo de interface, não como backend confirmado.\n- não diga que a conta já foi criada nem que o usuário ganhou acesso privado automaticamente.\n- avance para o próximo passo plausível desta demo: concluir a etapa visual, seguir para login ou explorar áreas públicas guiadas.\n`
    }

    if (flowHint === 'login') {
      conversationContextBlock += `\nCONTINUAÇÃO SEGURA DE LOGIN:\n- trate como fluxo de interface demonstrativo, não como autenticação real de backend.\n- avance a jornada com orientação prática: revisar email e senha, observar validações locais e usar /contato quando a dúvida for senha esquecida ou bloqueio da demo.\n- não repita a definição inicial de login se o usuário estiver claramente no próximo passo.\n`
    }
  }

  if (isMobileContinuation && hasUsefulHistory && historyTopicHint && !questionLooksIndependent) {
    kbBypassReason = kbBypassReason || 'mobile_continuation'
    conversationContextBlock += `\nCONTINUIDADE NO CELULAR:\n- responda como continuação do mesmo assunto, explicando o uso no celular sem reiniciar a conversa.\n- dentro deste produto, o caminho mais estável no celular é Texto + toque.\n- cite voz manual ou "Tocar para falar" apenas como opção quando o navegador suportar.\n- se mencionar áudio, lembre que alguns navegadores exigem gesto do usuário.\n`
    if (flowHint === 'login') {
      conversationContextBlock += `\nLOGIN NO CELULAR:\n- explique o login no celular como uso do formulário normal, por texto e toque.\n- priorize revisar email e senha no formulário; não desvie para suporte genérico de voz se o assunto for login.\n`
    }
  }

  if (practicalOpenQuestion) {
    kbBypassReason = kbBypassReason || 'practical_open_question'
    effectiveQuestion =
      hasUsefulHistory && historyTopicHint && !questionLooksIndependent
        ? `Pergunta atual: "${sanitizedQuestion}". Retome o último tópico (${historyTopicHint.replace('_', ' ')}) e explique como isso funciona na prática dentro da página, em 2 ou 3 frases curtas, sem repetir a apresentação anterior.`
        : `Pergunta atual: "${sanitizedQuestion}". Explique o produto de forma prática: o que o usuário consegue fazer agora na página, como o assistente ajuda e qual próximo passo útil ele pode seguir. Use 2 ou 3 frases curtas e naturais.`
    conversationContextBlock += `\nESTILO DE EXPLICAÇÃO PRÁTICA:\n- responda como assistente de produto, em 2 ou 3 frases curtas.\n- explique o que é, como funciona na prática e o próximo passo mais útil.\n- evite cair em FAQ mecânica de cadastro quando a pergunta for aberta.\n`
  }

  if (isTechnicalMetaQuestion) {
    kbBypassReason = kbBypassReason || 'technical_meta_question'
    conversationContextBlock += `\nDIAGNÓSTICO DA PERGUNTA:\n- o usuário está perguntando como o assistente usa KB, IA, contexto e histórico.\n- responda de forma técnica, mas em linguagem simples, sem soar como documentação interna e sem revelar segredos.\n`
  }

  if (isOpenProductQuestion) {
    kbBypassReason = kbBypassReason || 'open_product_question'
    effectiveQuestion =
      hasUsefulHistory && historyTopicHint && !questionLooksIndependent
        ? `Pergunta atual: "${sanitizedQuestion}". Continue a conversa sobre ${historyTopicHint.replace('_', ' ')} explicando o produto com mais naturalidade, sem repetir a apresentação anterior.`
        : `Pergunta atual: "${sanitizedQuestion}". Explique o produto em linguagem de produto: o que ele faz, como funciona na página e qual próximo passo útil o usuário pode seguir. Evite começar com "é uma vitrine técnica".`
    conversationContextBlock += `\nDIAGNÓSTICO DA PERGUNTA:\n- o usuário quer uma explicação aberta do produto.\n- explique o que a página oferece, como o assistente guia a navegação e quais áreas públicas ele pode apresentar.\n- prefira linguagem de produto, clara e direta, sem marketing exagerado.\n`
  }

  if (isMobileVoiceComplaint) {
    kbBypassReason = kbBypassReason || 'mobile_voice_support'
    conversationContextBlock += `\nDIAGNÓSTICO DE SUPORTE:\n- cite compatibilidade do navegador, permissão de microfone, gesto do usuário para áudio e o fallback recomendado de texto + toque no celular.\n- não invente recursos não presentes no produto.\n`
  }

  return {
    hasUsefulHistory,
    isEllipticalFollowUp,
    isPracticalOpenQuestion: practicalOpenQuestion,
    isTechnicalMetaQuestion,
    isOpenProductQuestion,
    isMobileVoiceComplaint,
    topicHint,
    flowHint,
    shouldTreatAsInScope: Boolean(
      (((isEllipticalFollowUp || continuationQuestion) && hasUsefulHistory && historyTopicHint && !questionLooksIndependent) ||
        Boolean(flowHint && (/\b(esqueci a senha|nao consigo entrar|nao entra|errar meus dados|confirmar o email)\b/.test(normalizedQuestion))) ||
        isOpenProductQuestion ||
        practicalOpenQuestion)
    ),
    shouldBypassKB: Boolean(
      (((isEllipticalFollowUp || continuationQuestion) && hasUsefulHistory && historyTopicHint && !questionLooksIndependent)) ||
        Boolean(flowHint && (/\b(esqueci a senha|nao consigo entrar|nao entra|errar meus dados|confirmar o email)\b/.test(normalizedQuestion))) ||
        practicalOpenQuestion ||
        isTechnicalMetaQuestion ||
        isOpenProductQuestion ||
        isMobileVoiceComplaint
    ),
    kbBypassReason,
    effectiveQuestion,
    conversationContextBlock,
  }
}
