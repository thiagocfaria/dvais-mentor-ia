import { isPracticalOpenQuestion } from '@/biblioteca/assistente/conversationSignals'

export const KB_VERSION = 'kb_2026-03-22_v3'

export type KBAction =
  | { type: 'navigateRoute'; route: string; targetId?: string } // targetId opcional para scroll pós-navegação
  | { type: 'scrollToSection'; targetId: string }
  | { type: 'highlightSection'; targetId: string }
  | { type: 'showTooltip'; targetId: string; text: string }

// Tipo para keyword com peso opcional
export type KeywordWithWeight = string | { term: string; weight: number }

export type KBEntry = {
  id: string
  title: string
  keywords: KeywordWithWeight[] // Suporta string simples ou objeto com peso
  responses: string[] // múltiplas variações
  actions?: KBAction[]
  ctas?: { label: string; route: string }[]
}

// Formato antigo (compatibilidade)
type LegacyKBEntry = {
  id: string
  title: string
  keywords: string[]
  answer: string // singular
  answers?: string[] // plural (também suportado)
  targetId?: string
}

// Resposta da KB (Opção A): retorna entryId e responses para client escolher variação
export type KBReplyRaw = {
  entryId: string
  responses: string[]
  actions?: KBAction[]
  ctas?: { label: string; route: string }[]
  confidence?: number
  score?: number
  reason?: string
  matchedTerms?: string[]
} | null

// Resposta final montada pelo client (com spokenText escolhido)
export type KBReply = {
  spokenText: string
  actions?: KBAction[]
  ctas?: { label: string; route: string }[]
} | null

// FORBIDDEN_TOPICS: apenas fora de escopo + credenciais + código interno + MVP/futuro/avatar
// NÃO incluir "garantia de lucro" - isso vira entrada da KB (garantia_lucro)
export const FORBIDDEN_TOPICS = [
  // Fora de escopo
  'futebol',
  'política',
  'religião',
  'celebridades',
  // Credenciais
  'senha',
  '2fa',
  'código de verificação',
  'seed',
  'chave privada',
  // Código interno
  'repositório',
  'github',
  'vercel',
  'env',
  'api key',
  'prompt interno',
  // MVP/futuro/avatar
  'mvp',
  'em breve',
  'futuro',
  'ainda não existe',
  'avatar 3d',
  'avatar interativo',
]

export const GLOSSARY: Record<string, string[]> = {
  candlestick: [
    'Candlestick (vela) é um jeito visual de ver preço: abertura, fechamento, máxima e mínima em um período. Ajuda a entender força compradora/vendedora e padrões.',
  ],
  'livro de ordens': [
    'Livro de ordens mostra as ofertas de compra e venda (bids/asks) em diferentes preços. Ele ajuda a enxergar liquidez e possíveis zonas de disputa.',
  ],
  'profundidade do mercado': [
    'Profundidade do mercado é a visualização agregada do livro de ordens. Ela indica onde existe mais liquidez e como o preço pode reagir a grandes ordens.',
  ],
  volume: [
    'Volume é quanto foi negociado. Volume alto costuma indicar mais interesse/convicção no movimento; volume baixo pode indicar fragilidade.',
  ],
  'indicadores técnicos': [
    'Indicadores técnicos são cálculos em cima do preço/volume (ex.: médias, RSI, MACD). Eles não "adivinham", mas ajudam a organizar contexto e risco.',
  ],
  'tipos de ordens': [
    'Tipos de ordens (mercado, limite, stop, OCO) mudam como você entra/saí. A escolha certa reduz erro e melhora controle de risco.',
  ],
  'funding rate': [
    'Funding Rate é uma taxa periódica comum em contratos perpétuos. Ela pode indicar desequilíbrio entre comprados e vendidos.',
  ],
  'open interest': [
    'Open Interest é o total de posições abertas em derivativos. Ele pode mostrar se o movimento tem participação "nova" ou só rotação.',
  ],
  'long/short': [
    'Long/Short ratio compara a proporção de posições compradas e vendidas. É útil como leitura de sentimento, com cautela (pode ser contrarian).',
  ],
  'stop loss': [
    'Stop Loss é uma ordem automática para limitar perdas: você define um preço e, se o ativo chegar nele, a ordem é executada automaticamente.',
    'Stop Loss protege seu capital: você define um limite de perda aceitável e a ordem fecha sua posição automaticamente se o preço cair até lá.',
    'Stop Loss é essencial para gestão de risco: define um preço de saída automático para limitar perdas em operações que não saem como esperado.',
  ],
  'take profit': [
    'Take Profit é uma ordem automática para garantir lucro: você define um preço-alvo e, quando o ativo chegar nele, a ordem fecha automaticamente.',
    'Take Profit garante que você não perca lucros: define um preço de saída e a ordem executa automaticamente quando o ativo atinge esse valor.',
    'Take Profit ajuda a manter disciplina: você define um objetivo de lucro e a ordem fecha automaticamente quando alcança, evitando ganância.',
  ],
  margem: [
    'Margem é usar dinheiro emprestado da corretora para operar. Aumenta potencial de lucro, mas também aumenta risco de perda.',
    'Margem permite operar com mais capital do que você tem, mas se a operação der errado, você pode perder mais do que investiu.',
    'Margem multiplica tanto ganhos quanto perdas. Use com muito cuidado e sempre com stop loss para proteger seu capital.',
  ],
  liquidação: [
    'Liquidação é quando a corretora fecha sua posição automaticamente porque você não tem mais margem suficiente para mantê-la.',
    'Liquidação acontece quando suas perdas consomem toda a margem disponível. A corretora fecha a posição para proteger o empréstimo.',
    'Liquidação é um risco real ao usar margem: se o preço se mover contra você e consumir toda a margem, a corretora fecha sua posição automaticamente.',
  ],
  alavancagem: [
    'Alavancagem é multiplicar seu poder de compra usando margem. Exemplo: 10x significa que com R$ 100 você opera como se tivesse R$ 1000.',
    'Alavancagem aumenta tanto lucros quanto perdas. Use com muito cuidado e sempre com stop loss.',
    'Alavancagem é uma faca de dois gumes: pode multiplicar ganhos, mas também multiplica perdas. Iniciantes devem evitar ou usar com muito cuidado.',
  ],
  spread: [
    'Spread é a diferença entre o preço de compra (ask) e venda (bid). É o "custo" da operação.',
    'Spread é o que a corretora ganha em cada operação. Quanto menor o spread, melhor para você.',
    'Spread é a diferença entre o preço que você paga para comprar e o preço que recebe para vender. Quanto menor, melhor.',
  ],
  'maker/taker': [
    'Maker adiciona liquidez ao mercado (ordem limite que não executa imediatamente). Taker remove liquidez (ordem mercado que executa na hora).',
    'Maker geralmente paga taxas menores porque ajuda o mercado. Taker paga mais porque executa imediatamente.',
    'Maker coloca ordem no livro e espera alguém aceitar (taxa menor). Taker pega ordem já no livro (taxa maior, execução imediata).',
  ],
  whale: [
    'Whale (baleia) é um investidor com muito capital que pode mover o mercado com suas operações grandes.',
    'Whale são grandes investidores cujas operações podem causar movimentos significativos de preço.',
    'Whale são investidores institucionais ou muito ricos cujas operações grandes podem causar volatilidade no mercado.',
  ],
  'pump and dump': [
    'Pump and dump é um esquema onde alguém infla artificialmente o preço de um ativo e depois vende tudo, deixando outros com perdas.',
    'Pump and dump é manipulação de mercado: preço sobe artificialmente e depois cai quando os manipuladores vendem.',
    'Pump and dump é golpe: preço sobe artificialmente através de propaganda, depois os golpistas vendem e o preço despenca.',
  ],
  fomo: [
    'FOMO (Fear Of Missing Out) é o medo de perder uma oportunidade. Pode levar a decisões impulsivas e ruins.',
    'FOMO é quando você compra porque está subindo rápido, sem analisar. Geralmente resulta em compra no topo.',
    'FOMO é comprar por medo de perder, sem análise. Geralmente leva a compras ruins no topo do movimento.',
  ],
  hodl: [
    'HODL (Hold On for Dear Life) é segurar um ativo por muito tempo, mesmo em quedas, acreditando que vai valorizar no longo prazo.',
    'HODL é uma estratégia de longo prazo: comprar e segurar, ignorando volatilidade de curto prazo.',
    'HODL é estratégia de longo prazo: comprar e não vender mesmo em quedas, acreditando na valorização futura.',
  ],
}

// Adaptador para formato antigo
function adaptLegacyEntry(entry: LegacyKBEntry): KBEntry {
  const responses = entry.answers || [entry.answer]
  return {
    id: entry.id,
    title: entry.title || entry.id,
    keywords: entry.keywords,
    responses,
    actions: entry.targetId
      ? [{ type: 'scrollToSection' as const, targetId: entry.targetId }]
      : undefined,
  }
}

// pickVariant: memória no client (sessionStorage)
// No server, usar random simples sem memória
export function pickVariant(responses: string[], entryId: string, seed?: number): string {
  if (typeof window === 'undefined') {
    // Server: random simples
    const index =
      seed !== undefined ? seed % responses.length : Math.floor(Math.random() * responses.length)
    return responses[index]
  }

  // Client: usar memória no sessionStorage
  const storageKey = `lastResponse_${entryId}`
  const lastIndexStr = sessionStorage.getItem(storageKey)
  const lastIndex = lastIndexStr !== null ? parseInt(lastIndexStr, 10) : -1

  let selectedIndex = Math.floor(Math.random() * responses.length)
  // Evitar repetir a última resposta se houver múltiplas opções
  if (responses.length > 1 && selectedIndex === lastIndex) {
    selectedIndex = (selectedIndex + 1) % responses.length
  }

  sessionStorage.setItem(storageKey, String(selectedIndex))
  return responses[selectedIndex]
}

