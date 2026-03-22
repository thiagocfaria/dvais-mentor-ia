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
  // Áreas do produto
  'cadastro', 'cadastrar', 'registrar', 'criar conta', 'login', 'logar', 'entrar',
  'análise', 'analise', 'analisar', 'indicador', 'mercado', 'gráfico', 'candle',
  'proteção', 'protecao', 'proteger', 'segurança', 'seguranca', 'seguro',
  'aprendizado', 'aprender', 'trilha', 'educação', 'educacao',
  'resultado', 'métrica', 'estatística', 'número',
  // Identidade do produto
  'dvais', 'davi', 'mentor', 'plataforma', 'produto', 'projeto', 'site', 'pagina', 'página',
  // Perguntas comuns
  'como funciona', 'o que é', 'o que faz', 'para que serve', 'pra que serve',
  'investimento', 'investir', 'corretora', 'guia', 'funcionalidade',
  // Preço e valor
  'preço', 'preco', 'valor', 'plano', 'assinatura', 'custa', 'custo', 'grátis', 'gratuito', 'quanto',
  // Suporte e ajuda
  'suporte', 'ajuda', 'tutorial', 'contato', 'whatsapp',
  // Perfis
  'iniciante', 'aventureiro', 'analista',
  // Assistente e voz
  'assistente', 'chat', 'voz', 'celular', 'mobile', 'microfone', 'áudio', 'audio', 'toque', 'clique',
  // Financeiro e risco
  'dinheiro', 'lucro', 'ganhar', 'perder', 'risco', 'capital', 'despesa', 'receita',
  'alerta', 'alertas', 'disciplina', 'checklist',
  // Confiança e regulação
  'consultoria', 'regulado', 'confiável', 'confiar', 'dados', 'privacidade',
  // Funcionalidades específicas
  'guia financeiro', 'relatório', 'personalização', 'adapta',
  // Técnico (manter para perguntas meta)
  'oferece', 'oferecem', 'ia', 'kb', 'base de conhecimento', 'llm',
  'contexto', 'acao', 'ações', 'resposta', 'token', 'quota', 'cache', 'rate limit', 'circuit breaker',
] as const

// Saudações com word-boundary (evitar "oi" matchando dentro de "depois")
const GREETING_PATTERNS = [
  /\boi\b/i, /\bol[aá]\b/i, /\bbom dia\b/i, /\bboa tarde\b/i, /\bboa noite\b/i,
  /\bopa\b/i, /\beai\b/i, /\beae\b/i, /\bhey\b/i, /\bsalve\b/i,
  /\bobrigad[oa]\b/i, /\bvaleu\b/i, /\btchau\b/i, /\bat[ée] mais\b/i,
]

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
  if (SCOPE_KEYWORDS.some((k) => normalized.includes(k))) return true
  if (GREETING_PATTERNS.some((re) => re.test(normalized))) return true
  return false
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
