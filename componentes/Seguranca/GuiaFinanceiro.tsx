import Icon from '@/componentes/Icon'

/**
 * GuiaFinanceiro (Segurança do Orçamento)
 *
 * Módulo opcional (add-on) que ajuda o usuário a investir com mais segurança
 * conforme a realidade atual: receitas/despesas/lucros/prejuízos/objetivos.
 *
 * Nesta etapa: apenas apresentação (copy + cards). Sem coleta de dados.
 */
export default function GuiaFinanceiro() {
  const exemplos = [
    {
      title: 'Relatório Mensal de Despesas + Análise de Capital',
      description:
        'Organizamos suas finanças e geramos um relatório mensal para você investir com mais segurança. Você atualiza do jeito que preferir: site/app ou WhatsApp — por áudio, mensagem, foto legível da nota, ou PDF. Com isso, analisamos também entradas de capital e sua realidade financeira atual para orientar com precisão limites, riscos e próximos passos, evitando decisões fora do seu momento.',
      icon: 'fas fa-chart-line',
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8" aria-labelledby="guia-financeiro">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full text-sm text-cyan-300 font-medium backdrop-blur-sm mb-6">
            <Icon name="fas fa-star" className="text-cyan-300" aria-hidden="true" />
            Add-on opcional
          </div>
          <h2 id="guia-financeiro" className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent block">
              Guia Financeiro
            </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent block text-2xl lg:text-4xl mt-2">
              (Segurança do Orçamento)
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            <span className="text-white font-semibold">Seu mercado muda. Sua vida também.</span>
            <br />
            Investir com <span className="text-cyan-400 font-semibold">segurança</span> exige
            decisões alinhadas com a sua{' '}
            <span className="text-cyan-400 font-semibold">realidade</span>: contas do mês,
            imprevistos, <span className="text-cyan-400 font-semibold">metas</span> e{' '}
            <span className="text-cyan-400 font-semibold">prazos</span>.
            <br />O <span className="text-white font-semibold">Guia Financeiro</span> ajuda você a
            definir quanto investir com{' '}
            <span className="text-cyan-400 font-semibold">tranquilidade</span>, quando{' '}
            <span className="text-cyan-400 font-semibold">reduzir risco</span> e quando{' '}
            <span className="text-cyan-400 font-semibold">priorizar reservas</span> — para que o
            investimento não comprometa sua{' '}
            <span className="text-cyan-400 font-semibold">estabilidade</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          {exemplos.map(e => (
            <div
              key={e.title}
              className="group relative glass-intense border border-cyan-400/20 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-cyan-400/40 hover:shadow-cyan-500/20 card-glow-hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 space-y-5">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-all duration-300">
                  <Icon name={e.icon} className="text-white text-xl" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{e.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{e.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mini-bloco de transparência/disclaimer */}
        <div className="mt-10">
          <div className="glass-intense border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <Icon name="fas fa-shield-alt" className="text-cyan-300 mt-1" aria-hidden="true" />
              <div className="space-y-3">
                <p className="text-base text-gray-300 leading-relaxed">
                  Deixe de lado <span className="text-white font-semibold">promessas fáceis</span>.
                  Aqui o foco é{' '}
                  <span className="text-cyan-400 font-semibold">
                    método, dados e tecnologia de alta performance
                  </span>{' '}
                  para investimentos e gerenciamento de capital.
                </p>
                <p className="text-base text-gray-300 leading-relaxed">
                  Seu dinheiro é <span className="text-white font-semibold">coisa séria</span> — por
                  isso o <span className="text-cyan-400 font-semibold">DVAi$</span> trabalha com{' '}
                  <span className="text-cyan-400 font-semibold">análise contínua</span> e{' '}
                  <span className="text-cyan-400 font-semibold">orientações personalizadas</span>{' '}
                  para a sua realidade.
                </p>
                <p className="text-base text-gray-300 leading-relaxed">
                  Nossa missão é ser seu{' '}
                  <span className="text-white font-semibold">mentor no dia a dia</span>: organizar
                  suas finanças, cortar gastos desnecessários e ajudar seu capital a evoluir com
                  mais{' '}
                  <span className="text-cyan-400 font-semibold">
                    segurança, técnica e consistência
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA (apresentação) */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/login"
            className="group px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-xl font-semibold shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto"
            aria-label="Saiba mais e ativar (em breve)"
          >
            <Icon name="fas fa-arrow-right" className="text-white" aria-hidden="true" />
            Saiba mais / Ativar (em breve)
          </a>
          <a
            href="#funcionamento"
            className="group px-8 py-4 border-2 border-cyan-400/40 text-cyan-200 rounded-xl font-semibold hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto backdrop-blur-sm"
            aria-label="Ver funcionamento do módulo"
          >
            <Icon name="fas fa-play" className="text-cyan-300" aria-hidden="true" />
            Ver funcionamento
          </a>
        </div>
      </div>
    </section>
  )
}
