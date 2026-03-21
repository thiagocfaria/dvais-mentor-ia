/**
 * Detecção de Intenção Avançada
 * Identifica a intenção do usuário antes de chamar o LLM
 * Ajuda a ajustar o prompt e melhorar a resposta
 * 
 * Melhorias implementadas:
 * - Confidence calculation sofisticada (pesos, normalização, overlap)
 * - Regex patterns robustos (pontuação, fuzzy matching)
 * - Tratamento de intenções compostas
 * - Contexto de conversa
 * - Validação e métricas
 */

export type IntentType =
  | 'pergunta_sobre'
  | 'navegar_para'
  | 'comparar'
  | 'explicar'
  | 'como_funciona'
  | 'preco'
  | 'cadastro'
  | 'saudacao'      // "oi", "olá", "bom dia"
  | 'despedida'     // "tchau", "até mais", "obrigado"
  | 'reclamacao'    // "não funciona", "está errado", "bug"
  | 'elogio'        // "muito bom", "adorei", "parabéns"
  | 'confirmar'     // "sim", "ok", "pode ser"
  | 'negar'         // "não", "não quero", "cancela"
  | 'outro'

export interface DetectedIntent {
  type: IntentType
  confidence: number
  keywords: string[]
  secondaryIntents?: IntentType[] // Intenções secundárias detectadas
}

// Tipo para padrão com peso opcional
type PatternWithWeight = RegExp | { pattern: RegExp; weight: number }