export const ENTRIES: KBEntry[] = [
  {
    id: 'elevator_pitch',
    title: 'O que é o DVAi$',
    keywords: [
      // Keywords com peso (termos mais relevantes têm peso maior)
      { term: 'dvais', weight: 7 }, // Termo mais específico e importante
      { term: 'o que é o dvais', weight: 8 },
      { term: 'mentor', weight: 4 },
      { term: 'o que é', weight: 3 },
      { term: 'plataforma', weight: 2 },
      // Keywords consolidadas da entrada 'funcionamento' (peso menor)
      { term: 'funcionamento', weight: 1 },
      { term: 'como usar', weight: 1 },
      { term: 'tutorial', weight: 1 },
      { term: 'passo a passo', weight: 1 },
      { term: 'como começar', weight: 1 },
      // Keywords coloquiais
      { term: 'oque é', weight: 2 },
      { term: 'oq é', weight: 2 },
      { term: 'me explica o que é', weight: 2 },
      { term: 'fala sobre', weight: 1 },
      { term: 'conta sobre', weight: 1 },
    ],
    responses: [
      'O DVAi$ é uma plataforma de mentoria em investimentos com IA. Ela vai te guiar pela análise de mercado, ensinar a interpretar indicadores e te proteger de decisões impulsivas — tudo por voz ou clique. Quer conhecer melhor?',
      'O DVAi$ vai ser o seu mentor de investimentos: uma plataforma que te ensina a investir com segurança, do iniciante ao analista — sem prometer lucro e sem pedir senha. Posso te mostrar como funciona.',
      'Imagina ter um mentor que te acompanha na hora de investir: explica os dados, te alerta sobre riscos e te ensina na prática. É isso que o DVAi$ vai oferecer. Quer ver as funcionalidades?',
    ],
    actions: [
      { type: 'navigateRoute', route: '/' },
      { type: 'scrollToSection', targetId: 'hero-content' },
      { type: 'highlightSection', targetId: 'hero-content' },
    ],
    ctas: [
      { label: 'Começar agora', route: '/cadastro' },
      { label: 'Login', route: '/login' },
    ],
  },
  {
    id: 'tour_menu',
    title: 'Tour do site',
    keywords: [
      'tour',
      'me mostra',
      'mostra',
      'mostre',
      'guia',
      'navegar',
      'explicar a página',
      'dar uma olhada',
      'ver o site',
      'me guia',
      'me guiar',
      'fazer um tour',
      'bora ver',
      'vamos ver',
    ],
    responses: [
      'Bora! A plataforma tem 3 áreas principais: análise de mercado guiada, proteção inteligente e trilha de aprendizado. Posso te apresentar cada uma — por qual quer começar?',
      'Posso te mostrar o site agora: te apresento cada seção e explico o que a plataforma vai oferecer em cada parte. Começo pela análise, proteção ou aprendizado?',
      'Tour rápido: vou te apresentar as 3 áreas do DVAi$ e explicar o que cada uma faz. Começo pela análise guiada?',
    ],
    actions: [{ type: 'navigateRoute', route: '/' }],
  },
  {
    id: 'analise_em_tempo_real',
    title: 'Análise em tempo real',
    keywords: [
      { term: 'análise em tempo real', weight: 8 },
      { term: 'o que é a análise', weight: 7 },
      { term: 'análise', weight: 5 },
      { term: 'tempo real', weight: 5 },
      { term: 'indicadores', weight: 4 },
      { term: 'mercado', weight: 3 },
      { term: 'ordens', weight: 3 },
      { term: 'monitoramento', weight: 3 },
      { term: 'dados mercado', weight: 5 },
      { term: 'análise técnica', weight: 6 },
      { term: 'dados corretora', weight: 4 },
      { term: 'ver mercado', weight: 5 },
      { term: 'checar mercado', weight: 4 },
      { term: 'dados do mercado', weight: 5 },
      { term: 'ver indicadores', weight: 5 },
      { term: 'dados em tempo real', weight: 6 },
      { term: 'candlestick', weight: 4 },
      { term: 'gráfico', weight: 3 },
      { term: 'livro de ordens', weight: 5 },
    ],
    responses: [
      'A plataforma vai te ensinar a ler candlesticks, volume, livro de ordens e indicadores técnicos — passo a passo, com a IA explicando cada sinal na prática. Quer ver o que ela cobre?',
      'Na análise guiada, a plataforma destaca os dados importantes do mercado e a IA explica o que cada indicador significa, te ajudando a montar sua leitura antes de decidir.',
      'Funciona assim: a plataforma mostra os dados de mercado e a IA te explica o contexto e os sinais relevantes. Tudo baseado em leitura técnica que você aprende a fazer. Posso te mostrar a página de análise.',
    ],
    actions: [{ type: 'navigateRoute', route: '/analise-tempo-real', targetId: 'analise-hero' }],
  },
  {
    id: 'protecao_inteligente',
    title: 'Proteção inteligente',
    keywords: [
      { term: 'proteção inteligente', weight: 8 },
      { term: 'como funciona a proteção', weight: 7 },
      { term: 'como funciona a segurança', weight: 7 },
      { term: 'proteção', weight: 5 },
      { term: 'segurança', weight: 4 },
      { term: 'privacidade', weight: 3 },
      { term: 'golpe', weight: 3 },
      { term: 'custódia', weight: 3 },
      { term: 'risco', weight: 3 },
      { term: 'transparência', weight: 2 },
      { term: 'gestão risco', weight: 4 },
      { term: 'camadas segurança', weight: 4 },
      { term: 'me proteger', weight: 4 },
      { term: 'seguro', weight: 3 },
      { term: 'não ser enganado', weight: 3 },
      { term: 'evitar golpe', weight: 3 },
      { term: 'ficar seguro', weight: 3 },
      { term: 'proteger meu dinheiro', weight: 5 },
    ],
    responses: [
      'A proteção inteligente é um dos diferenciais do DVAi$: a plataforma te avisa antes de decisões arriscadas, nunca pede sua senha e não promete lucro. Você fica no comando, a IA só garante que você decide com informação.',
      'A segurança do DVAi$ funciona em camadas: proteção contra abuso, validação de ações, alertas de risco e, o mais importante, a plataforma nunca guarda seus ativos nem pede credenciais. Quer ver os detalhes?',
      'O DVAi$ protege você com várias camadas: orientação técnica contra decisões por impulso, alertas de risco, checklist antes de agir e zero acesso às suas credenciais. Posso te mostrar a página de segurança.',
    ],
    actions: [{ type: 'navigateRoute', route: '/seguranca', targetId: 'seguranca-hero' }],
  },
  {
    id: 'aprendizado_continuo',
    title: 'Aprendizado contínuo',
    keywords: [
      { term: 'aprendizado contínuo', weight: 8 },
      { term: 'aprendizado continuo', weight: 8 },
      { term: 'aprendizado', weight: 4 },
      { term: 'aprender', weight: 3 },
      { term: 'trilha', weight: 3 },
      { term: 'trilha de aprendizado', weight: 6 },
      { term: 'iniciante aventureiro analista', weight: 5 },
      { term: 'evolui', weight: 2 },
      { term: 'evoluir', weight: 2 },
      { term: 'aprende com você', weight: 4 },
      { term: 'educação', weight: 2 },
      { term: 'aprender a investir', weight: 4 },
      { term: 'como aprender', weight: 4 },
      { term: 'me ensinar', weight: 3 },
      { term: 'ensinar', weight: 2 },
      { term: 'aprender fazendo', weight: 4 },
      { term: 'perfil de investidor', weight: 4 },
    ],
    responses: [
      'No DVAi$, você evolui no seu ritmo: começa como iniciante aprendendo o básico, avança para aventureiro praticando leitura de mercado e chega a analista. A plataforma acompanha cada etapa com a IA.',
      'O aprendizado na plataforma é prático: a IA explica conceitos enquanto você navega, mostra exemplos reais e aumenta a profundidade conforme você evolui. Quer ver como funciona?',
      'A trilha do DVAi$ funciona assim: iniciante (conceitos básicos) → aventureiro (leitura de contexto) → analista (confluência de sinais e gestão de risco). Posso te mostrar a página de aprendizado.',
    ],
    actions: [
      { type: 'navigateRoute', route: '/aprendizado-continuo', targetId: 'aprendizado-hero' },
    ],
  },
  {
    id: 'perfil_iniciante',
    title: 'O que é Iniciante',
    keywords: ['iniciante', 'sou iniciante', 'começando', 'não sei'],
    responses: [
      'Se você está começando, o DVAi$ é perfeito pra você: a plataforma traduz os termos do mercado, mostra exemplos e te dá um roteiro claro do básico ao avançado.',
      'Para quem está começando, a plataforma simplifica tudo: explica candles, ordens, volume e risco com linguagem direta e passos práticos. Quer se cadastrar e experimentar?',
      'Para iniciantes, o DVAi$ segue uma regra: clareza primeiro, pressa depois. A IA ensina o que olhar antes de agir. É o jeito mais seguro de começar a investir.',
    ],
    actions: [{ type: 'navigateRoute', route: '/aprendizado-continuo' }],
  },
  {
    id: 'perfil_aventureiro',
    title: 'O que é Aventureiro',
    keywords: ['aventureiro', 'já mexi', 'tenho noção', 'quero arriscar'],
    responses: [
      'Aventureiro é quem já sabe o básico e quer ir além com método. A plataforma foca em leitura de contexto, disciplina e controle de risco pra esse perfil.',
      'Se você já entende o básico, o DVAi$ te ajuda a evitar armadilhas: operar por impulso, ignorar volume, entrar sem plano. A IA mantém você disciplinado.',
      'Para o perfil aventureiro, a plataforma oferece evolução com técnica: checklist, controle de risco e consistência — sem virar aposta. Quer conhecer?',
    ],
    actions: [{ type: 'navigateRoute', route: '/analise-tempo-real', targetId: 'analise-hero' }],
  },
  {
    id: 'perfil_analista',
    title: 'O que é Investidor Analista',
    keywords: ['analista', 'investidor analista', 'avançado', 'pro'],
    responses: [
      'O perfil Analista é para quem quer decisão baseada em dados: confluência de sinais, leitura de liquidez, indicadores e gestão de risco. A plataforma organiza tudo isso pra você.',
      'No modo analista, a plataforma te dá dados para validar hipótese: não é "achismo", é processo. A IA organiza as evidências e os riscos pra você decidir melhor.',
      'Para analistas, o DVAi$ oferece método completo: contexto → gatilho → risco → execução → revisão. Tudo guiado pela IA. Quer ver a página de análise?',
    ],
    actions: [{ type: 'navigateRoute', route: '/analise-tempo-real', targetId: 'analise-hero' }],
  },
  {
    id: 'precos',
    title: 'Planos e valores',
    keywords: [
      { term: 'quanto custa', weight: 7 },
      { term: 'quanto custa usar', weight: 7 },
      { term: 'preço', weight: 5 },
      { term: 'valor', weight: 3 },
      { term: 'plano', weight: 3 },
      { term: 'planos', weight: 3 },
      { term: 'assinatura', weight: 4 },
      { term: 'custo', weight: 4 },
      { term: 'tarifa', weight: 3 },
      { term: 'quanto é', weight: 5 },
      { term: 'quanto pago', weight: 6 },
      { term: 'quanto sai', weight: 5 },
      { term: 'valores', weight: 3 },
      { term: 'quanto é o plano', weight: 6 },
      { term: 'é grátis', weight: 7 },
      { term: 'é gratuito', weight: 7 },
      { term: 'grátis', weight: 5 },
      { term: 'gratuito', weight: 5 },
      { term: 'de graça', weight: 5 },
      { term: 'pago', weight: 3 },
      { term: 'custa', weight: 4 },
    ],
    responses: [
      'O cadastro no DVAi$ é gratuito e sem cartão de crédito. Os detalhes dos planos e valores ficam disponíveis depois que você entra na plataforma. Quer experimentar o cadastro?',
      'Pode ficar tranquilo: o cadastro é gratuito. Depois de criar sua conta, você vê os planos disponíveis e o que cada um inclui. Quer que eu te leve até o cadastro?',
      'O DVAi$ oferece cadastro gratuito pra você conhecer a plataforma. Os valores dos planos aparecem dentro da área logada. Se quiser, eu te guio até o cadastro agora.',
    ],
    actions: [{ type: 'navigateRoute', route: '/' }],
    ctas: [
      { label: 'Começar agora', route: '/cadastro' },
      { label: 'Login', route: '/login' },
    ],
  },
  {
    id: 'garantia_lucro',
    title: 'Quando o usuário pedir garantia de lucro',
    keywords: [
      { term: 'lucro garantido', weight: 7 },
      { term: 'garantia de lucro', weight: 7 },
      { term: 'vou ganhar dinheiro', weight: 6 },
      { term: 'ganhar dinheiro', weight: 5 },
      { term: 'vou lucrar', weight: 5 },
      { term: 'garantia', weight: 3 },
      { term: '100%', weight: 3 },
      { term: 'sem risco', weight: 5 },
      { term: 'certeza', weight: 2 },
      { term: 'risco zero', weight: 6 },
      { term: 'dinheiro garantido', weight: 6 },
      { term: 'retorno garantido', weight: 6 },
      { term: 'promete lucro', weight: 5 },
    ],
    responses: [
      'Ninguém sério promete lucro garantido — investimento envolve risco. O que o DVAi$ garante é método: análise, leitura técnica e orientação para você decidir melhor e com mais segurança.',
      'Desconfie de quem promete lucro garantido. A proposta do DVAi$ é ser sério: te ensinar a interpretar dados e reduzir erros com um processo técnico. Isso é o que realmente funciona.',
      'Lucro não é garantia; técnica é. A plataforma vai te ajudar a analisar, controlar risco e agir com disciplina — isso aumenta suas chances, sem prometer milagre.',
    ],
  },
  {
    id: 'suporte',
    title: 'Suporte e contato',
    keywords: ['suporte', 'ajuda', 'whatsapp', 'contato', 'atendimento'],
    responses: [
      'O DVAi$ vai oferecer suporte via WhatsApp com IA: você envia texto, áudio ou até foto de nota fiscal e recebe orientação personalizada. Se tiver alguma dúvida agora, posso te ajudar aqui mesmo.',
      'O suporte da plataforma será via WhatsApp com IA — responde rápido por texto, áudio ou foto. Aqui no site, eu posso te explicar qualquer parte da plataforma. O que quer saber?',
      'A plataforma vai ter atendimento via WhatsApp com IA para agilizar tudo. Mas agora, eu posso te apresentar qualquer funcionalidade do DVAi$. Sobre o que quer saber?',
    ],
  },
  {
    id: 'guia_financeiro',
    title: 'Guia Financeiro e relatório de despesas',
    keywords: [
      { term: 'guia financeiro', weight: 8 },
      { term: 'relatório de despesas', weight: 7 },
      { term: 'despesas', weight: 4 },
      { term: 'relatório', weight: 3 },
      { term: 'salário', weight: 3 },
      { term: 'gastos', weight: 4 },
      { term: 'extrato', weight: 3 },
      { term: 'quanto posso investir', weight: 5 },
      { term: 'organizar finanças', weight: 5 },
      { term: 'relatório mensal', weight: 5 },
    ],
    responses: [
      'O Guia Financeiro é um add-on opcional do DVAi$: você informa suas receitas e despesas (por texto, áudio, foto de nota ou PDF via WhatsApp) e a plataforma monta um relatório mensal pra você saber quanto pode investir com segurança.',
      'A ideia do Guia Financeiro é simples: antes de investir, você entende sua saúde financeira. A plataforma organiza entradas, saídas e objetivos — pra você não se expor além do que pode.',
      'O Guia Financeiro vai organizar sua realidade financeira: você envia seus dados pelo WhatsApp e recebe um relatório mensal de despesas com orientação sobre quanto alocar. É um add-on que faz toda a diferença.',
    ],
    actions: [{ type: 'navigateRoute', route: '/seguranca', targetId: 'seguranca-hero' }],
  },
  // Entrada legada mantida para compatibilidade (keywords já consolidadas em 'elevator_pitch')
  {
    id: 'cadastro',
    title: 'Cadastro',
    keywords: [
      { term: 'cadastro', weight: 6 },
      { term: 'fazer cadastro', weight: 7 },
      { term: 'quero cadastrar', weight: 7 },
      { term: 'quero me cadastrar', weight: 8 },
      { term: 'como funciona o cadastro', weight: 6 },
      { term: 'criar conta', weight: 6 },
      { term: 'registrar', weight: 5 },
      { term: 'sign up', weight: 3 },
      { term: 'inscrever', weight: 3 },
      { term: 'começar agora', weight: 4 },
    ],
    responses: [
      'O cadastro aqui é uma demonstração do fluxo real: você pode testar o formulário com validação de CPF, senha forte e telefone internacional. Clique em "Começar Agora" pra ver como vai funcionar.',
      'Quer experimentar? O formulário de cadastro demonstra a experiência real da plataforma: validação forte, UX responsiva e campos inteligentes. Nenhum dado é salvo nesta versão pública.',
      'O cadastro é uma demo interativa: preencha os campos e veja como a plataforma valida CPF, senha e telefone. Nada é gravado — é só pra você conhecer a experiência que o DVAi$ vai oferecer.',
    ],
    actions: [{ type: 'navigateRoute', route: '/cadastro', targetId: 'cadastro-card' }],
  },
  {
    id: 'login',
    title: 'Login',
    keywords: [
      { term: 'login', weight: 6 },
      { term: 'fazer login', weight: 7 },
      { term: 'como funciona o login', weight: 7 },
      { term: 'quero fazer login', weight: 7 },
      { term: 'acessar conta', weight: 6 },
      { term: 'entrar na conta', weight: 6 },
      { term: 'logar', weight: 5 },
      { term: 'minha conta', weight: 3 },
      { term: 'entrar', weight: 2 },
    ],
    responses: [
      'A tela de login é uma demonstração da interface: você pode testar o fluxo de validação. Nesta versão pública não existe backend conectado — é pra você ver como a experiência vai funcionar.',
      'O login aqui é uma demo de UX: testa as validações e a interface. Na plataforma real, é por aqui que você vai acessar suas análises, alertas e trilha de aprendizado.',
      'Quer ver como funciona? A tela de login demonstra a experiência da plataforma: validação, feedback visual e fluxo limpo. Nenhum dado é gravado nesta versão.',
    ],
    actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
  },
  {
    id: 'saudacao',
    title: 'Saudação',
    keywords: [
      { term: 'oi', weight: 8 },
      { term: 'olá', weight: 8 },
      { term: 'ola', weight: 8 },
      { term: 'bom dia', weight: 7 },
      { term: 'boa tarde', weight: 7 },
      { term: 'boa noite', weight: 7 },
      { term: 'e aí', weight: 5 },
      { term: 'eai', weight: 5 },
      { term: 'eae', weight: 5 },
      { term: 'e aê', weight: 5 },
      { term: 'hey', weight: 5 },
      { term: 'opa', weight: 5 },
      { term: 'salve', weight: 5 },
      { term: 'fala', weight: 4 },
      { term: 'beleza', weight: 3 },
      { term: 'suave', weight: 3 },
      { term: 'tranquilo', weight: 3 },
    ],
    responses: [
      'Oi! Sou o Davi, assistente do DVAi$. Tô aqui pra te apresentar a plataforma e tirar suas dúvidas. Quer saber o que o DVAi$ faz, ver as funcionalidades ou fazer um tour rápido?',
      'Olá! Eu sou o assistente do DVAi$ e posso te explicar tudo sobre a plataforma. Quer conhecer as funcionalidades, entender como funciona ou ir direto pro cadastro?',
      'E aí! Sou o Davi. Posso te mostrar o que o DVAi$ vai oferecer: análise guiada, proteção inteligente e trilha de aprendizado. Por onde quer começar?',
      'Oi! Sou o Davi, tô aqui pra te apresentar o DVAi$ — uma plataforma de mentoria em investimentos com IA. Me pergunta o que quiser, por texto ou por voz!',
    ],
  },
  {
    id: 'o_que_nao_fazemos',
    title: 'O que não fazemos',
    keywords: [
      { term: 'o que não faz', weight: 5 },
      { term: 'o que vocês não fazem', weight: 5 },
      { term: 'não faz', weight: 3 },
      { term: 'limitações', weight: 3 },
      { term: 'o que não oferecem', weight: 4 },
    ],
    responses: [
      'O DVAi$ não é corretora, não guarda seus ativos e nunca pede senha. A plataforma vai ser um mentor: ensina análise técnica, leitura de mercado e decisões com método.',
      'A plataforma não faz custódia, não pede credenciais e não promete lucro. O papel do DVAi$ é te dar conhecimento e ferramentas para investir melhor por conta própria.',
      'O DVAi$ é mentor, não corretora. Não guarda dinheiro, não pede senhas e não promete retorno. A plataforma vai te ensinar a analisar, decidir e se proteger.',
    ],
  },
  {
    id: 'sobre_ia',
    title: 'Sobre a IA',
    keywords: [
      { term: 'quem é você', weight: 5 },
      { term: 'você é um robô', weight: 4 },
      { term: 'você é ia', weight: 4 },
      { term: 'o que você é', weight: 3 },
      { term: 'você é inteligência artificial', weight: 4 },
      { term: 'você é bot', weight: 3 },
    ],
    responses: [
      'Sou o Davi, o assistente deste site. Meu papel é te apresentar o DVAi$ — te explicar o que a plataforma vai oferecer e te ajudar a decidir se faz sentido pra você. Pode perguntar o que quiser!',
      'Sou uma IA que apresenta o DVAi$. Posso te explicar cada funcionalidade da plataforma, tirar dúvidas e te mostrar como ela vai funcionar. Quer saber sobre alguma área específica?',
      'Me chamo Davi e sou o assistente do site DVAi$. Tô aqui pra te mostrar o que a plataforma de mentoria em investimentos vai oferecer e responder qualquer dúvida.',
    ],
  },
  {
    id: 'horario_atendimento',
    title: 'Horário de atendimento',
    keywords: [
      { term: 'que horas funciona', weight: 5 },
      { term: 'atendimento 24h', weight: 4 },
      { term: 'horário', weight: 3 },
      { term: 'funciona quando', weight: 3 },
      { term: 'disponível quando', weight: 3 },
      { term: 'funciona 24 horas', weight: 4 },
    ],
    responses: [
      'A plataforma DVAi$ vai estar disponível 24 horas por dia, 7 dias por semana. Aqui no site, eu tô disponível agora pra te apresentar tudo. Quer saber sobre alguma funcionalidade?',
      'O DVAi$ vai funcionar 24/7. E eu tô aqui agora pra te mostrar tudo que a plataforma vai oferecer. Sobre o que quer saber?',
      'A plataforma vai estar disponível o tempo todo. Aqui neste site, eu posso te apresentar todas as funcionalidades agora mesmo. O que te interessa?',
    ],
  },
  {
    id: 'resultados',
    title: 'Resultados e métricas',
    keywords: [
      { term: 'resultados', weight: 4 },
      { term: 'métricas', weight: 3 },
      { term: 'estatísticas', weight: 3 },
      { term: 'números', weight: 2 },
      { term: 'desempenho', weight: 3 },
    ],
    responses: [
      'A plataforma DVAi$ foi construída com engenharia sólida: Next.js, mais de 90 testes automatizados e deploy contínuo. Isso garante que a ferramenta seja estável e confiável pra te orientar nos investimentos.',
      'O DVAi$ é uma plataforma robusta: disponível 24/7, com testes automatizados e tecnologia de ponta. Tudo pra garantir que a orientação que você recebe seja consistente e confiável.',
      'A qualidade da plataforma se reflete nos números: testes automatizados, deploy estável e operação contínua. Quer conhecer as funcionalidades na prática?',
    ],
    actions: [{ type: 'scrollToSection', targetId: 'stats-section' }],
  },
  {
    id: 'como_funciona_metodo',
    title: 'Como funciona o método DVAi$',
    keywords: [
      { term: 'como funciona o método', weight: 6 },
      { term: 'método dvais', weight: 6 },
      { term: 'como invisto aqui', weight: 5 },
      { term: 'como começo a investir', weight: 5 },
      { term: 'por onde começar', weight: 4 },
      { term: 'passo a passo investir', weight: 4 },
      { term: 'como operar', weight: 3 },
      { term: 'etapas', weight: 2 },
    ],
    responses: [
      'O método do DVAi$ é simples: primeiro você aprende os conceitos com a IA, depois pratica a leitura de mercado com orientação guiada, e só age quando entende o que está fazendo. Nada de "achismo".',
      'A plataforma funciona em 3 etapas: aprender (a IA ensina os conceitos), analisar (a IA guia sua leitura dos dados) e decidir (você age com método, não por impulso). Quer conhecer melhor?',
      'O caminho no DVAi$ é: entender → analisar → agir. A IA acompanha cada etapa — explica termos, mostra indicadores e te ajuda a montar uma leitura antes de qualquer decisão.',
    ],
    actions: [{ type: 'navigateRoute', route: '/aprendizado-continuo' }],
    ctas: [
      { label: 'Começar agora', route: '/cadastro' },
    ],
  },
  {
    id: 'o_que_posso_fazer',
    title: 'O que posso fazer aqui',
    keywords: [
      { term: 'o que posso fazer aqui', weight: 6 },
      { term: 'o que da pra fazer aqui', weight: 6 },
      { term: 'o que tem aqui', weight: 4 },
      { term: 'funcionalidades', weight: 4 },
      { term: 'recursos da plataforma', weight: 4 },
      { term: 'o que a plataforma oferece', weight: 5 },
      { term: 'o que voces oferecem', weight: 4 },
    ],
    responses: [
      'A plataforma DVAi$ vai oferecer: análise de mercado guiada com IA, trilha de aprendizado do iniciante ao analista, proteção inteligente contra decisões ruins e suporte por voz e texto. Quer que eu explique alguma dessas áreas?',
      'O DVAi$ vai ter: mentor com IA que explica indicadores na prática, alertas de risco, trilha de evolução personalizada e Guia Financeiro para organizar suas finanças. Posso detalhar qualquer uma.',
      'Na plataforma você vai ter: análise guiada de mercado, proteção em camadas, aprendizado progressivo e suporte via WhatsApp com IA. Tudo pra investir com mais segurança e método. Quer saber mais sobre alguma?',
    ],
    actions: [{ type: 'navigateRoute', route: '/' }],
  },
  {
    id: 'assistente_voz',
    title: 'Como usar o assistente por voz',
    keywords: [
      { term: 'como usar a voz', weight: 8 },
      { term: 'como usar voz', weight: 8 },
      { term: 'como falar com voce', weight: 7 },
      { term: 'falar com davi', weight: 7 },
      { term: 'assistente de voz', weight: 7 },
      { term: 'por voz', weight: 6 },
      { term: 'voz', weight: 5 },
      { term: 'falar', weight: 4 },
      { term: 'microfone', weight: 5 },
      { term: 'comando de voz', weight: 5 },
      { term: 'reconhecimento de voz', weight: 4 },
      { term: 'usar a voz', weight: 6 },
      { term: 'conversa por voz', weight: 7 },
      { term: 'falar por voz', weight: 6 },
    ],
    responses: [
      'Para conversar por voz: clique em "Falar com Davi" e depois em "Conversa por voz". O microfone abre e você fala naturalmente — eu respondo por voz e texto, e o microfone reabre sozinho para a próxima pergunta. É uma conversa contínua, sem precisar clicar de novo. Na plataforma real, a IA do DVAi$ vai funcionar da mesma forma.',
      'Quer testar a voz? Abra o chat e toque em "Conversa por voz". Fale sua pergunta, eu respondo, e o microfone volta a ouvir automaticamente. Para parar, é só tocar de novo. Essa é uma demonstração de como o DVAi$ vai interagir com você.',
      'A conversa por voz funciona como um bate-papo natural: você ativa o microfone uma vez e pode ir perguntando — eu respondo e continuo ouvindo. Para encerrar a voz, toque em "Parar conversa por voz". Essa interação é uma amostra do que a plataforma completa vai oferecer.',
    ],
  },
  {
    id: 'alertas_inteligentes',
    title: 'Alertas Inteligentes',
    keywords: [
      { term: 'alertas inteligentes', weight: 8 },
      { term: 'como funcionam os alertas', weight: 8 },
      { term: 'alertas', weight: 5 },
      { term: 'alerta de risco', weight: 6 },
      { term: 'alerta de disciplina', weight: 6 },
      { term: 'aviso', weight: 2 },
      { term: 'notificação', weight: 3 },
      { term: 'me avisar', weight: 3 },
      { term: 'avisa quando', weight: 4 },
      { term: 'alerta', weight: 4 },
    ],
    responses: [
      'Os Alertas Inteligentes do DVAi$ vão te avisar quando o cenário ficar arriscado: volatilidade alta, liquidez mudando rápido, e decisões impulsivas. Cada alerta vem com contexto e um checklist pra você agir com método.',
      'A plataforma vai ter 2 tipos de alerta: de risco (quando o mercado muda rápido) e de disciplina (quando você está agindo por impulso). Tudo com checklist e próximo passo sugerido — sem promessas de retorno.',
      'Alertas Inteligentes são uma camada de proteção: reduzem erro operacional e te ajudam a manter consistência. A plataforma avisa, sugere e você decide. Quer ver mais sobre segurança?',
    ],
    actions: [{ type: 'navigateRoute', route: '/seguranca', targetId: 'seguranca-hero' }],
  },
  {
    id: 'ia_personalizada',
    title: 'A IA se adapta a você',
    keywords: [
      { term: 'se adapta ao meu perfil', weight: 9 },
      { term: 'plataforma se adapta', weight: 8 },
      { term: 'se adapta', weight: 6 },
      { term: 'adapta ao perfil', weight: 7 },
      { term: 'personalização', weight: 5 },
      { term: 'personalizada', weight: 5 },
      { term: 'aprende comigo', weight: 6 },
      { term: 'aprende com você', weight: 6 },
      { term: 'ia aprende', weight: 5 },
      { term: 'personalizar', weight: 4 },
      { term: 'meu perfil', weight: 4 },
      { term: 'meu nível', weight: 4 },
      { term: 'adapta', weight: 3 },
    ],
    responses: [
      'A IA do DVAi$ vai se adaptar ao seu perfil: se você é iniciante, ela simplifica; se é avançado, ela aprofunda. A plataforma aprende com o seu uso para personalizar a orientação.',
      'A plataforma vai aprender com você: suas preferências, objetivos e nível de experiência ajustam as explicações, alertas e prioridades. Tudo com seu consentimento e controle.',
      'Personalização é um diferencial do DVAi$: a IA ajusta a profundidade das explicações, os alertas e os exemplos conforme você evolui. Se sinalizar pressa ou incerteza, ela sugere pausar. Quer saber mais?',
    ],
    actions: [{ type: 'navigateRoute', route: '/aprendizado-continuo', targetId: 'aprendizado-hero' }],
  },
  {
    id: 'nao_e_consultoria',
    title: 'Não é consultoria financeira regulada',
    keywords: [
      { term: 'consultoria', weight: 5 },
      { term: 'regulamentado', weight: 4 },
      { term: 'regulado', weight: 4 },
      { term: 'conselheiro financeiro', weight: 4 },
      { term: 'recomendação de investimento', weight: 4 },
      { term: 'é confiável', weight: 3 },
      { term: 'posso confiar', weight: 3 },
    ],
    responses: [
      'O DVAi$ não é consultoria financeira regulada — é uma ferramenta educacional e automatizada. A plataforma te orienta com base em boas práticas e análise técnica, mas a decisão final é sempre sua.',
      'Importante: a plataforma é educacional, não é conselheiro financeiro regulado. O DVAi$ te ensina a analisar e decidir, mas não dá recomendação de compra ou venda. Você opera na sua corretora.',
      'O DVAi$ é um mentor educacional, não uma consultoria regulada. A plataforma ensina método, análise e disciplina — sem promessas de retorno. Sua decisão, sua responsabilidade, nosso apoio.',
    ],
  },
  {
    id: 'porque_cadastrar',
    title: 'Por que se cadastrar',
    keywords: [
      { term: 'por que cadastrar', weight: 7 },
      { term: 'por que me cadastrar', weight: 7 },
      { term: 'por que deveria me cadastrar', weight: 8 },
      { term: 'por que eu deveria', weight: 6 },
      { term: 'vale a pena', weight: 5 },
      { term: 'vale a pena cadastrar', weight: 7 },
      { term: 'por que usar', weight: 4 },
      { term: 'qual a vantagem', weight: 5 },
      { term: 'quais as vantagens', weight: 5 },
      { term: 'pra que serve', weight: 3 },
      { term: 'por que assinar', weight: 5 },
      { term: 'benefícios', weight: 4 },
      { term: 'vantagens', weight: 4 },
      { term: 'me convence', weight: 4 },
      { term: 'me convença', weight: 4 },
      { term: 'por que deveria', weight: 5 },
    ],
    responses: [
      'Com o DVAi$ você vai ter um mentor de IA que te acompanha: ensina a analisar o mercado, te protege de decisões ruins e evolui com você. Tudo sem custódia e sem pedir senhas. Quer experimentar o cadastro?',
      'A vantagem do DVAi$ é clara: em vez de investir no escuro, você vai ter orientação guiada, alertas inteligentes e uma trilha de aprendizado personalizada. Se cadastrar é o primeiro passo.',
      'O DVAi$ vai transformar como você investe: análise guiada por IA, proteção em camadas, trilha do iniciante ao analista e suporte via WhatsApp. Quer ver como funciona? Começa pelo cadastro!',
    ],
    actions: [{ type: 'navigateRoute', route: '/cadastro', targetId: 'cadastro-card' }],
    ctas: [
      { label: 'Começar agora', route: '/cadastro' },
    ],
  },
  {
    id: 'seguranca_dados',
    title: 'Segurança dos seus dados',
    keywords: [
      { term: 'meus dados estão seguros', weight: 8 },
      { term: 'meus dados', weight: 5 },
      { term: 'dados seguros', weight: 7 },
      { term: 'proteção de dados', weight: 7 },
      { term: 'dados pessoais', weight: 5 },
      { term: 'privacidade', weight: 4 },
      { term: 'dados protegidos', weight: 6 },
      { term: 'lgpd', weight: 5 },
      { term: 'vazamento', weight: 4 },
      { term: 'dados estão seguros', weight: 7 },
    ],
    responses: [
      'Seus dados estão protegidos: a plataforma usa HTTPS/TLS, não pede credenciais de corretora e não faz custódia. Na versão pública, nenhum dado de cadastro é gravado. A segurança é prioridade.',
      'O DVAi$ leva segurança a sério: minimização de dados (usamos só o necessário), conexão criptografada e sem acesso a contas de corretora. A plataforma nunca pede senhas de terceiros.',
      'Pode ficar tranquilo: seus dados são protegidos com criptografia, não pedimos senhas de corretora e não guardamos ativos. A plataforma é educacional e transparente com o que coleta.',
    ],
    actions: [{ type: 'navigateRoute', route: '/seguranca', targetId: 'seguranca-hero' }],
  },
  {
    id: 'para_quem_serve',
    title: 'Para quem serve a plataforma',
    keywords: [
      { term: 'para quem serve', weight: 7 },
      { term: 'pra quem é', weight: 6 },
      { term: 'quem pode usar', weight: 6 },
      { term: 'é pra mim', weight: 5 },
      { term: 'serve pra mim', weight: 5 },
      { term: 'público alvo', weight: 4 },
      { term: 'quem usa', weight: 4 },
      { term: 'para quem é', weight: 6 },
      { term: 'indicado para', weight: 3 },
    ],
    responses: [
      'O DVAi$ serve tanto pra quem está começando quanto pra quem já investe. Iniciantes aprendem o básico com guia da IA; investidores experientes usam análise guiada e alertas inteligentes pra operar com mais disciplina.',
      'A plataforma é pra qualquer pessoa que quer investir com mais segurança e método: do iniciante que nunca operou ao analista que quer organizar sua rotina. A IA se adapta ao seu nível.',
      'O DVAi$ foi pensado pra 3 perfis: Iniciante (aprende o básico), Aventureiro (pratica com método) e Analista (opera com dados e disciplina). A plataforma acompanha sua evolução. Qual é o seu perfil?',
    ],
    actions: [{ type: 'navigateRoute', route: '/aprendizado-continuo', targetId: 'aprendizado-hero' }],
  },
  {
    id: 'como_funciona_plataforma',
    title: 'Como funciona a plataforma (genérico)',
    keywords: [
      { term: 'como funciona a plataforma', weight: 8 },
      { term: 'como é que funciona a plataforma', weight: 7 },
      { term: 'como isso funciona', weight: 5 },
      { term: 'me explica como funciona', weight: 6 },
      { term: 'o que a plataforma faz', weight: 6 },
    ],
    responses: [
      'O DVAi$ funciona em 3 pilares: análise guiada (a IA te ensina a ler o mercado), proteção inteligente (alertas e checklists contra decisões ruins) e aprendizado contínuo (trilha personalizada do básico ao avançado). Tudo por voz ou texto. Quer explorar alguma dessas áreas?',
      'A plataforma tem 3 áreas principais: na análise, a IA explica indicadores e dados do mercado; na proteção, te avisa sobre riscos e mantém disciplina; no aprendizado, você evolui do iniciante ao analista. Posso te mostrar cada uma.',
      'Funciona assim: você se cadastra, escolhe seu perfil e começa a receber orientação guiada pela IA. Ela explica o mercado, te protege de erros e te ensina a investir com método. Quer ver na prática?',
    ],
    actions: [{ type: 'navigateRoute', route: '/' }],
    ctas: [
      { label: 'Começar agora', route: '/cadastro' },
    ],
  },
]

