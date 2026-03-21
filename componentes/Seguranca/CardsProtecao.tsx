import Icon from '@/componentes/Icon'

/**
 * CardsProtecao
 *
 * 4 pilares da Proteção Inteligente:
 * - Conta / Capital / Decisão / Dados
 *
 * Página pública (pré-login): apenas copy + UI (zero coleta de dados).
 */
export default function CardsProtecao() {
  const pilares = [
    {
      icon: 'fas fa-lock',
      title: 'Conta',
      subtitle: 'Acesso, sessão e proteção contra abuso',
      gradient: 'from-blue-500/20 to-blue-600/10',
      iconGradient: 'from-blue-400 to-blue-500',
      borderColor: 'border-blue-400/30',
      bullets: [
        'Login com boas práticas e camadas defensivas (rate limit, validações)',
        'Sessão pensada para reduzir risco de sequestro de sessão',
        'Sem UI que sugira saque/depósito pela plataforma',
      ],
    },
    {
      icon: 'fas fa-bullseye',
      title: 'Capital',
      subtitle: 'Gestão de risco orientada à sua realidade',
      gradient: 'from-cyan-500/20 to-cyan-600/10',
      iconGradient: 'from-cyan-400 to-cyan-500',
      borderColor: 'border-cyan-400/30',
      bullets: [
        'Regras de exposição e limites para reduzir decisões impulsivas',
        'Foco em proteção de caixa e preservação em momentos adversos',
        'Transparência: você decide — a ferramenta orienta',
      ],
    },
    {
      icon: 'fas fa-chart-bar',
      title: 'Decisão',
      subtitle: 'Alertas e orientação sem promessas exageradas',
      gradient: 'from-blue-500/20 to-cyan-500/10',
      iconGradient: 'from-blue-400 to-cyan-400',
      borderColor: 'border-blue-400/30',
      bullets: [
        'Alertas claros e acionáveis para reduzir erro operacional',
        'Contexto e checklist para decisões mais consistentes',
        'Educação contínua para evitar “atalhos” perigosos',
      ],
    },
    {
      icon: 'fas fa-robot',
      title: 'Dados',
      subtitle: 'Minimização, redaction e controle',
      gradient: 'from-cyan-500/20 to-blue-500/10',
      iconGradient: 'from-cyan-400 to-blue-400',
      borderColor: 'border-cyan-400/30',
      bullets: [
        'Minimização de dados: usar apenas o necessário para orientar',
        'Proteções contra vazamentos: headers e políticas de segurança',
        'Sem credenciais de corretora (não pedimos, não armazenamos)',
      ],
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8" aria-labelledby="pilares-protecao">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="pilares-protecao" className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Segurança em camadas, do jeito certo
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Proteção Inteligente combina segurança, gestão de risco e transparência — sem promessas
            irreais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pilares.map(pilar => (
            <div
              key={pilar.title}
              className={`group relative glass-intense border ${pilar.borderColor} rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/20 card-glow-hover`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${pilar.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10 space-y-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${pilar.iconGradient} rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-2 transition-all duration-300`}
                >
                  <Icon name={pilar.icon} className="text-white text-2xl" aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{pilar.title}</h3>
                  <p className="text-base text-gray-300">{pilar.subtitle}</p>
                </div>

                <ul className="space-y-3">
                  {pilar.bullets.map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <Icon
                        name="fas fa-check-circle"
                        className="text-cyan-400 mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