// Normalizar texto removendo pontuação e espaços extras
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remover pontuação comum (mas preservar estrutura)
    .replace(/[.,!?;:()\[\]{}'"]/g, ' ')
    // Normalizar espaços múltiplos
    .replace(/\s+/g, ' ')
    .trim()
}

// Distância de Levenshtein para fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

// Fuzzy match com threshold configurável
function fuzzyMatch(text: string, pattern: string, threshold: number = 1): boolean {
  if (pattern.length < 3) return text === pattern
  const distance = levenshteinDistance(text, pattern)
  return distance <= threshold
}

// Padrões com pesos (padrões mais específicos têm peso maior)
const INTENT_PATTERNS: Record<IntentType, PatternWithWeight[]> = {
  pergunta_sobre: [
    { pattern: /o que é/i, weight: 3 },
    { pattern: /o que são/i, weight: 3 },
    { pattern: /o que significa/i, weight: 3 },
    { pattern: /o que faz/i, weight: 2 },
    { pattern: /definição/i, weight: 2 },
    { pattern: /definir/i, weight: 2 },
    { pattern: /que é/i, weight: 2 },
    { pattern: /que são/i, weight: 2 },
  ],
  navegar_para: [
    { pattern: /mostre/i, weight: 2 },
    { pattern: /mostrar/i, weight: 2 },
    { pattern: /vou para/i, weight: 3 },
    { pattern: /quero ver/i, weight: 3 },
    { pattern: /me leve/i, weight: 3 },
    { pattern: /me mostre/i, weight: 3 },
    { pattern: /ir para/i, weight: 2 },
    { pattern: /acessar/i, weight: 2 },
    { pattern: /abrir/i, weight: 2 },
    { pattern: /navegar/i, weight: 2 },
  ],
  comparar: [
    { pattern: /diferença entre/i, weight: 3 },
    { pattern: /diferença de/i, weight: 3 },
    { pattern: /qual melhor/i, weight: 3 },
    { pattern: /qual pior/i, weight: 3 },
    { pattern: /comparar/i, weight: 2 },
    { pattern: /comparação/i, weight: 2 },
    { pattern: /vs/i, weight: 2 },
    { pattern: /versus/i, weight: 2 },
  ],
  explicar: [
    { pattern: /explique/i, weight: 3 },
    { pattern: /explicar/i, weight: 3 },
    { pattern: /me explique/i, weight: 3 },
    { pattern: /funcionamento/i, weight: 2 },
  ],
  como_funciona: [
    { pattern: /como funciona/i, weight: 4 }, // Peso maior para evitar conflito
    { pattern: /como é/i, weight: 2 },
    { pattern: /como fazer/i, weight: 2 },
    { pattern: /como usar/i, weight: 2 },
    { pattern: /como começar/i, weight: 2 },
    { pattern: /passo a passo/i, weight: 2 },
  ],
  preco: [
    { pattern: /preço/i, weight: 3 },
    { pattern: /valor/i, weight: 2 },
    { pattern: /quanto custa/i, weight: 4 },
    { pattern: /quanto é/i, weight: 3 },
    { pattern: /planos/i, weight: 2 },
    { pattern: /assinatura/i, weight: 2 },
    { pattern: /pagar/i, weight: 2 },
  ],
  cadastro: [
    { pattern: /cadastro/i, weight: 3 },
    { pattern: /cadastrar/i, weight: 3 },
    { pattern: /registrar/i, weight: 2 },
    { pattern: /criar conta/i, weight: 4 },
    { pattern: /começar/i, weight: 2 },
    { pattern: /inscrever/i, weight: 2 },
  ],
  saudacao: [
    // Padrões mais flexíveis para capturar variações
    { pattern: /^oi\s*[!.,]?/i, weight: 3 }, // "oi", "oi!", "oi."
    { pattern: /^olá\s*[!.,]?/i, weight: 3 },
    { pattern: /^ola\s*[!.,]?/i, weight: 3 },
    { pattern: /bom dia/i, weight: 4 },
    { pattern: /boa tarde/i, weight: 4 },
    { pattern: /boa noite/i, weight: 4 },
    { pattern: /^e aí/i, weight: 2 },
    { pattern: /^eai/i, weight: 2 },
    { pattern: /^hey\s*[!.,]?/i, weight: 2 },
    { pattern: /^opa\s*[!.,]?/i, weight: 2 },
    { pattern: /^salve/i, weight: 2 },
    { pattern: /^fala/i, weight: 2 },
  ],
  despedida: [
    { pattern: /tchau/i, weight: 3 },
    { pattern: /até mais/i, weight: 3 },
    { pattern: /obrigado/i, weight: 3 },
    { pattern: /obrigada/i, weight: 3 },
    { pattern: /valeu/i, weight: 2 },
    { pattern: /falou/i, weight: 2 },
    { pattern: /flw/i, weight: 2 },
    { pattern: /até logo/i, weight: 3 },
    { pattern: /até breve/i, weight: 3 },
    { pattern: /até/i, weight: 1 }, // Peso menor para evitar falsos positivos
  ],
  reclamacao: [
    { pattern: /não funciona/i, weight: 4 },
    { pattern: /está errado/i, weight: 3 },
    { pattern: /bug/i, weight: 3 },
    { pattern: /problema/i, weight: 2 },
    { pattern: /erro/i, weight: 2 },
    { pattern: /travou/i, weight: 3 },
    { pattern: /não está funcionando/i, weight: 4 },
    { pattern: /está com problema/i, weight: 3 },
    { pattern: /tem erro/i, weight: 3 },
    { pattern: /não está/i, weight: 1 },
  ],
  elogio: [
    { pattern: /muito bom/i, weight: 3 },
    { pattern: /adorei/i, weight: 3 },
    { pattern: /parabéns/i, weight: 4 },
    { pattern: /excelente/i, weight: 3 },
    { pattern: /perfeito/i, weight: 3 },
    { pattern: /top/i, weight: 2 },
    { pattern: /incrível/i, weight: 3 },
    { pattern: /fantástico/i, weight: 3 },
    { pattern: /ótimo/i, weight: 2 },
    { pattern: /show/i, weight: 2 },
  ],
  confirmar: [
    { pattern: /^sim\s*[!.,]?$/i, weight: 4 },
    { pattern: /^ok\s*[!.,]?$/i, weight: 3 },
    { pattern: /^pode ser$/i, weight: 3 },
    { pattern: /^claro\s*[!.,]?$/i, weight: 3 },
    { pattern: /^beleza\s*[!.,]?$/i, weight: 2 },
    { pattern: /^blz\s*[!.,]?$/i, weight: 2 },
    { pattern: /^tudo bem$/i, weight: 2 },
    { pattern: /^td bem$/i, weight: 2 },
    { pattern: /^combinado$/i, weight: 2 },
  ],
  negar: [
    { pattern: /^não\s*[!.,]?$/i, weight: 4 },
    { pattern: /^nao\s*[!.,]?$/i, weight: 4 },
    { pattern: /não quero/i, weight: 4 },
    { pattern: /cancela/i, weight: 3 },
    { pattern: /deixa pra lá/i, weight: 3 },
    { pattern: /não preciso/i, weight: 3 },
    { pattern: /não quero mais/i, weight: 4 },
    { pattern: /cancelar/i, weight: 3 },
  ],
  outro: [], // Fallback
}

// Prioridades de intenções (intenções com prioridade maior são escolhidas primeiro em caso de empate)
const INTENT_PRIORITIES: Record<IntentType, number> = {
  saudacao: 10,      // Alta prioridade (geralmente no início)
  despedida: 9,      // Alta prioridade (geralmente no final)
  reclamacao: 8,     // Alta prioridade (precisa atenção)
  elogio: 7,         // Média-alta prioridade
  confirmar: 6,      // Média prioridade
  negar: 6,          // Média prioridade
  cadastro: 5,       // Média prioridade
  preco: 5,          // Média prioridade
  navegar_para: 4,   // Média-baixa prioridade
  como_funciona: 4,  // Média-baixa prioridade
  pergunta_sobre: 3, // Baixa prioridade
  explicar: 3,       // Baixa prioridade
  comparar: 3,       // Baixa prioridade
  outro: 0,          // Sem prioridade
}

// Contar número total de padrões por intenção (para normalização)
const INTENT_PATTERN_COUNTS: Record<IntentType, number> = Object.fromEntries(
  Object.entries(INTENT_PATTERNS).map(([intent, patterns]) => [
    intent,
    patterns.length || 1, // Evitar divisão por zero
  ])
) as Record<IntentType, number>

// Histórico de intenções (para contexto de conversa)
const conversationHistory: Array<{ intent: IntentType; timestamp: number }> = []
const MAX_HISTORY_SIZE = 10

// Adicionar intenção ao histórico
function addToHistory(intent: IntentType) {
  conversationHistory.push({ intent, timestamp: Date.now() })
  if (conversationHistory.length > MAX_HISTORY_SIZE) {
    conversationHistory.shift()
  }
}

// Obter contexto de conversa (últimas intenções)
function getConversationContext(): {
  recentIntents: IntentType[]
  hasRecentIntent: (intent: IntentType) => boolean
} {
  const recent = conversationHistory
    .filter(h => Date.now() - h.timestamp < 60000) // Último minuto
    .map(h => h.intent)

  return {
    recentIntents: recent,
    hasRecentIntent: (intent: IntentType) => recent.includes(intent),
  }
}

// Normalizar padrão (extrair RegExp e peso)
function normalizePattern(pattern: PatternWithWeight): { pattern: RegExp; weight: number } {
  if (pattern instanceof RegExp) {
    return { pattern, weight: 1 }
  }
  return { pattern: pattern.pattern, weight: pattern.weight }
}

// Testar padrão com fuzzy matching opcional
function testPattern(text: string, pattern: RegExp, weight: number, useFuzzy: boolean = false): {
  matched: boolean
  score: number
  keyword?: string
} {
  // Teste exato primeiro
  if (pattern.test(text)) {
    const match = text.match(pattern)
    return {
      matched: true,
      score: weight,
      keyword: match ? match[0] : undefined,
    }
  }

  // Se não encontrou e fuzzy está habilitado, tentar fuzzy matching
  if (useFuzzy && pattern.source.length >= 3) {
    // Extrair texto do padrão (remover flags e caracteres especiais)
    const patternText = pattern.source
      .replace(/^\^|\$$/g, '')
      .replace(/\\[sS]/g, ' ')
      .replace(/\[!.,\]\?/g, '')
      .replace(/[.*+?^${}()|[\]\\]/g, '')
      .toLowerCase()

    if (patternText.length >= 3) {
      const words = text.split(/\s+/)
      for (const word of words) {
        if (fuzzyMatch(word, patternText, 1)) {
          return {
            matched: true,
            score: weight * 0.7, // Penalizar fuzzy matches
            keyword: word,
          }
        }
      }
    }
  }

  return { matched: false, score: 0 }
}

export function detectIntent(
  question: string,
  options?: {
    useFuzzy?: boolean
    considerHistory?: boolean
    detectMultiple?: boolean
  }
): DetectedIntent {
  const {
    useFuzzy = true,
    considerHistory = true,
    detectMultiple = true,
  } = options || {}

  const normalized = normalizeText(question)
  const context = considerHistory ? getConversationContext() : null

  // Scores para cada intenção
  const intentScores = new Map<IntentType, { score: number; keywords: string[] }>()

  // Verificar cada tipo de intenção
  for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
    const intent = intentType as IntentType
    let totalScore = 0
    const matchedKeywords: string[] = []

    for (const patternWithWeight of patterns) {
      const { pattern, weight } = normalizePattern(patternWithWeight)
      const result = testPattern(normalized, pattern, weight, useFuzzy)

      if (result.matched) {
        totalScore += result.score
        if (result.keyword) {
          matchedKeywords.push(result.keyword)
        }
      }
    }

    // Ajustar score baseado em contexto de conversa
    if (context && considerHistory) {
      // Se já detectamos esta intenção recentemente, reduzir score (evitar repetição)
      if (context.hasRecentIntent(intent)) {
        totalScore *= 0.5
      }
      // Boost para intenções que fazem sentido após outras (ex: despedida após saudacao)
      if (intent === 'despedida' && context.hasRecentIntent('saudacao')) {
        totalScore *= 1.2
      }
    }

    // Normalizar score pelo número de padrões (evitar bias para intenções com muitos padrões)
    const normalizedScore = totalScore / INTENT_PATTERN_COUNTS[intent]

    if (normalizedScore > 0) {
      intentScores.set(intent, {
        score: normalizedScore,
        keywords: matchedKeywords,
      })
    }
  }

  // Se detectMultiple, retornar múltiplas intenções
  if (detectMultiple && intentScores.size > 1) {
    // Ordenar por score e prioridade
    const sortedIntents = Array.from(intentScores.entries())
      .sort((a, b) => {
        // Primeiro por score
        if (Math.abs(a[1].score - b[1].score) > 0.1) {
          return b[1].score - a[1].score
        }
        // Depois por prioridade
        return INTENT_PRIORITIES[b[0]] - INTENT_PRIORITIES[a[0]]
      })

    const bestIntent = sortedIntents[0]
    const secondaryIntents = sortedIntents
      .slice(1)
      .filter(([_, data]) => data.score >= bestIntent[1].score * 0.5) // Pelo menos 50% do score da melhor
      .map(([intent]) => intent)
      .slice(0, 2) // Máximo 2 intenções secundárias

    // Calcular confidence sofisticada
    const bestScore = bestIntent[1].score
    const secondBestScore = sortedIntents[1]?.[1].score || 0

    // Se há overlap significativo (segunda melhor muito próxima), reduzir confidence
    const overlapPenalty = secondBestScore > bestScore * 0.8 ? 0.2 : 0

    // Confidence baseada em score normalizado, prioridade e overlap
    let confidence = Math.min(bestScore * 2, 1) // Multiplicar por 2 para melhor escala
    confidence = Math.max(confidence - overlapPenalty, 0.3) // Mínimo 0.3

    // Boost para intenções com alta prioridade
    const priorityBoost = INTENT_PRIORITIES[bestIntent[0]] / 10
    confidence = Math.min(confidence + priorityBoost * 0.1, 1)

    const result: DetectedIntent = {
      type: bestIntent[0],
      confidence: Math.round(confidence * 100) / 100, // Arredondar para 2 casas decimais
      keywords: [...new Set(bestIntent[1].keywords)],
      secondaryIntents: secondaryIntents.length > 0 ? secondaryIntents : undefined,
    }

    // Adicionar ao histórico
    if (considerHistory) {
      addToHistory(result.type)
    }

    return result
  }

  // Modo simples (apenas melhor intenção)
  let bestIntent: IntentType = 'outro'
  let bestScore = 0
  let bestKeywords: string[] = []

  for (const [intent, data] of intentScores.entries()) {
    const finalScore = data.score + INTENT_PRIORITIES[intent] / 100 // Adicionar pequeno boost de prioridade

    if (finalScore > bestScore) {
      bestScore = finalScore
      bestIntent = intent
      bestKeywords = data.keywords
    }
  }

  // Calcular confidence
  const secondBest = Array.from(intentScores.values())
    .map(d => d.score)
    .sort((a, b) => b - a)[1] || 0

  const overlapPenalty = secondBest > bestScore * 0.8 ? 0.2 : 0
  let confidence = Math.min(bestScore * 2, 1)
  confidence = Math.max(confidence - overlapPenalty, 0.3)

  const priorityBoost = INTENT_PRIORITIES[bestIntent] / 10
  confidence = Math.min(confidence + priorityBoost * 0.1, 1)

  const result: DetectedIntent = {
    type: bestIntent,
    confidence: Math.round(confidence * 100) / 100,
    keywords: [...new Set(bestKeywords)],
  }

  // Adicionar ao histórico
  if (considerHistory) {
    addToHistory(result.type)
  }

  return result
}

