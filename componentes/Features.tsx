import Link from 'next/link'
import Icon from './Icon'

/**
 * Features Component
 *
 * Exibe as principais funcionalidades da plataforma DVAi$
 * - Análise em Tempo Real: Monitoramento contínuo do mercado
 * - Proteção Inteligente: Sistema de segurança avançado
 * - Aprendizado Contínuo: IA que evolui com preferências do usuário
 *
 * Design:
 * - Cards com glassmorphism (backdrop-blur)
 * - Animações hover suaves
 * - Gradientes animados
 * - Ícones FontAwesome
 *
 * Performance:
 * - Server Component (não usa 'use client')
 * - Lazy loaded na página principal (app/page.tsx)
 *
 * @returns {JSX.Element} Seção de funcionalidades com 3 cards principais
 */
export default function Features() {
  const features = [
    {
      icon: 'fas fa-route',
      title: 'Orientação contextual',
      description:
        'Assistente por voz e clique para explicar telas, seções públicas e próximos passos com contexto de navegação.',
      gradient: 'from-blue-500/20 to-blue-600/10',
      iconGradient: 'from-blue-400 to-blue-500',
      borderColor: 'border-blue-400/30',
      link: '/analise-tempo-real',
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Validação e proteção',
      description:
        'Validação de ações do assistente, saneamento de entrada, rate limit e circuit breaker para reduzir respostas inseguras.',
      gradient: 'from-cyan-500/20 to-cyan-600/10',
      iconGradient: 'from-cyan-400 to-cyan-500',
      borderColor: 'border-cyan-400/30',
      link: '/seguranca',
    },
    {
      icon: 'fas fa-clipboard-check',
      title: 'Fluxos e aprendizado guiado',
      description:
        'Páginas demonstrativas, formulários com validação forte e UX voltada a reduzir atrito em operações passo a passo.',
      gradient: 'from-blue-500/20 to-cyan-500/10',
      iconGradient: 'from-blue-400 to-cyan-400',
      borderColor: 'border-blue-400/30',
      link: '/aprendizado-continuo',
    },
  ]

  return (
    <section id="features" className="py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-300 font-medium backdrop-blur-sm mb-6">
            <Icon name="fas fa-star" className="mr-2" />
            Funcionalidades
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent leading-tight tracking-tight">
            O que o projeto realmente entrega
          </h2>
          <p className="text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Foco em experiência guiada, validação e confiabilidade operacional
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            // Se o feature tem link, renderiza como <Link>, senão como <div>
            const content = (
              <>
                {/* Hover Glow Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.iconGradient} rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                  >
                    <Icon name={feature.icon} className="text-white text-2xl" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl lg:text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 group-hover:bg-clip-text transition-all duration-300 leading-tight tracking-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300 font-normal">
                    {feature.description}
                  </p>
                </div>
              </>
            )

            return feature.link ? (
              <Link
                key={index}
                href={feature.link}
                className="group relative glass-intense border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 card-glow-hover cursor-pointer"
              >
                {content}
              </Link>
            ) : (
              <div
                key={index}
                className="group relative glass-intense border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 card-glow-hover"
              >
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
