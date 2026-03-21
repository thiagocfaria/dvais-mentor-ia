import Icon from '@/componentes/Icon'

/**
 * DadosCorretoras Component
 *
 * Seção que explica os dados básicos fornecidos pelas corretoras
 * - Preço em Tempo Real + Variação 24h
 * - Gráficos de Candles (OHLC)
 * - Livro de Ordens + Profundidade
 * - Volume e Trades Recentes
 * - Indicadores Técnicos Básicos
 * - Dados de Futuros (Funding, Open Interest)
 *
 * Design:
 * - Grid de 3 colunas (responsivo)
 * - Cards com glassmorphism
 * - Ícones FontAwesome
 * - Animações hover
 *
 * Performance:
 * - Server Component (não usa 'use client')
 * - Lazy loaded na página principal
 *
 * @returns {JSX.Element} Seção de dados das corretoras
 */
export default function DadosCorretoras() {
  const dados = [
    {
      icon: 'fas fa-dollar-sign',
      title: 'Sinais de preço e variação',
      description:
        'Exemplo de como uma interface de apoio pode destacar preço atual, variação do período e faixas de oscilação sem depender desta demo para dados ao vivo.',
      metricas: ['Preço atual', 'Variação do período', 'Faixas de máxima e mínima'],
    },
    {
      icon: 'fas fa-chart-candlestick',
      title: 'Gráficos de Candles',
      description:
        'Visualização OHLC (abertura, máxima, mínima, fechamento) de cada período para análise de tendências.',
      metricas: ['Candles 1m, 5m, 1h, 4h, 1d', 'Padrões gráficos', 'Zonas de suporte/resistência'],
    },
    {
      icon: 'fas fa-book',
      title: 'Livro de Ordens',
      description:
        'Explicações guiadas sobre leitura de livro de ordens e profundidade, com foco educativo e contextual.',
      metricas: ['Ordens de compra', 'Ordens de venda', 'Spread bid-ask'],
    },
    {
      icon: 'fas fa-layer-group',
      title: 'Profundidade de Mercado',
      description:
        'Auxílio em visualização gráfica da quantidade total de compra/venda em cada faixa de preço (depth chart).',
      metricas: ['Volume por nível', 'Paredes de compra/venda', 'Liquidez do mercado'],
    },
    {
      icon: 'fas fa-exchange-alt',
      title: 'Volume e Trades',
      description:
        'Exemplo de apoio visual para interpretação de volume, histórico recente e leitura de fluxo em uma plataforma operacional.',
      metricas: ['Volume do período', 'Trades recentes', 'Lado comprador/vendedor'],
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Indicadores Técnicos',
      description:
        'Ferramentas de análise técnica básicas: médias móveis (média do preço ao longo do tempo), RSI (indica se está caro ou barato), MACD (mostra mudanças de tendência), Bandas de Bollinger (mostra faixa de preço esperada), etc.',
      metricas: ['Médias móveis', 'RSI', 'MACD', 'Bandas de Bollinger'],
    },
    {
      icon: 'fas fa-bullseye',
      title: 'Tipos de Ordem',
      description:
        'Diferentes tipos de ordem disponíveis: market, limit, stop-loss, stop-limit, OCO, trailing stop.',
      metricas: ['Market', 'Limit', 'Stop', 'OCO'],
    },
    {
      icon: 'fas fa-rocket',
      title: 'Dados de Futuros',
      description:
        'Exemplos de métricas que uma interface educativa pode explicar para contratos futuros e derivativos.',
      metricas: ['Funding Rate', 'Open Interest', 'Long/Short Ratio'],
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Título da seção */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Exemplos de leitura de contexto
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Esta seção mostra o tipo de informação que o produto pode explicar, sem afirmar feed de mercado ao vivo nesta demo
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dados.map((dado, index) => (
            <div
              key={index}
              className="group relative glass-intense border border-blue-400/20 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-105 hover:border-blue-400/50 hover:shadow-blue-500/20 card-glow-hover"
            >
              {/* Content */}
              <div className="relative z-10 space-y-4">
                {/* Ícone */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                  {dado.title === 'Preço em Tempo Real' ? (
                    <span
                      className="text-white text-2xl font-bold"
                      style={{ display: 'grid', transform: 'rotate(-6deg)' }}
                    >
                      $
                    </span>
                  ) : dado.title === 'Gráficos de Candles' ? (
                    <svg className="text-white w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  ) : dado.title === 'Livro de Ordens' ? (
                    <svg className="text-white w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  ) : dado.title === 'Profundidade de Mercado' ? (
                    <svg className="text-white w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 15a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1zM2 7a1 1 0 011-1h6a1 1 0 110 2H3a1 1 0 01-1-1z" />
                    </svg>
                  ) : dado.title === 'Volume e Trades' ? (
                    <svg className="text-white w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      {/* 3 caixas na base */}
                      <rect x="2" y="14" width="4" height="4" rx="0.5" />
                      <rect x="7" y="14" width="4" height="4" rx="0.5" />
                      <rect x="12" y="14" width="4" height="4" rx="0.5" />
                      {/* 2 caixas no meio */}
                      <rect x="4.5" y="10" width="4" height="4" rx="0.5" />
                      <rect x="9.5" y="10" width="4" height="4" rx="0.5" />
                      {/* 1 caixa no topo */}
                      <rect x="7" y="6" width="4" height="4" rx="0.5" />
                    </svg>
                  ) : dado.title === 'Indicadores Técnicos' ? (
                    <svg
                      className="text-white w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  ) : dado.title === 'Dados de Futuros' ? (
                    <Icon name="fas fa-eye" className="text-white text-xl" />
                  ) : (
                    <Icon name={dado.icon} className="text-white text-xl" />
                  )}
                </div>

                {/* Título */}
                <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 group-hover:bg-clip-text transition-all duration-300">
                  {dado.title}
                </h3>

                {/* Explicação adicional para Gráficos de Candles */}
                {dado.title === 'Gráficos de Candles' && (
                  <p className="text-xs text-gray-400 italic">
                    (visualização do preço com abertura, máxima, mínima e fechamento em cada
                    período)
                  </p>
                )}

                {/* Descrição */}
                <p className="text-sm text-gray-300 leading-relaxed">{dado.description}</p>

                {/* Métricas */}
                <div className="pt-2 border-t border-blue-400/20">
                  <ul className="space-y-2">
                    {dado.metricas.map((metrica, idx) => {
                      // Se for objeto com nome e descrição, renderiza com descrição
                      if (
                        typeof metrica === 'object' &&
                        metrica !== null &&
                        'nome' in metrica &&
                        'descricao' in metrica
                      ) {
                        const metricaObj = metrica as { nome: string; descricao: string }
                        return (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                            <Icon
                              name="fas fa-check"
                              className="text-blue-400 text-xs mt-0.5 flex-shrink-0"
                            />
                            <span>
                              <span className="text-blue-300 font-semibold">{metricaObj.nome}</span>
                              {' - '}
                              <span className="text-gray-400">{metricaObj.descricao}</span>
                            </span>
                          </li>
                        )
                      }
                      // Renderização padrão para strings (fallback)
                      return (
                        <li key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                          <Icon name="fas fa-check" className="text-blue-400 text-xs" />
                          <span>{typeof metrica === 'string' ? metrica : String(metrica)}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-300 mb-4">
            <Icon name="fas fa-lightbulb" className="text-yellow-400 mr-2" />
            <span className="text-blue-400 font-semibold">Aprenda como</span>, ou se preferir{' '}
            <span className="text-blue-400 font-semibold">calculamos</span> e{' '}
            <span className="text-blue-400 font-semibold">interpretamos</span> cada uma dessas
            métricas para você ganhar tempo
          </p>
          <p className="text-base text-gray-400">
            Com o Mentor IA, você nunca mais olhará para um gráfico sem saber o que fazer
          </p>
        </div>
      </div>
    </section>
  )
}
