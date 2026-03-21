import Icon from '@/componentes/Icon'

/**
 * PublicoAlvo Component
 *
 * Seção que explica para quem é o serviço
 * - Card para iniciantes: Do Zero ao Lucro
 * - Card para experientes: Maximize Seus Resultados
 *
 * Design:
 * - Dois cards lado a lado (responsivo)
 * - Glassmorphism (backdrop-blur)
 * - Gradientes diferenciados para cada público
 * - Ícones FontAwesome
 * - Animações hover
 *
 * Performance:
 * - Server Component (não usa 'use client')
 * - Lazy loaded na página principal
 *
 * @returns {JSX.Element} Seção de público-alvo
 */
export default function PublicoAlvo() {
  const publicos = [
    {
      icon: 'fas fa-graduation-cap',
      title: 'Iniciantes',
      subtitle: 'De Aventureiro para Investidor Analista',
      description:
        'Nunca investiu antes? Não tem problema. Nosso Mentor IA te guia passo a passo, ensinando desde os conceitos básicos até estratégias avançadas. Aprenda na prática, com exemplos reais e suporte contínuo.',
      benefits: [
        'Entenda todos os termos e métricas',
        'Aprenda a ler gráficos e indicadores',
        'Tome decisões informadas desde o início',
        'Evite erros comuns de iniciantes',
      ],
      gradient: 'from-blue-500/20 to-blue-600/10',
      iconGradient: 'from-blue-400 to-blue-500',
      borderColor: 'border-blue-400/30',
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Experientes',
      subtitle: 'Maximize Seus Resultados',
      description:
        'Já investe ou é um profissional da área mas quer elevar seus resultados ainda mais? Acesse análises exclusivas, dados que você levaria horas para calcular analisados em segundos, com esta ferramenta de Inteligência Artificial avançada para otimizar ainda mais suas estratégias, tome decisões com agilidade, o tempo é o seu bem mais precioso.',
      benefits: [
        'Análises avançadas e exclusivas',
        'Dados on-chain e fluxo de ordens',
        'Sinais probabilísticos de IA',
        'Otimização contínua de estratégias',
      ],
      gradient: 'from-cyan-500/20 to-cyan-600/10',
      iconGradient: 'from-cyan-400 to-cyan-500',
      borderColor: 'border-cyan-400/30',
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Título da seção */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Seu Mentor Pessoal de Investimentos
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Seja você um investidor iniciante ou experiente, o DVAi$ se adapta ao seu nível
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {publicos.map((publico, index) => (
            <div
              key={index}
              className={`group relative glass-intense border ${publico.borderColor} rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/30 card-glow-hover`}
            >
              {/* Gradiente de fundo no hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${publico.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              ></div>

              {/* Content */}
              <div className="relative z-10 space-y-6">
                {/* Ícone */}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${publico.iconGradient} rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 glow-blue mx-auto`}
                >
                  <Icon name={publico.icon} className="text-white text-2xl" />
                </div>

                {/* Título */}
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    {publico.title}
                  </h3>
                  <p className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    {publico.subtitle}
                  </p>
                </div>

                {/* Descrição */}
                <p className="text-base text-gray-300 leading-relaxed">{publico.description}</p>

                {/* Lista de benefícios */}
                <ul className="space-y-3">
                  {publico.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Icon
                        name="fas fa-check-circle"
                        className="text-blue-400 mt-1 flex-shrink-0"
                      />
                      <span className="text-gray-300">{benefit}</span>
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
