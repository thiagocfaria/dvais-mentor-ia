import Icon from '@/componentes/Icon'

/**
 * AlertasInteligentes
 *
 * Página pública (pré-login): exemplos e explicação de alertas.
 * Sem integração, sem WhatsApp e sem coleta de dados nesta etapa.
 */
export default function AlertasInteligentes() {
  const exemplos = [
    {
      icon: 'fas fa-bolt',
      title: 'Alerta de risco e contexto',
      description:
        'Quando o cenário fica mais arriscado (ex.: volatilidade e liquidez mudando rápido), você recebe um aviso com contexto e um checklist objetivo.',
      bullets: ['Sinal + motivo', 'Checklist simples', 'Próximo passo sugerido (você decide)'],
    },
    {
      icon: 'fas fa-clock',
      title: 'Alerta de disciplina',
      description:
        'Para reduzir decisões impulsivas, o sistema pode lembrar regras de exposição e pausas estratégicas antes de ações críticas.',
      bullets: ['Pausa consciente', 'Regras de exposição', 'Foco em preservação de capital'],
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8" aria-labelledby="alertas-inteligentes">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="alertas-inteligentes" className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Alertas Inteligentes
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
            Alertas são uma camada de segurança: reduzem erro operacional e ajudam a manter
            consistência — sem prometer resultados.
          </p>
          <div className="max-w-4xl mx-auto">
            <div className="glass-intense border border-cyan-400/20 rounded-xl p-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
              <p className="text-base text-gray-300 leading-relaxed text-center">
                <Icon
                  name="fas fa-info-circle"
                  className="text-cyan-400 mr-2 inline"
                  aria-hidden="true"
                />
                <span className="text-white font-semibold">
                  Para alertas mais precisos e personalizados
                </span>
                , recomendamos ativar o{' '}
                <span className="text-cyan-400 font-semibold">Guia Financeiro</span>, que permite
                conhecer sua realidade econômica e sugerir quando avançar ou pausar investimentos,
                garantindo decisões mais seguras e alinhadas ao seu momento financeiro.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {exemplos.map(item => (
            <div
              key={item.title}
              className="group relative glass-intense border border-blue-400/20 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-400/40 hover:shadow-blue-500/20 card-glow-hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 space-y-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                  <Icon name={item.icon} className="text-white text-xl" aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                </div>

                <ul className="space-y-2 pt-2 border-t border-blue-400/20">
                  {item.bullets.map(b => (
                    <li key={b} className="flex items-start gap-3 text-sm text-gray-300">
                      <Icon
                        name="fas fa-check"
                        className="text-cyan-400 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{b}</span>
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