// Sinônimos para expansão de keywords
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  // Sinônimos existentes
  análise: ['analise', 'analisar', 'análises', 'analises', 'analisando'],
  'tempo real': ['tempo-real', 'tempo real', 'real-time', 'realtime', 'em tempo real'],
  proteção: ['protecao', 'segurança', 'seguranca', 'seguro', 'proteger'],
  inteligente: ['inteligente', 'smart', 'automático', 'automatico'],
  aprendizado: ['aprendizado', 'aprender', 'aprendizagem', 'educação', 'educacao'],
  contínuo: ['continuo', 'contínuo', 'continuo', 'permanente'],
  cadastro: ['cadastro', 'registrar', 'registro', 'conta', 'inscrever'],
  preço: ['preco', 'valor', 'custo', 'quanto', 'tarifa'],
  iniciante: ['iniciante', 'começando', 'comecando', 'novato', 'principiante'],
  aventureiro: ['aventureiro', 'intermediário', 'intermediario'],
  analista: ['analista', 'avançado', 'avancado', 'profissional', 'pro'],
  
  // Sinônimos adicionados para melhor matching
  'o que é': ['o que e', 'oque é', 'oque e', 'oq é', 'oq e', 'o que sao', 'o que sao', 'que e'],
  'como funciona': ['como q funciona', 'como que funciona', 'como é que funciona', 'como funciona isso', 'como funciona a plataforma'],
  quero: ['quero', 'queria', 'gostaria', 'preciso', 'preciso de', 'estou procurando', 'busco'],
  'me explica': ['me explica', 'explica', 'explique', 'fala sobre', 'fale sobre', 'me fale', 'conta sobre', 'conte sobre'],
  ajuda: ['ajuda', 'ajude', 'socorro', 'help', 'preciso de ajuda', 'estou com duvida'],
  entrar: ['entrar', 'logar', 'login', 'acessar minha conta', 'fazer login', 'acessar conta'],
  sair: ['sair', 'logout', 'deslogar', 'fazer logout', 'encerrar sessao'],
  dúvida: ['duvida', 'dúvida', 'pergunta', 'questão', 'questao', 'duvidas', 'dúvidas'],
  investir: ['investir', 'investimento', 'aplicar', 'aplicação', 'aportar', 'aplicar dinheiro', 'fazer investimento'],
  dinheiro: ['dinheiro', 'grana', 'capital', 'valor', 'reais', 'rs', 'r$'],
  corretora: ['corretora', 'exchange', 'broker', 'plataforma de trading', 'plataforma', 'exchange de cripto'],
  
  // Sinônimos coloquiais expandidos
  ok: ['ok', 'beleza', 'suave', 'tranquilo', 'de boa', 'tá ligado', 'blz', 'tudo bem', 'td bem', 'combinado', 'pode ser', 'claro', 'beleza', 'show', 'top'],
  sim: ['sim', 'claro', 'pode ser', 'beleza', 'suave', 'tranquilo', 'de boa', 'blz', 'tudo bem', 'td bem', 'combinado'],
  não: ['não', 'nao', 'nope', 'nem', 'deixa pra lá', 'não quero', 'não preciso'],
  obrigado: ['obrigado', 'obrigada', 'valeu', 'vlw', 'valeu mesmo', 'agradeço', 'brigado', 'brigada'],
  tchau: ['tchau', 'até mais', 'até', 'falou', 'flw', 'até logo', 'até breve', 'valeu', 'vlw'],
  oi: ['oi', 'olá', 'ola', 'e aí', 'eai', 'hey', 'opa', 'salve', 'fala', 'eae', 'e aê'],
  bom: ['bom', 'legal', 'show', 'top', 'massa', 'daora', 'da hora', 'incrível', 'fantástico', 'ótimo', 'excelente'],
  ruim: ['ruim', 'péssimo', 'horrível', 'não gostei', 'não curti', 'não serve', 'não funciona'],
  entender: ['entender', 'entendi', 'entendeu', 'compreender', 'compreendi', 'captei', 'peguei', 'sacou', 'sacou a ideia'],
  saber: ['saber', 'sei', 'sabe', 'conhecer', 'conheço', 'conhece', 'entender sobre', 'saber sobre'],
  fazer: ['fazer', 'faz', 'fazer isso', 'realizar', 'executar', 'aplicar', 'usar', 'utilizar'],
  ver: ['ver', 'vejo', 'vê', 'visualizar', 'olhar', 'dar uma olhada', 'checar', 'verificar', 'conferir'],
  mostrar: ['mostrar', 'mostra', 'mostre', 'exibir', 'apresentar', 'demonstrar', 'ensinar'],
  ajudar: ['ajudar', 'ajuda', 'ajude', 'auxiliar', 'dar uma força', 'dar uma mão', 'socorrer', 'suportar'],
}

