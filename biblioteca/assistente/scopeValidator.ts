export const ALLOWED_IDS = [
  'hero-content',
  'features-section',
  'stats-section',
  'analise-hero',
  'analise-publico',
  'analise-dados',
  'analise-exclusivos',
  'seguranca-hero',
  'seguranca-cards',
  'seguranca-alertas',
  'seguranca-guia',
  'aprendizado-hero',
  'voce-aprende',
  'aprende-realidade',
  'aprende-mercado',
  'transparencia-controle',
  'funcionamento',
  'login-card',
  'cadastro-card',
  'button-comecar-agora',
  'button-login',
  'nav-analise',
  'nav-seguranca',
  'nav-aprendizado',
] as const

export const SCOPE_KEYWORDS = [
  'cadastro', 'análise', 'analise', 'proteção', 'segurança', 'aprendizado', 'resultado', 'métrica', 'estatística',
  'dvais', 'mentor', 'plataforma', 'como funciona', 'o que é', 'investimento', 'corretora', 'guia', 'funcionalidade',
  'preço', 'valor', 'plano', 'assinatura', 'suporte', 'ajuda', 'tutorial', 'iniciante', 'aventureiro', 'analista',
  'assistente', 'chat', 'voz', 'celular', 'mobile', 'microfone', 'áudio', 'audio', 'toque', 'clique',
  'contexto', 'acao', 'ações', 'resposta', 'token', 'quota', 'cache', 'rate limit', 'circuit breaker',
  'produto', 'projeto', 'site', 'pagina', 'página', 'oferece', 'oferecem', 'ia', 'kb', 'base de conhecimento', 'llm',
] as const

const CLICK_TARGET_DESCRIPTIONS: Record<string, string> = {
  'hero-content':
    'Área principal da home, onde o produto se apresenta e orienta o primeiro passo.',
  'features-section':
    'Seção que resume as capacidades reais do assistente, como voz opcional, contexto por toque ou clique e ações guiadas pela interface.',
  'stats-section':
    'Bloco com métricas e destaques visuais para reforçar o valor do produto.',
  'analise-hero':
    'Entrada da área de análise, voltada para leitura guiada e interpretação de dados.',
  'seguranca-hero':
    'Entrada da área de segurança, com foco em validação de ações e respostas mais previsíveis.',
  'aprendizado-hero':
    'Entrada da área de aprendizado contínuo, usada para explicar a jornada e a proposta educativa do produto.',
  'login-card':
    'Card da demonstração de login, usado como fluxo de interface e navegação.',
  'cadastro-card':
    'Card do fluxo de cadastro, que mostra o primeiro passo de entrada no produto.',
}

/**
 * Verifica se a pergunta sanitizada está no escopo do produto.
 */
export function isInScope(
  sanitizedQuestion: string,
  hasClickContext: boolean,
  options?: {
    allowContextualFollowUp?: boolean
    topicHint?: string | null
  }
): boolean {
  if (hasClickContext) return true
  if (options?.allowContextualFollowUp) return true
  const normalized = sanitizedQuestion.toLowerCase()
  return SCOPE_KEYWORDS.some((k) => normalized.includes(k))
}

/**
 * Extrai e valida contexto de clique da requisição.
 */
export function extractClickContext(contextRaw: Record<string, unknown>): {
  safeClickedTargetId: string
  clickedText: string
  clickedTag: string
  hasClickContext: boolean
  clickContextBlock: string
} {
  const clickedTargetId =
    typeof contextRaw.clickedTargetId === 'string' ? contextRaw.clickedTargetId.slice(0, 64) : ''
  const clickedTextRaw = typeof contextRaw.clickedText === 'string' ? contextRaw.clickedText : ''
  const clickedText = clickedTextRaw.replace(/\s+/g, ' ').trim().slice(0, 140)
  const clickedTag =
    typeof contextRaw.clickedTag === 'string' ? contextRaw.clickedTag.slice(0, 32) : ''
  const safeClickedTargetId = (ALLOWED_IDS as readonly string[]).includes(clickedTargetId) ? clickedTargetId : ''
  const hasClickContext = Boolean(safeClickedTargetId || clickedText)
  const clickedDescription = safeClickedTargetId ? CLICK_TARGET_DESCRIPTIONS[safeClickedTargetId] || '' : ''

  const clickContextBlock = hasClickContext
    ? `\nCONTEXTO DO CLIQUE:\n- targetId: ${safeClickedTargetId || 'não mapeado'}\n- texto: ${clickedText || 'sem texto visível'}\n- elemento: ${clickedTag || 'desconhecido'}\n- descrição: ${clickedDescription || 'interprete o item pelo texto visível e pelo papel dele na página'}\n`
    : ''

  return { safeClickedTargetId, clickedText, clickedTag, hasClickContext, clickContextBlock }
}
