import Icon from '@/componentes/Icon'
import RocketIcon from '@/componentes/RocketIcon'

/**
 * Hero Component - Proteção Inteligente
 *
 * Seção principal da página de Proteção Inteligente
 * - Título impactante com gradiente
 * - Descrição sobre camadas de segurança, gestão de risco e transparência
 * - Dois botões CTA: "Começar Agora" (com foguete) e "Ver Funcionamento"
 * - Ícone de segurança (escudo)
 *
 * Design:
 * - Glassmorphism (backdrop-blur)
 * - Gradientes animados azul-cyan
 * - Layout responsivo
 * - Animações hover nos botões (CSS puro)
 *
 * Performance:
 * - Server Component (compatível com App Router)
 * - Não lazy loaded (above the fold, crítico para LCP)
 * - Animações via CSS (sem JavaScript)
 *
 * @returns {JSX.Element} Hero da página de Proteção Inteligente
 */
export default function SegurancaHero() {
  return (
    <section className="py-20 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          {/* Ícone principal */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/40 animate-pulse-slow">
              <Icon name="fas fa-shield-alt" className="text-white text-4xl" />
            </div>
          </div>

          {/* Título principal com gradiente */}
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
              Proteção Inteligente
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Camadas de segurança, gestão de risco e transparência para proteger seus investimentos.
            <br />
            <span className="text-cyan-400 font-semibold">
              Investir com confiança é investir com proteção.
            </span>
          </p>

          {/* Descrição principal */}
          <div className="space-y-6 max-w-5xl mx-auto mt-12">
            <p className="text-lg text-gray-300 leading-relaxed text-center">
              O{' '}
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
                DVAi$ - Mentor IA
              </span>{' '}
              foi desenvolvido com foco em{' '}
              <span className="text-cyan-400 font-semibold">
                segurança, transparência e educação
              </span>
              . Não fazemos custódia e não prometemos lucro, mas prometemos te orientar a investir
              com técnicas avançadas usadas pelos melhores. Nossa missão é orientar você com base em
              boas práticas e análise educacional.{' '}
              <span className="text-cyan-400 font-semibold">Seu Lucro é o nosso sucesso.</span>
            </p>
          </div>

          {/* Botões CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            {/* Botão Começar Agora */}
            <a
              href="/login"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-base shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/40 via-cyan-300/40 to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"></div>
              <RocketIcon className="relative z-10 w-6 h-6 transform group-hover:translate-y-[-4px] transition-all duration-500 flex-shrink-0" />
              <span className="relative z-10">Começar Agora</span>
            </a>

            {/* Botão Ver Funcionamento */}
            <a
              href="#funcionamento"
              className="group px-10 py-5 border-2 border-cyan-400/50 text-cyan-300 rounded-xl font-semibold hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm relative overflow-hidden w-full sm:w-auto"
              aria-label="Ver funcionamento"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"></span>

              {/* Ícone pequeno - desaparece no hover */}
              <Icon
                name="fas fa-play"
                className="relative z-10 transform group-hover:scale-0 group-hover:opacity-0 transition-all duration-300 flex-shrink-0 w-4 h-4"
              />

              {/* Texto "Ver Funcionamento" - desaparece no hover */}
              <span className="relative z-10 group-hover:opacity-0 group-hover:scale-0 transition-all duration-300">
                Ver Funcionamento
              </span>

              {/* Botão de player grande - aparece no hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300 z-20 pointer-events-none">
                <div className="relative">
                  {/* Círculo de fundo com brilho */}
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl group-hover:animate-pulse"></div>
                  {/* Ícone de play grande */}
                  <div className="relative bg-cyan-500/30 backdrop-blur-sm rounded-full p-4 border-2 border-cyan-400/50 group-hover:border-cyan-400 transition-all duration-300">
                    <Icon
                      name="fas fa-play"
                      className="text-3xl text-cyan-300 transform translate-x-0.5 group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Badge de destaque */}
      <div className="flex items-center justify-center gap-2 mt-16 mb-12">
        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full">
          <Icon name="fas fa-shield-alt" className="text-cyan-400" />
          <span className="text-sm text-gray-300">
            Proteção Inteligente • Transparência Total • Sem Custódia
          </span>
        </div>
      </div>
    </section>
  )
}
