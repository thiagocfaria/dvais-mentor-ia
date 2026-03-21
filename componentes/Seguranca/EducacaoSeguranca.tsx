import Icon from '@/componentes/Icon'

/**
 * EducacaoSeguranca
 *
 * Educação como camada de segurança (tom profissional, sem terrorismo).
 */
export default function EducacaoSeguranca() {
  const pontos = [
    {
      icon: 'fas fa-graduation-cap',
      title: 'Decisões mais consistentes',
      description:
        'Entender o básico (risco, alavancagem, liquidez e volatilidade) reduz erros operacionais e decisões impulsivas.',
    },
    {
      icon: 'fas fa-bullseye',
      title: 'Regras claras antes de operar',
      description:
        'Checklist e limites ajudam a manter disciplina, principalmente em dias “difíceis” ou quando o mercado muda rápido.',
    },
    {
      icon: 'fas fa-lightbulb',
      title: 'Transparência sobre limites',
      description:
        'Explicamos o “por quê” das sugestões. Você vê a lógica e decide com responsabilidade.',
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8" aria-labelledby="educacao-seguranca">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="educacao-seguranca" className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Educação também é segurança
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Segurança não é só tecnologia: é processo, disciplina e entendimento do que você está
            fazendo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pontos.map(p => (
            <div
              key={p.title}
              className="group relative glass-intense border border-blue-400/20 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-400/40 hover:shadow-blue-500/20 card-glow-hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                  <Icon name={p.icon} className="text-white text-xl" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white">{p.title}</h3>
                <p className="text-gray-300 leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-4xl mx-auto">
          <div className="glass-intense border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <Icon name="fas fa-shield-alt" className="text-cyan-300 mt-1" aria-hidden="true" />
              <p className="text-sm text-gray-300">
                Nosso foco é reduzir risco operacional e aumentar clareza. Você mantém controle
                total sobre suas decisões e execução.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