// Extrair termo e peso de uma keyword (suporta string ou objeto)
function extractKeywordTerm(keyword: KeywordWithWeight): { term: string; weight: number } {
  if (typeof keyword === 'string') {
    return { term: keyword, weight: 1 } // Peso padrão: 1
  }
  return { term: keyword.term, weight: keyword.weight }
}

// Expandir keywords com sinônimos (retorna array de { term, weight })
function expandKeywords(keywords: KeywordWithWeight[]): Array<{ term: string; weight: number }> {
  const expanded = new Map<string, number>() // term -> max weight

  for (const keyword of keywords) {
    const { term, weight } = extractKeywordTerm(keyword)
    const normalized = term.toLowerCase().trim()
    
    // Adicionar termo original (usar peso máximo se já existir)
    expanded.set(normalized, Math.max(expanded.get(normalized) || 0, weight))

    // Adicionar sinônimos (com peso reduzido: 70% do original)
    for (const [base, synonyms] of Object.entries(KEYWORD_SYNONYMS)) {
      if (normalized.includes(base)) {
        const synonymWeight = Math.max(1, Math.floor(weight * 0.7))
        synonyms.forEach(syn => {
          const synNormalized = syn.toLowerCase().trim()
          expanded.set(synNormalized, Math.max(expanded.get(synNormalized) || 0, synonymWeight))
        })
      }
    }
  }

  return Array.from(expanded.entries()).map(([term, weight]) => ({ term, weight }))
}

