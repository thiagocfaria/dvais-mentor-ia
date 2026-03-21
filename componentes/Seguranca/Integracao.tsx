import Icon from '@/componentes/Icon'

/**
 * Integracao Component
 *
 * Seção que mostra visualmente como todas as camadas de proteção trabalham juntas
 * Fluxo visual profissional mostrando a integração entre os módulos
 */
export default function Integracao() {
  const etapas = [
    {
      numero: '1',
      titulo: 'Seu Perfil Financeiro',
      subtitulo: 'Guia Financeiro',
      descricao: 'Você informa sua realidade: receitas, despesas, objetivos e situação atual.',
      icon: 'fas fa-wallet',
      gradient: 'from-cyan-400 to-cyan-500',
    },
    {
      numero: '2',
      titulo: 'Análise Personalizada',
      subtitulo: 'Sistema Inteligente',
      descricao: 'O sistema processa seus dados e cria um perfil de risco personalizado para você.',
      icon: 'fas fa-chart-line',
      gradient: 'from-blue-400 to-blue-500',
    },
    {
      numero: '3',
      titulo: 'Alertas Inteligentes',
      subtitulo: 'Orientação Contextual',
      descricao:
        'Você recebe alertas baseados na sua situação: quando avançar, quando pausar, quando priorizar reservas.',
      icon: 'fas fa-exclamation-triangle',
      gradient: 'from-cyan-400 to-blue-500',
    },
    {
      numero: '4',
      titulo: 'Você Decide',
      subtitulo: 'Com Mais Informação',
      descricao:
        'Todas as camadas trabalham juntas para você tomar decisões mais seguras e alinhadas ao seu momento.',
      icon: 'fas fa-hand-pointer',
      gradient: 'from-blue-400 to-cyan-400',
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8" aria-labelledby="integracao">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="integracao" className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Como tudo funciona junto
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Todas as camadas de proteção trabalham em conjunto para oferecer orientação
            personalizada e segura.
          </p>
        </div>

        {/* Fluxo visual */}
        <div className="relative">
          {/* Linha conectora (desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/30 via-blue-400/50 to-cyan-400/30 transform -translate-y-1/2 z-0" />

          {/* Grid de etapas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative z-10">
            {etapas.map((etapa, index) => (
              <div key={index} className="relative">
                {/* Card da etapa */}
                <div className="group relative glass-intense border border-blue-400/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:border-cyan-400/40 hover:shadow-cyan-500/20 card-glow-hover h-full">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${etapa.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}
                  />

                  <div className="relative z-10">
                    {/* Número e ícone */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-14 h-14 bg-gradient-to-br ${etapa.gradient} rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-all duration-300`}
                      >
                        <Icon
                          name={etapa.icon}
                          className="text-white text-2xl"
                          aria-hidden="true"
                        />
                      </div>
                      <span
                        className={`text-3xl font-extrabold bg-gradient-to-r ${etapa.gradient} bg-clip-text text-transparent`}
                      >
                        {etapa.numero}
                      </span>
                    </div>

                    {/* Conteúdo */}
                    <div>
                      <div className="mb-1">
                        <span className="text-xs text-cyan-400 font-medium">{etapa.subtitulo}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{etapa.titulo}</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">{etapa.descricao}</p>
                    </div>
                  </div>
                </div>

                {/* Seta conectora (mobile e tablet) */}
                {index < etapas.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <Icon
                      name="fas fa-arrow-down"
                      className="text-cyan-400 text-2xl"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resumo final */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="glass-intense border border-cyan-400/20 rounded-2xl p-8 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                <Icon name="fas fa-sync-alt" className="text-white text-xl" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Sistema Integrado e Contínuo</h3>
                <p className="text-gray-300 leading-relaxed">
                  O <span className="text-cyan-400 font-semibold">Guia Financeiro</span> alimenta os{' '}
                  <span className="text-cyan-400 font-semibold">Alertas Inteligentes</span>, que por
                  sua vez orientam suas{' '}
                  <span className="text-cyan-400 font-semibold">Decisões</span> com base na sua{' '}
                  <span className="text-cyan-400 font-semibold">Realidade</span>. Tudo funciona de
                  forma integrada para oferecer proteção e orientação personalizada, sem promessas
                  genéricas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
