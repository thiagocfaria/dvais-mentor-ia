export type TopicHint =
  | 'cadastro'
  | 'login'
  | 'produto'
  | 'assistente'
  | 'mobile_voz'
  | 'seguranca'
  | 'analise'
  | null

export type AuthFlowHint = 'cadastro' | 'login' | null

const EXPLICIT_TOPIC_SHIFT_RE =
  /\b(mudando de assunto|outro assunto|outra coisa|agora sobre|quero falar de|vamos falar de|deixa eu perguntar outra|te pergunto outra|muda de assunto|falando de outra coisa)\b/i

const PRACTICAL_OPEN_RE =
  /\b(como isso funciona na pratica|como funciona na pratica|como isso funciona|o que acontece depois|me mostra na pratica|me mostra um exemplo|exemplo real|como que e|como seria)\b/i

const CONTINUATION_RE =
  /^(e\s+depois(\s+disso|\s+do\s+cadastro)?|e\s+agora|e\s+como\s+isso\s+funciona|e\s+no\s+celular|e\s+nisso(\s+ai)?|qual\s+o\s+proximo\s+passo|o\s+que\s+eu\s+faco\s+depois|me\s+explica\s+melhor|me\s+explica\s+mais|explica\s+melhor|e\s+se\s+eu\s+errar\s+meus\s+dados|e\s+depois\s+que\s+eu\s+confirmar\s+o\s+email|e\s+se\s+eu\s+esquecer\s+a\s+senha|o\s+que\s+eu\s+faco\s+se\s+nao\s+entrar|quero\s+saber(\s+como\s+funciona|\s+mais|\s+sobre)?|como\s+funciona\s+isso|me\s+(conta|fala|explica)\s+mais|conta\s+mais|fala\s+mais|sim[,.]?\s*(quero|pode|fala|conta|explica)|ok[,.]?\s*(quero|pode|fala|conta|me)|pode\s+ser|quero\s+entender|me\s+explica|quero\s+conhecer|como\s+e\s+isso|como\s+isso\s+funciona|e\s+a\s+analise|e\s+a\s+protecao|e\s+o\s+aprendizado|e\s+os\s+alertas|e\s+o\s+suporte|e\s+a\s+seguranca|e\s+o\s+guia|e\s+quanto\s+a\b.*|e\s+sobre\s+\b.*|e\s+a\s+voz|e\s+o\s+cadastro|e\s+o\s+login|entendi|legal|interessante|bacana|show|top|massa)$/i

export function normalizeConversationText(value: string): string {
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

export function inferTopicHintFromText(...segments: string[]): TopicHint {
  const corpus = normalizeConversationText(segments.filter(Boolean).join(' '))
  if (!corpus) return null

  const topicMatchers: Array<[Exclude<TopicHint, null>, RegExp]> = [
    ['login', /\b(login|fazer login|acessar conta|entrar na conta|nao entra|nao consigo entrar|esqueci a senha|senha)\b/],
    ['cadastro', /\b(cadastro|cadastrar|comecar agora|criar conta|registrar|sign up|inscrever)\b/],
    ['assistente', /\b(assistente|base de conhecimento|kb|ia|llm|contexto|historico|roteamento|voz|chat|clique contextual|acoes guiadas)\b/],
    ['mobile_voz', /\b(celular|mobile|iphone|android|microfone|voz|audio|toque|ouvir resposta)\b/],
    ['seguranca', /\b(seguranca|protecao|validacao|rate limit|circuit breaker|alertas)\b/],
    ['analise', /\b(analise|tempo real|mercado|dados|indicadores)\b/],
    ['produto', /\b(produto|projeto|plataforma|dvais|davi|site|pagina|funcionalidades|vitrine)\b/],
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

export function inferAuthFlowHintFromText(...segments: string[]): AuthFlowHint {
  const corpus = normalizeConversationText(segments.filter(Boolean).join(' '))
  if (!corpus) return null

  if (
    /\b(login|fazer login|acessar conta|entrar na conta|esqueci a senha|nao consigo entrar|nao entra|senha)\b/.test(
      corpus
    )
  ) {
    return 'login'
  }

  if (/\b(cadastro|cadastrar|criar conta|comecar agora|registrar|inscrever)\b/.test(corpus)) {
    return 'cadastro'
  }

  return null
}

export function isExplicitTopicShift(question: string): boolean {
  return EXPLICIT_TOPIC_SHIFT_RE.test(normalizeConversationText(question))
}

export function isPracticalOpenQuestion(question: string): boolean {
  return PRACTICAL_OPEN_RE.test(normalizeConversationText(question))
}

export function isContinuationQuestion(question: string): boolean {
  return CONTINUATION_RE.test(normalizeConversationText(question))
}

export function questionLooksIndependent(question: string, lastTopicHint: TopicHint): boolean {
  const normalized = normalizeConversationText(question)
  if (!normalized) return false
  if (isExplicitTopicShift(normalized)) return true
  if (isContinuationQuestion(normalized)) return false

  const currentTopicHint = inferTopicHintFromText(normalized)
  return Boolean(lastTopicHint && currentTopicHint && currentTopicHint !== lastTopicHint)
}
