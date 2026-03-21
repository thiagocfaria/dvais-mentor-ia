import Icon from '@/componentes/Icon'
import dynamic from 'next/dynamic'

const MoedaGirando = dynamic(() => import('@/componentes/AnaliseTempoReal/MoedaGirando'), {
  ssr: false,
})

/**
 * VantagemCompetitiva Component
 *
 * Seção final que resume a vantagem competitiva do Mentor IA
 * - "Anos de Experiência em Segundos"
 * - "Calculamos Tudo Para Você"
 * - "Decisões Baseadas em Dados"
 * - "Sempre Atualizado"
 *
 * Design:
 * - Cards grandes e impactantes
 * - Frases de marketing fortes
 * - CTA final para conversão
 * - Gradientes e animações
 *
 * Performance:
 * - Server Component (não usa 'use client')
 * - Lazy loaded na página principal
 *
 * @returns {JSX.Element} Seção de vantagem competitiva
 */
export default function VantagemCompetitiva() {
  const vantagens = [
    {
      icon: 'fas fa-rocket',
      title: 'Curva de aprendizado reduzida',
      description:
        'A proposta do produto é condensar conceitos, explicações e fluxos operacionais em passos curtos e acionáveis.',
      benefit: 'Aprenda com menos atrito',
      gradient: 'from-blue-500/20 to-cyan-600/20',
      iconGradient: 'from-blue-400 to-cyan-500',
    },
    {
      icon: 'fas fa-calculator',
      title: 'Menos fricção operacional',
      description:
        'Validações, mensagens guiadas e componentes especializados reduzem esforço manual nas tarefas mais repetitivas da interface.',
      benefit: 'Use sua atenção no que importa',
      gradient: 'from-purple-500/20 to-blue-600/20',
      iconGradient: 'from-purple-400 to-blue-500',
    },
    {
      icon: 'fas fa-chart-bar',
      title: 'Decisões com mais contexto',
      description:
        'A interface foi pensada para apoiar clareza, contexto e compreensão dos próximos passos, com menos dependência de tentativa e erro.',
      benefit: 'Reduza ambiguidade operacional',
      gradient: 'from-cyan-500/20 to-green-600/20',
      iconGradient: 'from-cyan-400 to-green-500',
    },
    {
      icon: 'fas fa-sync',
      title: 'Base pronta para evolução',
      description:
        'A arquitetura já inclui espaço para iteração contínua em copy, regras e integrações, sem vender atualização automática nesta versão.',
      benefit: 'Evolua com segurança',
      gradient: 'from-orange-500/20 to-red-600/20',
      iconGradient: 'from-orange-400 to-red-500',
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Título da seção */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              O valor técnico da proposta
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            O foco aqui é demonstrar UX guiada, clareza de fluxo e base de engenharia reaproveitável
          </p>
        </div>

        {/* Grid de vantagens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {vantagens.map((vantagem, index) => (
            <div
              key={index}
              className="group relative glass-intense border border-blue-400/30 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-blue-400/60 hover:shadow-blue-500/30 card-glow-hover"
            >
              {/* Gradiente de fundo no hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${vantagem.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              ></div>

              {/* Content */}
              <div className="relative z-10 space-y-4">
                {/* Ícone */}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${vantagem.iconGradient} rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-4 glow-blue`}
                >
                  {vantagem.title === 'Anos de Experiência em Segundos' ? (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      {/* Ampulheta - relógio de areia - com areia em cima e embaixo */}
                      {/* Base superior */}
                      <rect x="8" y="2" width="8" height="1.8" rx="0.4" fill="currentColor" />
                      {/* Contorno do bulbo superior */}
                      <ellipse
                        cx="12"
                        cy="7"
                        rx="4.5"
                        ry="4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.8"
                        opacity="0.6"
                      />
                      {/* Areia no bulbo superior (apenas parte de cima, não toda) */}
                      <path
                        d="M 7.5 3.8 Q 7.5 5 12 6.5 Q 16.5 5 16.5 3.8 Q 16.5 3.8 12 3.8 Q 7.5 3.8 7.5 3.8 Z"
                        fill="currentColor"
                        opacity="0.9"
                      />
                      <ellipse
                        cx="12"
                        cy="5.5"
                        rx="3.5"
                        ry="2.5"
                        fill="currentColor"
                        opacity="0.8"
                      />
                      {/* Gargalo estreito no centro */}
                      <rect
                        x="11"
                        y="10.5"
                        width="2"
                        height="1.5"
                        fill="currentColor"
                        opacity="0.6"
                      />
                      {/* Linha de areia descendo pelo funil */}
                      <line
                        x1="12"
                        y1="10.5"
                        x2="12"
                        y2="12"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        opacity="0.9"
                      />
                      {/* Contorno do bulbo inferior */}
                      <ellipse
                        cx="12"
                        cy="15.5"
                        rx="4.5"
                        ry="4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.8"
                        opacity="0.6"
                      />
                      {/* Areia no bulbo inferior (acumulando embaixo) */}
                      <ellipse
                        cx="12"
                        cy="17.5"
                        rx="3.5"
                        ry="2"
                        fill="currentColor"
                        opacity="0.7"
                      />
                      <path
                        d="M 7.5 17.5 Q 7.5 18.5 12 19.2 Q 16.5 18.5 16.5 17.5 Q 16.5 17.5 12 17.5 Q 7.5 17.5 7.5 17.5 Z"
                        fill="currentColor"
                        opacity="0.8"
                      />
                      {/* Base inferior */}
                      <rect x="8" y="18.5" width="8" height="1.8" rx="0.4" fill="currentColor" />
                    </svg>
                  ) : vantagem.title === 'Calculamos Tudo Para Você' ? (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      {/* Calculadora comum - design simples e claro */}
                      {/* Corpo da calculadora */}
                      <rect
                        x="4"
                        y="3"
                        width="16"
                        height="18"
                        rx="1.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      {/* Tela/Display */}
                      <rect
                        x="6"
                        y="5"
                        width="12"
                        height="4"
                        rx="0.5"
                        fill="currentColor"
                        opacity="0.2"
                      />
                      {/* Linha na tela (simulando números) */}
                      <line
                        x1="7"
                        y1="7"
                        x2="17"
                        y2="7"
                        stroke="currentColor"
                        strokeWidth="0.8"
                        opacity="0.6"
                      />
                      {/* Botões - primeira linha */}
                      <circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="10.5" cy="11.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="13.5" cy="11.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="16.5" cy="11.5" r="1.2" fill="currentColor" opacity="0.8" />
                      {/* Botões - segunda linha */}
                      <circle cx="7.5" cy="14.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="10.5" cy="14.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="13.5" cy="14.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" opacity="0.8" />
                      {/* Botões - terceira linha */}
                      <circle cx="7.5" cy="17.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="10.5" cy="17.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="13.5" cy="17.5" r="1.2" fill="currentColor" opacity="0.8" />
                      <circle cx="16.5" cy="17.5" r="1.2" fill="currentColor" opacity="0.8" />
                    </svg>
                  ) : vantagem.title === 'Sempre Atualizado' ? (
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Seta circular de refresh/reload - representa atualização contínua */}
                      {/* Círculo quase completo */}
                      <path
                        d="M 12 2 A 10 10 0 0 1 22 12 A 10 10 0 0 1 12 22 A 10 10 0 0 1 2 12"
                        stroke="currentColor"
                        fill="none"
                      />
                      {/* Seta na ponta superior - seta triangular grande e bem visível (apontando para direita, sentido horário) */}
                      <path
                        d="M 12 2 L 18 0 L 16 6 Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                  ) : (
                    <Icon name={vantagem.icon} className="text-white text-2xl" />
                  )}
                </div>

                {/* Título */}
                <h3 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 group-hover:bg-clip-text transition-all duration-300">
                  {vantagem.title}
                </h3>

                {/* Descrição */}
                <p className="text-base text-gray-300 leading-relaxed">{vantagem.description}</p>

                {/* Benefício destacado */}
                <div className="pt-4 border-t border-blue-400/30">
                  <p className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                    <Icon name="fas fa-check-circle" className="text-green-400" />
                    {vantagem.benefit}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo final - flutuando no fundo (fora do container) */}
      <div className="max-w-4xl mx-auto space-y-8 text-center mt-16">
        {/* Ícone principal - Moeda girando */}
        <div className="flex justify-center">
          <MoedaGirando />
        </div>

        {/* Mensagem principal */}
        <h3 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
          Seu Lucro é o Nosso Sucesso
        </h3>

        <p className="text-xl text-gray-300 leading-relaxed">
          Não somos apenas uma plataforma de análise. Somos seu{' '}
          <span className="text-cyan-400 font-bold">parceiro</span> na jornada de investimentos.
          <br />
          Seu rendimento é o nosso resultado.
        </p>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
            <div className="text-sm text-gray-400">Suporte e Análise</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-cyan-400 mb-2">100%</div>
            <div className="text-sm text-gray-400">Automatizado</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">∞</div>
            <div className="text-sm text-gray-400">Atualizações</div>
          </div>
        </div>

        {/* CTA final */}
        <div className="pt-8">
          <a
            href="/login"
            className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 hover:scale-105 hover:from-blue-500 hover:to-cyan-400"
          >
            <Icon name="fas fa-rocket" className="text-2xl" />
            <span>Comece a Investir com Inteligência</span>
          </a>
          <p className="text-sm text-gray-500 mt-4">Cadastro gratuito • Sem cartão de crédito</p>
        </div>
      </div>
    </section>
  )
}