// Normalização robusta para matching flexível
function normalizeQuestion(question: string): string {
  return (
    question
      .toLowerCase()
      .trim()
      // Remover pontuação e caracteres especiais (exceto espaços)
      .replace(/[.,!?;:()\[\]{}'"`~@#$%^&*+=|\\<>\/]/g, ' ')
      // Normalizar variações comuns
      .replace(/\$/g, 's') // DVAi$ -> dvais
      .replace(/ç/g, 'c') // análise -> analise
      .replace(/ã/g, 'a') // não -> nao
      .replace(/õ/g, 'o') // então -> entao
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      // Normalizar espaços múltiplos
      .replace(/\s+/g, ' ')
      .trim()
  )
}

// Gerar n-grams de forma robusta (1-gram, 2-gram, 3-gram, 4-gram)
// CRÍTICO: Deve estar antes de buildKeywordIndex() que a usa
function generateNGrams(text: string, n: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const ngrams: string[] = []
  
  if (words.length < n) return []
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '))
  }
  
  return ngrams
}

// Distância de Levenshtein para fuzzy matching (trata erros de digitação)
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  // Inicializar primeira linha e coluna
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  // Preencher matriz
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substituição
          matrix[i][j - 1] + 1,       // Inserção
          matrix[i - 1][j] + 1       // Deleção
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

// Fuzzy match com threshold configurável
// Retorna true se a distância de Levenshtein for <= threshold
function fuzzyMatch(query: string, keyword: string, threshold: number = 2): boolean {
  // Para palavras muito curtas, usar match exato
  if (keyword.length < 4) return query === keyword
  
  // Calcular distância de Levenshtein
  const distance = levenshteinDistance(query, keyword)
  
  // Considerar match se distância <= threshold
  return distance <= threshold
}

// Índice invertido para busca rápida
// Armazena: term -> Map<entryId, maxWeight>
const keywordIndex = new Map<string, Map<string, number>>()

// Helper para adicionar ao índice com peso
function addToIndex(term: string, entryId: string, weight: number) {
  if (!keywordIndex.has(term)) {
    keywordIndex.set(term, new Map())
  }
  const entryWeights = keywordIndex.get(term)!
  // Usar peso máximo se já existir
  entryWeights.set(entryId, Math.max(entryWeights.get(entryId) || 0, weight))
}

function buildKeywordIndex() {
  keywordIndex.clear()

  // Indexar ENTRIES com keywords expandidas e normalizadas (com pesos)
  for (const entry of ENTRIES) {
    const expandedKeywords = expandKeywords(entry.keywords)
    for (const { term, weight } of expandedKeywords) {
      // Normalizar keyword antes de indexar
      const normalized = normalizeQuestion(term)
      
      // Indexar palavra/frase completa (com peso)
      addToIndex(normalized, entry.id, weight)

      // Indexar também palavras individuais (para busca flexível)
      // CRÍTICO: Incluir TODAS as palavras, mesmo pequenas, para n-grams funcionarem
      // Peso reduzido para palavras individuais: 50% do original
      const words = normalized.split(/\s+/).filter(w => w.length > 0)
      for (const word of words) {
        const wordWeight = Math.max(1, Math.floor(weight * 0.5))
        addToIndex(word, entry.id, wordWeight)
      }

      // Indexar bigrams, trigrams e 4-grams (para frases como "o que é", "me explica o que")
      // Usar TODAS as palavras, não apenas as > 2 caracteres
      // Peso reduzido para n-grams: 80% do original
      for (let n = 2; n <= Math.min(4, words.length); n++) {
        const ngrams = generateNGrams(normalized, n)
        for (const ngram of ngrams) {
          const ngramWeight = Math.max(1, Math.floor(weight * 0.8))
          addToIndex(ngram, entry.id, ngramWeight)
        }
      }
    }
  }

  // Indexar FORBIDDEN_TOPICS (para busca rápida) - peso padrão: 1
  for (const topic of FORBIDDEN_TOPICS) {
    const normalized = normalizeQuestion(topic)
    addToIndex(normalized, '__forbidden__', 1)
    
    // Indexar também palavras individuais
    const words = normalized.split(/\s+/).filter(w => w.length > 0)
    for (const word of words) {
      addToIndex(word, '__forbidden__', 1)
    }
  }

  // Indexar GLOSSARY (para busca rápida) - peso padrão: 1
  for (const term of Object.keys(GLOSSARY)) {
    const normalized = normalizeQuestion(term)
    addToIndex(normalized, `__glossary_${term}__`, 1)
    
    // Indexar também palavras individuais
    const words = normalized.split(/\s+/).filter(w => w.length > 0)
    for (const word of words) {
      addToIndex(word, `__glossary_${term}__`, 1)
    }
  }
}

// Chamar na inicialização
buildKeywordIndex()

// Cache LRU para resultados KB (melhora performance e match rate)
const kbResultCache = new Map<string, { result: KBReplyRaw; timestamp: number }>()
const KB_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos
const MAX_KB_CACHE_SIZE = 200

// Obter resultado do cache KB
function getCachedKBResult(question: string): KBReplyRaw | null {
  const normalized = normalizeQuestion(question)
  const cached = kbResultCache.get(normalized)
  if (cached && Date.now() - cached.timestamp < KB_CACHE_TTL_MS) {
    return cached.result
  }
  return null
}

// Salvar resultado no cache KB (LRU)
function setCachedKBResult(question: string, result: KBReplyRaw) {
  const normalized = normalizeQuestion(question)
  
  // LRU cleanup se necessário
  if (kbResultCache.size >= MAX_KB_CACHE_SIZE) {
    const entries = Array.from(kbResultCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp) // Mais antigo primeiro
    // Remover 10% mais antigos
    const toRemove = Math.floor(MAX_KB_CACHE_SIZE * 0.1)
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      kbResultCache.delete(entries[i][0])
    }
  }
  
  kbResultCache.set(normalized, { result, timestamp: Date.now() })
}