/**
 * Ajustar prompt baseado na intenção detectada
 */
export function getIntentBasedPrompt(intent: DetectedIntent, basePrompt: string): string {
  const intentPrompts: Record<IntentType, string> = {
    pergunta_sobre: 'O usuário quer uma definição clara e objetiva. Seja direto e didático.',
    navegar_para:
      'O usuário quer navegar para uma página específica. Sugira a rota apropriada e use a action navigateRoute.',
    comparar: 'O usuário quer comparar opções. Liste diferenças de forma clara e objetiva.',
    explicar:
      'O usuário quer uma explicação detalhada. Seja didático e use exemplos quando possível.',
    como_funciona:
      'O usuário quer entender o funcionamento passo a passo. Seja claro e estruturado.',
    preco:
      'O usuário está perguntando sobre preços. Direcione para cadastro/login sem mencionar valores específicos.',
    cadastro: 'O usuário quer se cadastrar. Use a action navigateRoute para /cadastro.',
    saudacao: 'O usuário está cumprimentando. Seja cordial e ofereça ajuda de forma amigável.',
    despedida: 'O usuário está se despedindo. Seja educado e deixe claro que está disponível para ajudar quando precisar.',
    reclamacao: 'O usuário está reportando um problema. Seja empático, peça desculpas se necessário e ofereça ajuda para resolver.',
    elogio: 'O usuário está elogiando. Agradeça de forma genuína e continue oferecendo um bom serviço.',
    confirmar: 'O usuário está confirmando algo. Continue com a ação ou confirmação de forma positiva.',
    negar: 'O usuário está negando ou cancelando algo. Respeite a decisão e ofereça alternativas se apropriado.',
    outro: '',
  }

  // Se há intenções secundárias, mencionar no prompt
  let intentPrompt = intentPrompts[intent.type]
  if (intent.secondaryIntents && intent.secondaryIntents.length > 0) {
    const secondaryPrompts = intent.secondaryIntents
      .map(secondary => intentPrompts[secondary])
      .filter(Boolean)
      .join(' ')
    if (secondaryPrompts) {
      intentPrompt += ` Também considere: ${secondaryPrompts}`
    }
  }

  if (!intentPrompt) {
    return basePrompt
  }

  return `${basePrompt}\n\nContexto adicional: ${intentPrompt}`
}

/**
 * Limpar histórico de conversa (útil para testes ou reset)
 */
export function clearConversationHistory() {
  conversationHistory.length = 0
}

/**
 * Obter estatísticas de intenções detectadas
 */
export function getIntentStatistics(): {
  totalDetections: number
  intentCounts: Record<IntentType, number>
  recentIntents: IntentType[]
} {
  const counts: Record<IntentType, number> = {} as Record<IntentType, number>
  
  for (const { intent } of conversationHistory) {
    counts[intent] = (counts[intent] || 0) + 1
  }

  return {
    totalDetections: conversationHistory.length,
    intentCounts: counts,
    recentIntents: conversationHistory.slice(-5).map(h => h.intent),
  }
}
