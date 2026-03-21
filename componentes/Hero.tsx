'use client'

import Link from 'next/link'
import Icon from './Icon'
import AIProcessor from './AIProcessor'
import RocketIcon from './RocketIcon'

export default function Hero() {
  const highlights = [
    'Assistente por voz e clique com contexto de página',
    'Validação de ações com cache, rate limit e circuit breaker',
    'Formulários com CPF, senha forte e telefone internacional',
  ]

  return (
    <section id="hero-content" className="relative pb-32 pt-24 lg:pt-32">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="space-y-8 text-center lg:text-left">
            {/* AI Status Indicator */}
            <div className="flex justify-center lg:justify-start mb-6">
              <AIProcessor autoInitialize={false} showPerformanceInfo={true} />
            </div>

            {/* Subtitle */}
            <div className="text-sm lg:text-base text-blue-300 font-semibold uppercase tracking-wider">
              Portfólio técnico com foco em UX guiada
            </div>

            {/* Main Title */}
            <h1 className="text-4xl lg:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight text-white">
              Invista com{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent animate-gradient-shift">
                confiança
              </span>
              .<br />
              Deixe <span className="text-gradient-dvais">DVAi$</span> guiar você.
            </h1>

            {/* Description */}
            <p className="text-base lg:text-lg text-gray-300 max-w-xl leading-relaxed mx-auto lg:mx-0">
              DVAi$ - Mentor IA é um protótipo técnico em Next.js que demonstra orientação
              contextual por voz e clique, resiliência em integrações de IA e fluxos de entrada com
              validação forte.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                href="/cadastro"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-base shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/40 via-cyan-300/40 to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <RocketIcon className="relative z-10 w-6 h-6 transform group-hover:translate-y-[-4px] transition-all duration-500 flex-shrink-0" />
                <span className="relative z-10">Explorar demonstração</span>
              </Link>
              <a
                href="#features"
                className="group px-8 py-4 border-2 border-blue-400/50 text-blue-300 rounded-xl font-semibold hover:bg-blue-500/20 hover:border-blue-400 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"></span>
                <Icon name="fas fa-layer-group" className="relative z-10 w-4 h-4 flex-shrink-0" />
                <span className="relative z-10">Conhecer funcionalidades</span>
              </a>
            </div>
          </div>

          {/* Right Column - Resumo técnico */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group w-full max-w-md">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative glass-intense border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl overflow-visible">
                {/* Animated Background Gradient */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-400/5 to-blue-500/10 rounded-2xl animate-gradient-shift pointer-events-none"
                  style={{ backgroundSize: '200% 200%' }}
                ></div>

                {/* Container Border Glow */}
                <div className="absolute inset-0 rounded-2xl border border-blue-400/40 shadow-2xl shadow-blue-500/30 pointer-events-none"></div>

                <div className="relative z-20 w-full space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                        Escopo real do projeto
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-white">
                        Assistente contextual como widget flutuante
                      </h2>
                    </div>
                    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-right">
                      <p className="text-xs uppercase text-cyan-100">Status</p>
                      <p className="text-sm font-semibold text-white">Demo técnica</p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-gray-300">
                    A interação principal do assistente fica no botão flutuante global. Nesta home,
                    a vitrine foca no que o repositório realmente comprova: experiência guiada,
                    validação de dados e confiabilidade operacional.
                  </p>

                  <ul className="space-y-3">
                    {highlights.map(item => (
                      <li
                        key={item}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200"
                      >
                        <span className="mt-0.5 rounded-full bg-cyan-400/15 p-1 text-cyan-200">
                          <Icon name="fas fa-check" aria-hidden="true" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-4 text-sm text-blue-100">
                    <p className="font-semibold text-white">Sugestão de navegação</p>
                    <p className="mt-1">
                      Abra o widget “Falar com Davi” no canto inferior direito para testar a
                      interação contextual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