// Limpar cache KB expirado (chamado periodicamente)
function cleanupKBResultCache() {
  const now = Date.now()
  for (const [key, entry] of kbResultCache.entries()) {
    if (now - entry.timestamp >= KB_CACHE_TTL_MS) {
      kbResultCache.delete(key)
    }
  }
}

// Limpar cache a cada 2 minutos (apenas em ambiente client-side)
// Em server-side, limpar durante operações normais (cleanup automático no setCachedKBResult)
if (typeof window !== 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(cleanupKBResultCache, 2 * 60 * 1000)
}

// Extrair palavras e frases (n-grams) para busca flexível
// CRÍTICO: Inclui palavras pequenas nos n-grams para capturar frases como "o que é", "me explica"
function extractSearchTerms(normalized: string): string[] {
  const terms = new Set<string>()
  const words = normalized.split(/\s+/).filter(w => w.length > 0)

  // Adicionar palavras individuais (incluindo palavras pequenas para n-grams)
  words.forEach(word => {
    terms.add(word) // Incluir TODAS as palavras, mesmo pequenas
  })

  // Gerar n-grams de 2 a 4 palavras para capturar frases compostas
  // Exemplo: "me explica o que vocês fazem" → ["me explica", "explica o", "o que", "que vocês", "vocês fazem"]
  //          → ["me explica o", "explica o que", "o que vocês", "que vocês fazem"]
  //          → ["me explica o que", "explica o que vocês", "o que vocês fazem"]
  for (let n = 2; n <= Math.min(4, words.length); n++) {
    const ngrams = generateNGrams(normalized, n)
    ngrams.forEach(ngram => terms.add(ngram))
  }

  // Adicionar a string completa (para matching exato de frases)
  if (normalized.length > 0) {
    terms.add(normalized)
  }

  return Array.from(terms)
}

