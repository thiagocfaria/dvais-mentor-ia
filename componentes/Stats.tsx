import Icon from './Icon'

/**
 * Stats Component
 *
 * Exibe estatísticas e números da plataforma DVAi$
 * - 100% Automatizado
 * - 24/7 Assistente IA
 * - Tempo Real
 * - Múltiplas Corretoras
 *
 * Design:
 * - Cards com gradientes animados
 * - Ícones FontAwesome
 * - Números destacados
 * - Layout responsivo (grid)
 *
 * Performance:
 * - Server Component (não usa 'use client')
 * - Lazy loaded na página principal (app/page.tsx)
 *
 * @returns {JSX.Element} Seção de estatísticas com 4 cards principais
 */
export default function Stats() {
  const stats = [
    {
      number: 'Next.js',
      label: 'App Router',
      icon: 'fas fa-layer-group',
      gradient: 'from-blue-400 to-blue-500',
    },
    {
      number: 'Vitest',
      label: '40 testes',
      icon: 'fas fa-vial',
      gradient: 'from-cyan-400 to-cyan-500',
    },
    {
      number: 'Playwright',
      label: 'E2E e visual',
      icon: 'fas fa-desktop',
      gradient: 'from-blue-400 to-cyan-400',
    },
    {
      number: 'Vercel',
      label: 'Build pronto',
      icon: 'fas fa-cloud',
      gradient: 'from-cyan-400 to-blue-500',
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent">
      <div className="max-w-[90rem] mx-auto px-8 lg:px-16 xl:px-20">
        <div className="text-center mb-16 -mt-20">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-300 font-medium backdrop-blur-sm mb-6 cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/30 transition-all duration-300">
            <Icon name="fas fa-chart-bar" className="mr-2" />
            Números que Falam
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Engenharia exposta na vitrine
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Tecnologias, testes e operação que sustentam a demonstração
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative glass-intense border border-white/10 rounded-2xl p-8 text-center transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 card-glow-hover"
            >
              {/* Hover Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}
              ></div>

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  <Icon name={stat.icon} className="text-white text-xl" />
                </div>

                {/* Number */}
                <div
                  className={`text-3xl lg:text-4xl font-extrabold mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent leading-tight`}
                >
                  {stat.number}
                </div>

                {/* Label */}
                <p className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors duration-300">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
