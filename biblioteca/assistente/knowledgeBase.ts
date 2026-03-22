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
      { term: 'dvais', weight: 5 }, // Termo mais específico e importante
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
      'O DVAi$ é um mentor de investimentos com IA: te guia pela análise de mercado, ensina a interpretar indicadores e protege você de decisões impulsivas — tudo por voz ou clique, direto na interface.',
      'DVAi$ te ajuda a investir com mais segurança. Ele explica o que você está vendo na tela, ensina conceitos na prática e te guia do iniciante ao analista — sem prometer lucro, sem pedir senha.',
      'Pense no DVAi$ como um mentor que caminha com você: explica cada parte da análise, responde dúvidas por voz e texto, e te protege de armadilhas comuns no mercado.',
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
      'Bora! Eu te mostro as 3 áreas principais: análise de mercado guiada, proteção inteligente e trilha de aprendizado. Por qual quer começar?',
      'Posso te guiar agora: eu navego com você, destaco cada seção e explico o que cada parte faz. Quer começar pela análise, proteção ou aprendizado?',
      'Tour rápido: eu te levo pelas 3 áreas do DVAi$ e explico tudo no caminho. Começo pela análise guiada?',
    ],
    actions: [{ type: 'navigateRoute', route: '/' }],
  },
  {
    id: 'analise_em_tempo_real',
    title: 'Análise em tempo real',
    keywords: [
      // Keywords originais
      'análise em tempo real',
      'tempo real',
      'indicadores',
      'mercado',
      'ordens',
      // Keywords consolidadas da entrada legada 'analise'
      'análise',
      'monitoramento',
      'alerta',
      'dados mercado',
      'análise técnica',
      'dados corretora',
      'informação instantânea',
      // Keywords coloquiais
      'ver mercado',
      'checar mercado',
      'dados do mercado',
      'ver indicadores',
      'análise agora',
      'dados em tempo real',
      'ver ordens',
    ],
    responses: [
      'Na análise em tempo real, eu te mostro como ler candlesticks, volume, livro de ordens e indicadores técnicos — passo a passo, explicando o que cada sinal significa na prática.',
      'Aqui você aprende a interpretar dados de mercado com a minha ajuda: eu destaco os pontos importantes, explico os indicadores e te ajudo a montar sua leitura antes de decidir.',
      'A análise guiada funciona assim: você vê os dados, eu explico o contexto e os sinais relevantes. Sem achismo — tudo baseado em leitura técnica que você mesmo aprende a fazer.',
    ],
    actions: [{ type: 'navigateRoute', route: '/analise-tempo-real', targetId: 'analise-hero' }],
  },
  {
    id: 'protecao_inteligente',
    title: 'Proteção inteligente',
    keywords: [
      // Keywords originais
      'proteção inteligente',
      'segurança',
      'privacidade',
      'golpe',
      'senha',
      'custódia',
      // Keywords consolidadas da entrada legada 'seguranca'
      'proteção',
      'risco',
      'transparência',
      'gestão risco',
      'alertas inteligentes',
      'guia financeiro',
      'camadas segurança',
      // Keywords coloquiais
      'me proteger',
      'seguro',
      'proteção',
      'não ser enganado',
      'evitar golpe',
      'ficar seguro',
      'proteger meu dinheiro',
    ],
    responses: [
      'Proteção inteligente é o meu papel principal: eu te aviso antes de decisões arriscadas, nunca peço sua senha e não prometo lucro. Você fica no comando — eu só garanto que você decide com informação.',
      'Aqui a segurança funciona assim: rate limit contra abuso, circuit breaker contra falhas, validação de ações e, o mais importante, eu nunca guardo seus ativos nem peço credenciais.',
      'Sua proteção tem várias camadas: orientação técnica contra decisões por impulso, alertas de risco, validação de cada ação e zero acesso às suas credenciais ou ativos.',
    ],
    actions: [{ type: 'navigateRoute', route: '/seguranca', targetId: 'seguranca-hero' }],
  },
  {
    id: 'aprendizado_continuo',
    title: 'Aprendizado contínuo',
    keywords: [
      // Keywords originais
      'aprendizado contínuo',
      'aprender',
      'iniciante',
      'aventureiro',
      'analista',
      'trilha',
      // Keywords consolidadas da entrada legada 'aprendizado'
      'aprendizado',
      'melhora',
      'personaliza',
      'evolui',
      'adapta',
      'aprende com você',
      'personalização',
      'educação',
      // Keywords coloquiais
      'aprender a investir',
      'como aprender',
      'me ensinar',
      'ensinar',
      'tutorial',
      'curso',
      'aprender fazendo',
      'evoluir',
    ],
    responses: [
      'Você evolui no seu ritmo: começa como iniciante aprendendo o básico, avança para aventureiro praticando leitura de mercado, e chega a analista quando domina os sinais. Eu acompanho cada etapa.',
      'O aprendizado aqui é prático: eu explico os conceitos enquanto você navega, mostro exemplos reais e aumento a profundidade conforme você evolui.',
      'A trilha funciona assim: iniciante (conceitos básicos) → aventureiro (leitura de contexto) → analista (confluência de sinais e gestão de risco). Em qual etapa você está?',
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
      'Iniciante é quem quer investir com segurança, mas ainda está aprendendo o básico: o DVAi$ traduz termos, mostra exemplos e te dá um roteiro claro.',
      'Se você está começando, eu simplifico: explico candles, ordens, volume e risco com linguagem direta e passos práticos.',
      'Para iniciantes, a regra é: clareza primeiro, pressa depois. Você aprende o que olhar antes de agir.',
    ],
    actions: [{ type: 'navigateRoute', route: '/aprendizado-continuo' }],
  },
  {
    id: 'perfil_aventureiro',
    title: 'O que é Aventureiro',
    keywords: ['aventureiro', 'já mexi', 'tenho noção', 'quero arriscar'],
    responses: [
      'Aventureiro é quem já tem noção do básico e quer ir além — mas com método. Aqui a gente foca em leitura de contexto, disciplina e controle de risco.',
      'Se você já entende o básico, eu te ajudo a evitar armadilhas: operar por impulso, ignorar volume, entrar sem plano e sem proteção.',
      'Aventureiro é o perfil que quer evolução rápida, mas sem virar aposta: técnica + checklist + consistência.',
    ],
    actions: [{ type: 'navigateRoute', route: '/analise-tempo-real', targetId: 'analise-hero' }],
  },
  {
    id: 'perfil_analista',
    title: 'O que é Investidor Analista',
    keywords: ['analista', 'investidor analista', 'avançado', 'pro'],
    responses: [
      'Investidor Analista é quem quer decisão baseada em dados: confluência de sinais, leitura de liquidez/ordens, indicadores e gestão de risco com consistência.',
      'No modo analista, você usa dados para validar hipótese: não é "achismo", é processo. Eu ajudo você a organizar evidências e riscos.',
      'Analista aqui é sinônimo de método: contexto → gatilho → risco → execução → revisão.',
    ],
    actions: [{ type: 'navigateRoute', route: '/analise-tempo-real', targetId: 'analise-hero' }],
  },
  {
    id: 'precos',
    title: 'Planos e valores',
    keywords: [
      // Keywords originais
      'preço',
      'valor',
      'plano',
      'assinatura',
      'quanto custa',
      // Keywords consolidadas da entrada legada 'preco'
      'custo',
      'planos',
      'tarifa',
      // Keywords coloquiais
      'quanto é',
      'quanto pago',
      'quanto sai',
      'preço',
      'valores',
      'quanto custa',
      'quanto é o plano',
      'quanto custa usar',
    ],
    responses: [
      'Os planos e valores aparecem depois do cadastro/login, junto com o que cada plano inclui. Quer que eu te aponte o botão de começar agora?',
      'Para ver a tabela de valores, o caminho é entrar na sua conta. Eu posso te guiar: você prefere criar cadastro ou já fazer login?',
      'Os valores ficam disponíveis dentro da área logada, com os benefícios de cada plano. Se quiser, eu te levo até o cadastro agora.',
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
    keywords: ['garantia', 'lucro garantido', '100%', 'sem risco', 'certeza'],
    responses: [
      'Eu não posso prometer lucro — investimento envolve risco. O que a gente garante é método: análise, leitura técnica e orientação para você decidir melhor e com mais segurança.',
      'Desconfie de quem promete lucro garantido. Aqui a proposta é ser sério: te ensinar a interpretar dados e reduzir erros com um processo técnico.',
      'Lucro não é garantia; técnica é. A plataforma te ajuda a analisar, controlar risco e agir com disciplina — isso aumenta suas chances, sem prometer milagre.',
    ],
  },
  {
    id: 'suporte',
    title: 'Suporte e contato',
    keywords: ['suporte', 'ajuda', 'whatsapp', 'contato', 'atendimento'],
    responses: [
      'Você tem suporte via WhatsApp com inteligência artificial para dúvidas e orientação. Se você quiser, me diga sua dúvida que eu já te direciono.',
      'O suporte é feito via WhatsApp com IA para responder rápido e guiar você nas etapas. Quer suporte para qual parte: análise, segurança ou aprendizado?',
      'Temos atendimento via WhatsApp com IA para agilizar: você pergunta e eu te guio com passo a passo.',
    ],
  },
  {
    id: 'guia_financeiro',
    title: 'Guia Financeiro e relatório de despesas',
    keywords: ['guia financeiro', 'despesas', 'relatório', 'salário', 'gastos', 'extrato'],
    responses: [
      'O Guia Financeiro organiza sua realidade: entradas, saídas e objetivos. Isso evita investir "no escuro" e ajuda a definir o quanto faz sentido alocar com segurança.',
      'Aqui a ideia é simples: antes de investir, você entende sua saúde financeira. A plataforma ajuda a montar um relatório de despesas e a planejar com base no seu momento.',
      'O Guia Financeiro te dá clareza do seu capital: o que sobra, o que pesa e o que é prioridade — pra você não se expor além do que pode.',
    ],
    actions: [{ type: 'navigateRoute', route: '/seguranca', targetId: 'seguranca-hero' }],
  },
  // Entrada legada mantida para compatibilidade (keywords já consolidadas em 'elevator_pitch')
  {
    id: 'cadastro',
    title: 'Cadastro',
    keywords: [
      { term: 'cadastro', weight: 6 },
      { term: 'como funciona o cadastro', weight: 7 },
      { term: 'fazer cadastro', weight: 5 },
      { term: 'criar conta', weight: 4 },
      { term: 'registrar', weight: 4 },
      { term: 'sign up', weight: 3 },
      { term: 'inscrever', weight: 3 },
      { term: 'começar', weight: 2 },
    ],
    responses: [
      'Para se cadastrar, abra "Começar Agora", preencha o formulário e confirme seu email. Depois disso, se quiser, eu te guio para o login.',
      'O cadastro é guiado: vá até "Começar Agora", revise seus dados no formulário e confirme o email. Na sequência, você pode seguir para o login da demo.',
      'Para criar sua conta nesta demonstração, abra "Começar Agora", preencha os campos e confirme o email. Se aparecer dúvida no meio do caminho, eu continuo o fluxo com você.',
    ],
    actions: [{ type: 'navigateRoute', route: '/cadastro', targetId: 'cadastro-card' }],
  },
  {
    id: 'login',
    title: 'Login',
    keywords: [
      { term: 'login', weight: 6 },
      { term: 'como funciona o login', weight: 7 },
      { term: 'fazer login', weight: 6 },
      { term: 'acessar conta', weight: 5 },
      { term: 'entrar na conta', weight: 5 },
      { term: 'logar', weight: 4 },
      { term: 'minha conta', weight: 3 },
      { term: 'entrar', weight: 2 },
    ],
    responses: [
      'Para fazer login, abra "Login" no topo, preencha email e senha e confira as validações da tela antes de enviar.',
      'O login nesta demo é um fluxo de interface: você abre a tela, revisa email e senha e envia o formulário. Se algo não passar, a própria página aponta o ajuste.',
      'Quer entrar? Vá para "Login", preencha seus dados e use as mensagens da interface para revisar qualquer campo antes de tentar de novo.',
    ],
    actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
  },
  {
    id: 'saudacao',
    title: 'Saudação',
    keywords: [
      { term: 'oi', weight: 5 },
      { term: 'olá', weight: 5 },
      { term: 'ola', weight: 5 },
      { term: 'bom dia', weight: 4 },
      { term: 'boa tarde', weight: 4 },
      { term: 'boa noite', weight: 4 },
      { term: 'e aí', weight: 2 },
      { term: 'eai', weight: 2 },
      { term: 'eae', weight: 2 },
      { term: 'e aê', weight: 2 },
      { term: 'hey', weight: 2 },
      { term: 'opa', weight: 2 },
      { term: 'salve', weight: 2 },
      { term: 'fala', weight: 2 },
      { term: 'beleza', weight: 1 },
      { term: 'suave', weight: 1 },
      { term: 'tranquilo', weight: 1 },
    ],
    responses: [
      'Oi! Sou o Davi, seu mentor de investimentos. Posso te explicar a plataforma, tirar dúvidas sobre o mercado ou te guiar pela análise. O que prefere?',
      'Olá! Tô aqui pra te ajudar. Quer entender como a plataforma funciona, aprender sobre investimentos ou fazer um tour rápido?',
      'E aí! Posso te ajudar com análise de mercado, explicar conceitos ou te guiar pela plataforma. Por onde quer começar?',
      'Oi! Sou o Davi. Me pergunta qualquer coisa sobre investimentos ou a plataforma — por texto ou por voz, como preferir.',
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
      'O DVAi$ não é corretora, não guarda seus ativos e nunca pede senha. O que fazemos é ensinar: análise técnica, leitura de mercado e decisões com método.',
      'Não fazemos custódia, não pedimos credenciais e não prometemos lucro. Nosso papel é te dar conhecimento e ferramentas para você investir melhor por conta própria.',
      'Somos um mentor, não uma corretora. Não guardamos dinheiro, não pedimos senhas e não prometemos retorno. Te ensinamos a analisar, decidir e se proteger.',
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
      'Sou o Davi, o assistente de IA do DVAi$. Eu explico o que você vê na tela, ensino conceitos de investimento e te guio pela plataforma — por voz ou texto, como preferir.',
      'Sou uma IA treinada para te ajudar a investir com mais método. Posso explicar indicadores, tirar dúvidas sobre o mercado e te guiar pela plataforma inteira.',
      'Me chamo Davi e sou o mentor de IA do DVAi$. Meu trabalho é te ajudar a entender o mercado, usar a plataforma e tomar decisões mais informadas.',
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
      'A plataforma DVAi$ está disponível 24 horas por dia, 7 dias por semana. Você pode acessar e usar todas as funcionalidades a qualquer momento.',
      'Funcionamos 24/7! A plataforma está sempre disponível para você usar quando precisar.',
      'Estamos disponíveis 24 horas por dia, todos os dias. Você pode acessar a plataforma e usar todas as funcionalidades quando quiser.',
    ],
  },
  {
    id: 'resultados',
    title: 'Resultados e métricas',
    keywords: ['resultados', 'métricas', 'estatísticas', 'números', 'desempenho', 'indicadores'],
    responses: [
      'Na página inicial você vê as métricas da plataforma: número de análises guiadas, taxa de acerto das orientações e satisfação dos usuários. Quer que eu te leve até lá?',
      'Os resultados ficam na seção de estatísticas da home. Lá você vê dados reais de uso: quantas análises foram feitas, quantos alertas dispararam e o nível de confiança dos usuários.',
      'As estatísticas da plataforma mostram o uso real: análises realizadas, alertas de proteção ativados e evolução dos usuários. Posso te levar até essa seção.',
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
      'O método é simples: primeiro você aprende os conceitos (eu explico tudo por voz ou texto), depois pratica a leitura de mercado com a minha orientação, e só age quando entende o que está fazendo. Nada de "achismo".',
      'Funciona em 3 etapas: aprender (eu ensino os conceitos), analisar (eu te guio na leitura dos dados) e decidir (você age com método, não por impulso). Quer começar pelo básico?',
      'Aqui o caminho é: entender → analisar → agir. Eu caminho com você em cada etapa — explico termos, mostro indicadores e te ajudo a montar uma leitura antes de qualquer decisão.',
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
      'Aqui você pode: aprender a analisar o mercado com orientação por voz e texto, entender indicadores técnicos na prática, navegar por uma interface guiada e tirar dúvidas comigo a qualquer momento.',
      'Você pode explorar análise de mercado guiada, aprender conceitos de investimento do iniciante ao avançado, usar proteção inteligente contra decisões ruins e conversar comigo por voz ou texto.',
      'O DVAi$ te oferece: mentor por voz que explica a tela, trilha de aprendizado (iniciante → aventureiro → analista), análise guiada de indicadores e proteção contra armadilhas comuns.',
    ],
    actions: [{ type: 'navigateRoute', route: '/' }],
  },
  {
    id: 'assistente_voz',
    title: 'Como usar o assistente por voz',
    keywords: [
      { term: 'voz', weight: 5 },
      { term: 'falar', weight: 4 },
      { term: 'por voz', weight: 5 },
      { term: 'microfone', weight: 4 },
      { term: 'como falar com voce', weight: 5 },
      { term: 'assistente de voz', weight: 5 },
      { term: 'comando de voz', weight: 4 },
      { term: 'reconhecimento de voz', weight: 3 },
      { term: 'falar com davi', weight: 5 },
      { term: 'usar a voz', weight: 4 },
    ],
    responses: [
      'Para falar comigo por voz: clique em "Falar com Davi" e depois no botão do microfone. Fale sua pergunta e eu respondo por voz e texto. Simples assim.',
      'O assistente de voz funciona em 2 toques: abra o chat e aperte o microfone. Você fala, eu ouço, processo e respondo — tudo dentro da interface.',
      'Quer usar a voz? Abra o chat clicando em "Falar com Davi", depois toque no ícone do microfone. Eu escuto sua pergunta e respondo por voz automaticamente.',
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