type CandidateMeta = {
  score: number
  matchedTerms: Set<string>
}

const GENERIC_MATCH_TERMS = new Set([
  'o que e',
  'que e',
  'como funciona',
  'como usar',
  'funcionamento',
  'plataforma',
  'isso',
  'ajuda',
  'mostrar',
  'ver',
  'guia',
])

const PRODUCT_IDENTITY_TERMS = new Set([
  'dvais',
  'mentor',
  'davi',
  'plataforma',
])

const KB_FORCE_LLM_RE =
  /\b(base de conhecimento|kb|ia|llm|modelo|provider|roteamento|contexto|historico|como voces decidem|como decide|quando usar)\b/

const OPEN_PRODUCT_GUIDE_RE =
  /\b(produto|projeto|plataforma|site|pagina)\b/

const OPEN_EXPLANATION_RE =
  /\b(me explica|explica melhor|explica mais|me fale|conta mais)\b/

const PRACTICAL_DEMONSTRATIVE_RE =
  /\b(isso|nisso|na pratica|na prática|depois|proximo passo|próximo passo)\b/

const FAQ_ANCHOR_RE =
  /\b(cadastro|login|seguranca|segurança|protecao|proteção|aprendizado|analise|análise|preco|preço|plano|planos|resultado|resultados|dvais|davi|mentor)\b/

const SPECIFIC_FLOW_TERMS = new Set([
  'cadastro',
  'login',
  'seguranca',
  'protecao',
  'aprendizado',
  'analise',
  'preco',
  'planos',
  'resultado',
  'resultados',
])

function registerCandidateMatch(
  candidateMap: Map<string, CandidateMeta>,
  entryId: string,
  term: string,
  score: number
) {
  const current = candidateMap.get(entryId) ?? { score: 0, matchedTerms: new Set<string>() }
  current.score += score
  if (term) {
    current.matchedTerms.add(term)
  }
  candidateMap.set(entryId, current)
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(0.99, Number(value.toFixed(2))))
}

function computeKBConfidence(entryId: string, score: number, matchedTerms: string[], words: string[]): number {
  let confidence = 0.2 + score / 16
  const multiWordMatches = matchedTerms.filter(term => term.split(/\s+/).length >= 2)
  const specificMatches = matchedTerms.filter(term => !GENERIC_MATCH_TERMS.has(term))
  const hasIdentityMatch = matchedTerms.some(
    term => PRODUCT_IDENTITY_TERMS.has(term) || /dvais|mentor|davi/.test(term)
  )
  const hasSpecificFlowTerm = words.some(word => SPECIFIC_FLOW_TERMS.has(word))

  if (multiWordMatches.length > 0) confidence += 0.12
  if (specificMatches.length > 0) confidence += 0.1
  if (hasIdentityMatch) confidence += 0.08

  if (entryId === 'elevator_pitch' && !hasIdentityMatch) {
    confidence -= 0.28
  }

  if (entryId === 'elevator_pitch' && hasSpecificFlowTerm) {
    confidence -= 0.18
  }

  if (matchedTerms.length > 0 && matchedTerms.every(term => GENERIC_MATCH_TERMS.has(term))) {
    confidence -= 0.22
  }

  if (words.length >= 4 && specificMatches.length === 0) {
    confidence -= 0.08
  }

  return clampConfidence(confidence)
}

function buildKBReason(entryId: string, confidence: number, matchedTerms: string[]): string {
  if (matchedTerms.length === 0) {
    return `entry=${entryId}; fallback_score_only`
  }
  const basis = matchedTerms.slice(0, 3).join(', ')
  return `entry=${entryId}; confidence=${confidence}; matched=${basis}`
}

