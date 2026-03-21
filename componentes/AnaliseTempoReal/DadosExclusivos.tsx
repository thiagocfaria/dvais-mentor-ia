import Icon from '@/componentes/Icon'

/**
 * DadosExclusivos Component
 *
 * Seção que destaca os dados exclusivos do Mentor IA
 * Dados que a maioria das corretoras não entrega
 *
 * - Modelos de Tendência & Momentum
 * - Análise de Fluxo de Ordens (Whales)
 * - Métricas On-Chain de Valuation
 * - Indicadores DeFi & TVL
 * - Sentimento de Mercado (Fear & Greed)
 * - Score de Qualidade do Projeto
 * - IA & Machine Learning (sinais probabilísticos)
 * - Notícias em Tempo Real
 *
 * Design:
 * - Cards destacados com borda mais proeminente
 * - Gradientes mais intensos
 * - Badges "EXCLUSIVO"
 * - Animações mais elaboradas
 *
 * Performance:
 * - Server Component (não usa 'use client')
 * - Lazy loaded na página principal
 *
 * @returns {JSX.Element} Seção de dados exclusivos
 */
export default function DadosExclusivos() {
  const exclusivos = [
    {
      icon: 'fas fa-brain',
      title: 'Modelos de IA & Machine Learning',
      description:
        'Sistemas que combinam preço, volume, derivativos, on-chain, sentimento, notícias e muito mais para gerar sinais probabilísticos de alta/baixa te dando alta vantagem competitiva.',
      destaque: 'Análise probabilística avançada',
      gradient: 'from-purple-500/20 to-blue-600/20',
      iconGradient: 'from-purple-400 to-blue-500',
      borderColor: 'border-purple-400/40',
    },
    {
      icon: 'fas fa-water',
      title: 'Análise de Fluxo de Ordens',
      description:
        'Métricas como CVD (Cumulative Volume Delta), desequilíbrio do book, agressões de compra/venda e impacto de grandes ordens (whales).',
      destaque: 'Identifique movimentos de baleias',
      gradient: 'from-cyan-500/20 to-blue-600/20',
      iconGradient: 'from-cyan-400 to-blue-500',
      borderColor: 'border-cyan-400/40',
    },
    {
      icon: 'fas fa-link',
      title: 'Métricas On-Chain',
      description:
        'MVRV, realized cap/price, NVT e uso real da rede (endereços ativos, volume on-chain) para estimar se o ativo está "caro" ou "barato".',
      destaque: 'Valuation baseado em dados reais',
      gradient: 'from-blue-500/20 to-cyan-600/20',
      iconGradient: 'from-blue-400 to-cyan-500',
      borderColor: 'border-blue-400/40',
    },
    {
      icon: 'fas fa-chart-area',
      title: 'Modelos de Tendência & Momentum',
      description:
        'Combinações de médias móveis, breakouts, RSI, MACD, ADX otimizadas com backtests sérios para identificar tendências fortes.',
      destaque: 'Estratégias testadas e otimizadas',
      gradient: 'from-green-500/20 to-blue-600/20',
      iconGradient: 'from-green-400 to-blue-500',
      borderColor: 'border-green-400/40',
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Modelos de Volatilidade & Risco',
      description:
        'Cálculos de volatilidade futura, risco de drawdown, tamanho ótimo de posição e alavancagem máxima aceitável para proteção do capital. Alerta inteligente sugerindo troca de um ativo mesmo que você não esteja logado em nossa plataforma.',
      destaque: 'Proteja seu capital',
      gradient: 'from-orange-500/20 to-red-600/20',
      iconGradient: 'from-orange-400 to-red-500',
      borderColor: 'border-orange-400/40',
    },
    {
      icon: 'fas fa-cubes',
      title: 'Indicadores DeFi & TVL',
      description:
        'Evolução do valor travado (TVL), uso de dApps, volume em DEX e renda de fees do protocolo para tokens ligados a DeFi/NFT.',
      destaque: 'Análise de protocolos DeFi',
      gradient: 'from-pink-500/20 to-purple-600/20',
      iconGradient: 'from-pink-400 to-purple-500',
      borderColor: 'border-pink-400/40',
    },
    {
      icon: 'fas fa-smile',
      title: 'Sentimento de Mercado',
      description:
        'Índices Fear & Greed, análise de redes sociais (Twitter/X, Reddit, Telegram), fluxo de stablecoins e posicionamento agregado.',
      destaque: 'Saiba quando o mercado está em pânico ou euforia',
      gradient: 'from-yellow-500/20 to-orange-600/20',
      iconGradient: 'from-yellow-400 to-orange-500',
      borderColor: 'border-yellow-400/40',
    },
    {
      icon: 'fas fa-newspaper',
      title: 'News & Eventos Filtrados',
      description:
        'Listagens em grandes corretoras, alterações regulatórias, atualizações de protocolo, unlocks, hacks, decisões judiciais com impacto estimado.',
      destaque: 'Notícias que realmente importam',
      gradient: 'from-indigo-500/20 to-blue-600/20',
      iconGradient: 'from-indigo-400 to-blue-500',
      borderColor: 'border-indigo-400/40',
    },
    {
      icon: 'fas fa-certificate',
      title: 'Score de Qualidade',
      description:
        'Avaliação automática de time, histórico de entrega, auditorias, governança, tokenomics (distribuição, vesting, inflação/queima) e concentração de holders.',
      destaque: 'Invista em projetos sólidos',
      gradient: 'from-teal-500/20 to-cyan-600/20',
      iconGradient: 'from-teal-400 to-cyan-500',
      borderColor: 'border-teal-400/40',
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Título da seção com destaque especial */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="badge-exclusivo px-4 py-2">
              <Icon name="fas fa-star" className="mr-2" />
              EXPLORAÇÃO CONCEITUAL
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold mb-4 mt-8">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Hipóteses de evolução do produto
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Esta área resume ideias de roadmap e cenários avançados, não funcionalidades já comprovadas nesta versão pública
          </p>
        </div>

        {/* Grid de cards exclusivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exclusivos.map((item, index) => (
            <div
              key={index}
              className={`group relative glass-intense border-2 ${item.borderColor} rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/30 card-glow-hover`}
            >
              {/* Gradiente de fundo no hover - mais intenso */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              ></div>

              {/* Content */}
              <div className="relative z-10 space-y-4">
                {/* Ícone com animação mais elaborada */}
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${item.iconGradient} rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 glow-blue`}
                >
                  {item.title === 'Modelos de IA & Machine Learning' ? (
                    <Icon name="fas fa-brain" className="text-white text-2xl" />
                  ) : item.title === 'Análise de Fluxo de Ordens' ? (
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      {/* Ondas de fluxo */}
                      <path
                        d="M2 10 Q4 6 6 10 T10 10 T14 10 T18 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d="M2 12 Q4 8 6 12 T10 12 T14 12 T18 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.7"
                      />
                      <path
                        d="M2 14 Q4 10 6 14 T10 14 T14 14 T18 14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.5"
                      />
                    </svg>
                  ) : item.title === 'Métricas On-Chain' ? (
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      {/* Rede de nós - círculos conectados */}
                      <circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.9" />
                      <circle cx="14" cy="6" r="2" fill="currentColor" opacity="0.9" />
                      <circle cx="6" cy="14" r="2" fill="currentColor" opacity="0.9" />
                      <circle cx="14" cy="14" r="2" fill="currentColor" opacity="0.9" />
                      <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.9" />
                      {/* Conexões */}
                      <line
                        x1="6"
                        y1="6"
                        x2="10"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                      <line
                        x1="14"
                        y1="6"
                        x2="10"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                      <line
                        x1="6"
                        y1="14"
                        x2="10"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                      <line
                        x1="14"
                        y1="14"
                        x2="10"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                      <line
                        x1="6"
                        y1="6"
                        x2="14"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="0.8"
                        opacity="0.4"
                      />
                      <line
                        x1="6"
                        y1="14"
                        x2="14"
                        y2="14"
                        stroke="currentColor"
                        strokeWidth="0.8"
                        opacity="0.4"
                      />
                    </svg>
                  ) : item.title === 'Modelos de Tendência & Momentum' ? (
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 20 20"
                      strokeWidth="1.5"
                    >
                      {/* Círculo do relógio */}
                      <circle cx="10" cy="10" r="7" stroke="currentColor" fill="none" />
                      {/* Ponteiro das horas (apontando para 3) */}
                      <line
                        x1="10"
                        y1="10"
                        x2="13"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      {/* Ponteiro dos minutos (apontando para 12) */}
                      <line
                        x1="10"
                        y1="10"
                        x2="10"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                      {/* Centro do relógio */}
                      <circle cx="10" cy="10" r="1" fill="currentColor" />
                      {/* Marcadores das horas (12, 3, 6, 9) */}
                      <line
                        x1="10"
                        y1="3"
                        x2="10"
                        y2="4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="17"
                        y1="10"
                        x2="16"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="10"
                        y1="17"
                        x2="10"
                        y2="16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="3"
                        y1="10"
                        x2="4"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : item.title === 'Indicadores DeFi & TVL' ? (
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 20 20"
                      strokeWidth="1.5"
                    >
                      {/* Cadeado representando valor travado (TVL) */}
                      {/* Corpo do cadeado */}
                      <rect
                        x="6"
                        y="10"
                        width="8"
                        height="6"
                        rx="1"
                        stroke="currentColor"
                        fill="none"
                      />
                      {/* Arco do cadeado */}
                      <path
                        d="M6 10 Q6 6 10 6 Q14 6 14 10"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Buraco da fechadura */}
                      <circle cx="10" cy="13" r="1.5" fill="currentColor" opacity="0.8" />
                    </svg>
                  ) : item.title === 'Sentimento de Mercado' ? (
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      {/* Coração representando sentimento/emoção do mercado - formato convencional */}
                      {/* Formato clássico: dois semicírculos no topo e triângulo invertido na base */}
                      <path
                        d="M10 6.5C10 6.5 4.5 1 2 3.5C0.5 5.5 2 8.5 10 16.5C18 8.5 19.5 5.5 18 3.5C15.5 1 10 6.5 10 6.5Z"
                        fill="currentColor"
                        opacity="0.95"
                      />
                    </svg>
                  ) : item.title === 'News & Eventos Filtrados' ? (
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      {/* Câmera antiga vista de lado - design minimalista */}
                      {/* Corpo da câmera com recorte da lente (usando path para criar buraco) */}
                      <path
                        d="M 1 7 L 1 15 L 19 15 L 19 7 L 1 7 Z M 10 11 m -4.5 0 a 4.5 4.5 0 1 1 9 0 a 4.5 4.5 0 1 1 -9 0 Z"
                        fill="currentColor"
                        opacity="1"
                        fillRule="evenodd"
                      />
                      {/* Lente frontal - anel externo (borda da lente) */}
                      <circle
                        cx="10"
                        cy="11"
                        r="4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        opacity="1"
                      />
                      {/* Lente interna - círculo vazado (completamente transparente para mostrar que é uma lente) */}
                      <circle
                        cx="10"
                        cy="11"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                      {/* Flash no topo */}
                      <rect
                        x="7.5"
                        y="3"
                        width="5"
                        height="3.5"
                        rx="0.5"
                        fill="currentColor"
                        opacity="1"
                      />
                    </svg>
                  ) : item.title === 'Score de Qualidade' ? (
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      {/* Estrela de 5 pontas */}
                      <path
                        d="M 10 2 L 12.5 7.5 L 18.5 8.5 L 14 12.5 L 15.5 18.5 L 10 15 L 4.5 18.5 L 6 12.5 L 1.5 8.5 L 7.5 7.5 Z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : (
                    <Icon name={item.icon} className="text-white text-2xl" />
                  )}
                </div>

                {/* Título */}
                <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 group-hover:bg-clip-text transition-all duration-300">
                  {item.title}
                </h3>

                {/* Descrição */}
                <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>

                {/* Destaque */}
                <div className="pt-3 border-t border-blue-400/30">
                  <p className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                    <Icon name="fas fa-bolt" className="text-yellow-400" />
                    {item.destaque}
                  </p>
                </div>
              </div>

              {/* Badge "EXCLUSIVO" no canto */}
              <div className="absolute top-3 right-3 z-20">
                <span className="badge-exclusivo">EXCLUSIVO</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
