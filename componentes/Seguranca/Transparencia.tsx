import Icon from '@/componentes/Icon'

/**
 * Transparencia
 *
 * Reforço explícito: não somos corretora, não fazemos custódia e não executamos ordens.
 */
export default function Transparencia() {
  const itens = [
    {
      icon: 'fas fa-building',
      title: 'Não somos corretora',
      description:
        'O DVAi$ - Mentor IA é uma plataforma educacional e de orientação. Você opera diretamente na sua corretora.',
    },
    {
      icon: 'fas fa-lock',
      title: 'Não fazemos custódia',
      description:
        'Não guardamos fundos, não movimentamos ativos e não pedimos senha da corretora. A decisão e a execução são suas.',
    },
    {
      icon: 'fas fa-hand-holding-heart',
      title: 'O que fazemos',
      description:
        'Oferecemos orientação educacional, análise personalizada baseada na sua realidade financeira, alertas inteligentes e ferramentas para você investir com mais segurança, conhecimento e disciplina. Seu mentor no dia a dia.',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-400/40',
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8" aria-labelledby="transparencia">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="transparencia" className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Transparência em primeiro lugar
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Segurança também é deixar claro o que fazemos — e o que não fazemos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {itens.map(i => (
            <div
              key={i.title}
              className={`group relative glass-intense border ${i.borderColor || 'border-white/10'} rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/20 card-glow-hover`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${i.gradient || 'from-blue-500/10 to-cyan-500/10'} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10 space-y-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                  <Icon name={i.icon} className="text-white text-xl" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{i.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{i.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400">
            <span className="text-white font-semibold">Importante:</span> nada nesta página coleta
            dados. Para recursos avançados, o usuário sempre decide e consente.
          </p>
        </div>
      </div>
    </section>
  )
}