// Opção A: Retorna entryId e responses (client escolhe variação)
export function askFromKnowledgeBase(questionRaw: string, seed?: number): KBReplyRaw {
  const q = normalizeQuestion(questionRaw || '')

  if (KB_FORCE_LLM_RE.test(q)) {
    return null
  }

  if (OPEN_PRODUCT_GUIDE_RE.test(q) && OPEN_EXPLANATION_RE.test(q) && !/\bo que e\b/.test(q)) {
    return null
  }

  if (
    isPracticalOpenQuestion(q) &&
    PRACTICAL_DEMONSTRATIVE_RE.test(q) &&
    !FAQ_ANCHOR_RE.test(q)
  ) {
    return null
  }
  
  // Verificar cache primeiro (melhora performance e match rate)
  const cached = getCachedKBResult(q)
  if (cached) {
    return cached
  }
  
  const searchTerms = extractSearchTerms(q)
  const words = q.split(/\s+/).filter(w => w.length > 0)

  // Verificar FORBIDDEN_TOPICS primeiro (usando índice e normalização)
  for (const term of searchTerms) {
    const matches = keywordIndex.get(term)
    if (matches && matches.has('__forbidden__')) {
      // Verificar match completo (não apenas palavra)
      for (const bad of FORBIDDEN_TOPICS) {
        const normalizedBad = normalizeQuestion(bad)
        if (q.includes(normalizedBad) || normalizedBad.includes(q)) {
          const result: KBReplyRaw = {
            entryId: 'forbidden',
            responses: [
              'Consigo te ajudar com o DVAi$ e com as funções mostradas aqui no site. Me diga o que você quer entender: análise guiada, proteção inteligente ou aprendizado contínuo?',
            ],
            actions: [{ type: 'navigateRoute', route: '/' }],
            confidence: 0.98,
            score: 99,
            reason: 'forbidden_topic',
            matchedTerms: [normalizedBad],
          }
          setCachedKBResult(q, result)
          return result
        }
      }
    }
  }

  // Verificar GLOSSARY usando normalização melhorada
  for (const [term, answers] of Object.entries(GLOSSARY)) {
    const normalizedTerm = normalizeQuestion(term)
    // Verificar se a pergunta contém o termo ou vice-versa
    if (q.includes(normalizedTerm) || normalizedTerm.includes(q)) {
      const result: KBReplyRaw = {
        entryId: `glossary_${term}`,
        responses: answers,
        confidence: 0.92,
        score: 30,
        reason: `glossary_exact:${normalizedTerm}`,
        matchedTerms: [normalizedTerm],
      }
      setCachedKBResult(q, result)
      return result
    }
    // Verificar também por palavras individuais do termo
    const termWords = normalizedTerm.split(/\s+/)
    const hasAllWords = termWords.every(tw => tw.length <= 2 || words.includes(tw))
    if (hasAllWords && termWords.length > 0) {
      const result: KBReplyRaw = {
        entryId: `glossary_${term}`,
        responses: answers,
        confidence: 0.88,
        score: 24,
        reason: `glossary_words:${normalizedTerm}`,
        matchedTerms: termWords,
      }
      setCachedKBResult(q, result)
      return result
    }
  }

  // Buscar ENTRIES usando índice (busca flexível)
  const candidateMatches = new Map<string, CandidateMeta>()
  const candidateIds = new Map<string, number>() // compatibilidade para seleção final

  // 1. Busca por termos exatos no índice (palavras e frases)
  // CRÍTICO: Priorizar frases (n-grams maiores) sobre palavras individuais
  // Ordenar searchTerms por tamanho (maiores primeiro) para priorizar frases
  const sortedTerms = Array.from(searchTerms).sort((a, b) => {
    const aWords = a.split(/\s+/).length
    const bWords = b.split(/\s+/).length
    return bWords - aWords // Maior primeiro
  })

  for (const term of sortedTerms) {
    const matches = keywordIndex.get(term)
    if (matches) {
      for (const [entryId, weight] of matches.entries()) {
        if (!entryId.startsWith('__')) {
          // Score baseado no peso da keyword (não mais fixo)
          // Multiplicar peso por fator baseado no tamanho do termo (frases maiores = bonus)
          const termWordCount = term.split(/\s+/).length
          const sizeMultiplier = termWordCount >= 3 ? 1.5 : termWordCount === 2 ? 1.2 : 1.0
          const finalScore = Math.floor(weight * sizeMultiplier)
          candidateIds.set(entryId, (candidateIds.get(entryId) || 0) + finalScore)
          registerCandidateMatch(candidateMatches, entryId, term, finalScore)
        }
      }
    }
  }

  // 2. Busca por substring nas keywords (matching flexível)
  // Se não encontrou match exato, tentar substring matching
  if (candidateIds.size === 0) {
    for (const entry of ENTRIES) {
      const expandedKeywords = expandKeywords(entry.keywords)
      let matchScore = 0

      for (const { term, weight } of expandedKeywords) {
        const normalizedKeyword = normalizeQuestion(term)

        // Verificar se a pergunta contém a keyword ou vice-versa
        // Score baseado no peso da keyword
        if (q.includes(normalizedKeyword) || normalizedKeyword.includes(q)) {
          matchScore += Math.max(1, weight * 2)
        }

        // Verificar se palavras da keyword aparecem na pergunta
        const keywordWords = normalizedKeyword.split(/\s+/)
        for (const kw of keywordWords) {
          if (kw.length > 2 && words.includes(kw)) {
            matchScore += Math.max(1, weight) // Score baseado no peso
          }
        }
      }

      if (matchScore > 0) {
        candidateIds.set(entry.id, matchScore)
        registerCandidateMatch(candidateMatches, entry.id, 'substring_match', matchScore)
      }
    }
  }

  // 3. Busca fuzzy (fuzzy matching) - trata erros de digitação
  // Só executar se não encontrou matches exatos ou por substring
  if (candidateIds.size === 0) {
    const FUZZY_THRESHOLD = 2 // Máximo de 2 caracteres de diferença
    
    for (const entry of ENTRIES) {
      const expandedKeywords = expandKeywords(entry.keywords)
      let fuzzyScore = 0
      let bestMatchDistance = Infinity

      // Tentar fuzzy match com cada termo da pergunta
      for (const term of searchTerms) {
        // Ignorar termos muito pequenos para fuzzy matching
        if (term.length < 4) continue

        for (const { term: keywordTerm, weight } of expandedKeywords) {
          const normalizedKeyword = normalizeQuestion(keywordTerm)
          
          // Ignorar keywords muito pequenas
          if (normalizedKeyword.length < 4) continue

          // Fuzzy match: verificar se term e keyword são similares
          if (fuzzyMatch(term, normalizedKeyword, FUZZY_THRESHOLD)) {
            const distance = levenshteinDistance(term, normalizedKeyword)
            if (distance < bestMatchDistance) {
              bestMatchDistance = distance
            }
            // Score baseado no peso da keyword e distância
            // Score: weight * (3 - distance) para distância 0, 1, 2
            fuzzyScore += Math.max(1, Math.floor(weight * (3 - distance)))
          }
        }
      }

      // Também tentar fuzzy match com a pergunta completa
      for (const { term: keywordTerm, weight } of expandedKeywords) {
        const normalizedKeyword = normalizeQuestion(keywordTerm)
        if (normalizedKeyword.length >= 4 && q.length >= 4) {
          if (fuzzyMatch(q, normalizedKeyword, FUZZY_THRESHOLD + 1)) {
            const distance = levenshteinDistance(q, normalizedKeyword)
            // Score baseado no peso da keyword
            fuzzyScore += Math.max(2, Math.floor(weight * (4 - distance)))
          }
        }
      }

      if (fuzzyScore > 0) {
        candidateIds.set(entry.id, fuzzyScore)
        registerCandidateMatch(candidateMatches, entry.id, 'fuzzy_match', fuzzyScore)
      }
    }
  }

  // 3. Busca por palavras-chave importantes (boost para termos como "o que é", "como funciona")
  const importantPhrases = ['o que e', 'que e', 'como funciona', 'como usar', 'o que sao']
  const hasSpecificFlowTerm = words.some(word => SPECIFIC_FLOW_TERMS.has(word))
  for (const phrase of importantPhrases) {
    if (q.includes(phrase)) {
      // Boost para entries que têm essas frases nas keywords (usar peso da keyword)
      for (const entry of ENTRIES) {
        if (entry.id === 'elevator_pitch' && hasSpecificFlowTerm) {
          continue
        }
        const expandedKeywords = expandKeywords(entry.keywords)
        for (const { term, weight } of expandedKeywords) {
          const normalizedKeyword = normalizeQuestion(term)
          if (normalizedKeyword.includes(phrase) || phrase.includes(normalizedKeyword)) {
            // Boost baseado no peso da keyword (mínimo 5 para frases importantes)
            const boost = Math.max(5, weight * 2)
            candidateIds.set(entry.id, (candidateIds.get(entry.id) || 0) + boost)
            registerCandidateMatch(candidateMatches, entry.id, phrase, boost)
          }
        }
      }
    }
  }

  // Encontrar melhor match (maior score)
  let bestEntry: KBEntry | null = null
  let bestScore = 0

  for (const [entryId, score] of candidateIds.entries()) {
    if (score > bestScore) {
      const entry = ENTRIES.find(e => e.id === entryId)
      if (entry) {
        bestEntry = entry
        bestScore = score
      }
    }
  }

  // Se ainda não encontrou, fazer busca mais permissiva (qualquer palavra em comum)
  if (!bestEntry && words.length > 0) {
    for (const entry of ENTRIES) {
      const expandedKeywords = expandKeywords(entry.keywords)
      for (const { term, weight } of expandedKeywords) {
        const normalizedKeyword = normalizeQuestion(term)
        const keywordWords = normalizedKeyword.split(/\s+/)

        // Verificar se há pelo menos 2 palavras em comum
        const commonWords = words.filter(w => keywordWords.includes(w) && w.length > 2)
        if (commonWords.length >= 2) {
          // Score baseado no número de palavras comuns e peso da keyword
          const score = commonWords.length * Math.max(1, Math.floor(weight * 0.5))
          if (score > bestScore) {
            bestEntry = entry
            bestScore = score
          }
          registerCandidateMatch(candidateMatches, entry.id, commonWords.join(' '), score)
        }
      }
    }
  }

  if (!bestEntry) {
    // Cache null também (evita recalcular perguntas sem resposta)
    setCachedKBResult(q, null)
    return null
  }

  const bestMeta = candidateMatches.get(bestEntry.id)
  const matchedTerms = Array.from(bestMeta?.matchedTerms ?? [])
  const confidence = computeKBConfidence(bestEntry.id, bestScore, matchedTerms, words)
  const reason = buildKBReason(bestEntry.id, confidence, matchedTerms)

  const result: KBReplyRaw = {
    entryId: bestEntry.id,
    responses: bestEntry.responses,
    actions: bestEntry.actions,
    ctas: bestEntry.ctas,
    confidence,
    score: bestScore,
    reason,
    matchedTerms,
  }
  
  // Salvar no cache antes de retornar
  setCachedKBResult(q, result)
  return result
}

// Client-side: escolhe variação e monta resposta final
export function pickVariantAndBuildReply(raw: KBReplyRaw): KBReply {
  if (!raw) return null

  const spokenText = pickVariant(raw.responses, raw.entryId)
  return {
    spokenText,
    actions: raw.actions,
    ctas: raw.ctas,
  }
}
