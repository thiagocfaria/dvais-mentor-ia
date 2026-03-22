export type ConversationTurn = { role: string; content: string }

export type TopicHint =
  | 'cadastro'
  | 'produto'
  | 'assistente'
  | 'mobile_voz'
  | 'seguranca'
  | 'analise'
  | null

export type ConversationContextAnalysis = {
  hasUsefulHistory: boolean
  isEllipticalFollowUp: boolean
  isTechnicalMetaQuestion: boolean
  isOpenProductQuestion: boolean
  isMobileVoiceComplaint: boolean
  topicHint: TopicHint
  shouldTreatAsInScope: boolean
  shouldBypassKB: boolean
  kbBypassReason: string | null
  effectiveQuestion: string
  conversationContextBlock: string
}

const ELLIPTICAL_FOLLOWUP_RE =
  /^(e\s+depois(\s+(disso|do\s+cadastro|da\s+analise|da\s+seguranca|disso\s+ai|disso\s+ai))?|e\s+agora|e\s+nisso(\s+ai)?|qual\s+o\s+proximo\s+passo|me\s+explica\s+melhor|me\s+explica\s+mais|explica\s+melhor)$/i

const TECHNICAL_META_RE =
  /\b(base de conhecimento|kb|ia|llm|modelo|provider|roteamento|contexto|historico|como voces decidem|como decide|quando usar|como funciona a ia|como funciona o assistente)\b/i

const OPEN_PRODUCT_RE =
  /\b(produto|projeto|plataforma|site|pagina|o que voces oferecem|o que tem aqui|o que entrega)\b/i

const MOBILE_VOICE_RE =
  /\b(celular|mobile|iphone|android|microfone|voz|audio|toque|falar|ouvir)\b/i

const COMPLAINT_RE =
  /\b(nao funciona|nao consigo|travou|falhou|erro|quebrou|nao fala|nao capta|nao ouve)\b/i

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()[\]{}'"`~@#$%^&*+=|\\/<>]/g, ' ')
    .replace(/\$/g, 's')
    .replace(/ç/g, 'c')
    .replace(/[ãáàâ]/g, 'a')
    .replace(/[éê]/g, 'e')
    .replace(/[í]/g, 'i')
    .replace(/[õóô]/g, 'o')
    .replace(/[ú]/g, 'u')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferTopicHint(history: ConversationTurn[], normalizedQuestion: string): TopicHint {
  const combinedRecent = history
    .slice(-4)
    .map(entry => normalizeText(entry.content))
    .join(' ')

  const corpus = `${combinedRecent} ${normalizedQuestion}`.trim()
  if (!corpus) return null

  const topicMatchers: Array<[Exclude<TopicHint, null>, RegExp]> = [
    ['cadastro', /\b(cadastro|cadastrar|comecar agora|comecar agora|criar conta|login|entrar)\b/],
    ['assistente', /\b(assistente|base de conhecimento|kb|ia|llm|contexto|historico|roteamento|voz|chat)\b/],
    ['mobile_voz', /\b(celular|mobile|iphone|android|microfone|voz|audio|toque)\b/],
    ['seguranca', /\b(seguranca|protecao|validacao|rate limit|circuit breaker)\b/],
    ['analise', /\b(analise|tempo real|mercado|dados|indicadores)\b/],
    ['produto', /\b(produto|projeto|plataforma|dvais|davi|site|pagina|funcionalidades)\b/],
  ]

  let bestTopic: TopicHint = null
  let bestScore = 0

  for (const [topic, regex] of topicMatchers) {
    const matches = corpus.match(new RegExp(regex.source, 'g')) || []
    if (matches.length > bestScore) {
      bestScore = matches.length
      bestTopic = topic
    }
  }

  return bestScore > 0 ? bestTopic : null
}

function buildHistorySummary(history: ConversationTurn[]): string {
  return history
    .slice(-4)
    .map(turn => `${turn.role}: ${turn.content}`)
    .join(' | ')
    .slice(0, 320)
}

export function analyzeConversationContext(args: {
  sanitizedQuestion: string
  validHistory: ConversationTurn[]
}): ConversationContextAnalysis {
  const { sanitizedQuestion, validHistory } = args
  const normalizedQuestion = normalizeText(sanitizedQuestion)
  const hasUsefulHistory = validHistory.length >= 2
  const isEllipticalFollowUp =
    normalizedQuestion.length <= 48 && ELLIPTICAL_FOLLOWUP_RE.test(normalizedQuestion)
  const isTechnicalMetaQuestion = TECHNICAL_META_RE.test(normalizedQuestion)
  const isOpenProductQuestion = OPEN_PRODUCT_RE.test(normalizedQuestion)
  const isMobileVoiceComplaint =
    MOBILE_VOICE_RE.test(normalizedQuestion) && COMPLAINT_RE.test(normalizedQuestion)
  const topicHint = inferTopicHint(validHistory, normalizedQuestion)
  const historySummary = buildHistorySummary(validHistory)

  let conversationContextBlock = ''
  let effectiveQuestion = sanitizedQuestion
  let kbBypassReason: string | null = null

  if (isEllipticalFollowUp && hasUsefulHistory && topicHint) {
    kbBypassReason = 'contextual_follow_up'
    effectiveQuestion = `Pergunta atual: "${sanitizedQuestion}". Interprete como continuação sobre ${topicHint.replace('_', ' ')}. Continue a conversa sem repetir a resposta anterior e indique o próximo passo mais útil.`
    conversationContextBlock += `\nCONTEXTO DE CONVERSA:\n- tópico forte recente: ${topicHint}\n- histórico resumido: ${historySummary || 'sem resumo'}\n- a pergunta atual é um follow-up curto e precisa ser interpretada com base no histórico.\n`
  }

  if (isTechnicalMetaQuestion) {
    kbBypassReason = kbBypassReason || 'technical_meta_question'
    conversationContextBlock += `\nDIAGNÓSTICO DA PERGUNTA:\n- o usuário está perguntando como o assistente usa KB, IA, contexto e histórico.\n- responda de forma técnica, mas em linguagem simples e sem revelar segredos internos.\n`
  }

  if (isOpenProductQuestion) {
    kbBypassReason = kbBypassReason || 'open_product_question'
    conversationContextBlock += `\nDIAGNÓSTICO DA PERGUNTA:\n- o usuário quer uma explicação aberta do produto.\n- explique o que a página oferece, como o assistente guia a navegação e quais áreas públicas ele pode apresentar.\n`
  }

  if (isMobileVoiceComplaint) {
    kbBypassReason = kbBypassReason || 'mobile_voice_support'
    conversationContextBlock += `\nDIAGNÓSTICO DE SUPORTE:\n- cite compatibilidade do navegador, permissão de microfone, gesto do usuário para áudio e o fallback recomendado de texto + toque no celular.\n- não invente recursos não presentes no produto.\n`
  }

  return {
    hasUsefulHistory,
    isEllipticalFollowUp,
    isTechnicalMetaQuestion,
    isOpenProductQuestion,
    isMobileVoiceComplaint,
    topicHint,
    shouldTreatAsInScope: Boolean((isEllipticalFollowUp && hasUsefulHistory && topicHint) || isOpenProductQuestion),
    shouldBypassKB: Boolean(
      (isEllipticalFollowUp && hasUsefulHistory && topicHint) ||
        isTechnicalMetaQuestion ||
        isOpenProductQuestion ||
        isMobileVoiceComplaint
    ),
    kbBypassReason,
    effectiveQuestion,
    conversationContextBlock,
  }
}
