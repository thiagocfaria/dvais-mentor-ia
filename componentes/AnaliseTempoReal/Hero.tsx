import Icon from '@/componentes/Icon'

export default function AnaliseHero() {
  return (
    <section className="py-20 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 animate-pulse-slow">
              <Icon name="fas fa-chart-line" className="text-white text-4xl" />
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Contexto e Operação Guiada
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Demonstração de como o projeto organiza contexto, orientação e leitura de interface.
            <br />
            <span className="text-blue-400 font-semibold">
              Sem prometer sinais de mercado em tempo real ou automação de corretoras.
            </span>
          </p>

          <div className="space-y-6 max-w-5xl mx-auto mt-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-white text-center">
              O que esta página demonstra
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed text-center">
              O{' '}
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                DVAi$ - Mentor IA
              </span>{' '}
              usa esta seção para explicar o racional do produto, os sinais de contexto usados pelo
              assistente e o tipo de apoio que uma interface guiada pode oferecer.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed text-center">
              <span className="text-xl lg:text-2xl font-bold text-white">Escopo desta demo:</span>{' '}
              orientar navegação, explicar áreas públicas, demonstrar validação de ações e expor a
              abordagem de UX assistida usada no projeto.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <a
                href="/cadastro"
                className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden w-full sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400/40 via-cyan-300/40 to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <Icon
                  name="fas fa-rocket"
                  className="relative z-10 w-5 h-5 transform group-hover:-translate-y-1 transition-all duration-300"
                  aria-hidden="true"
                />
                <span className="relative z-10">Abrir demonstração</span>
              </a>

              <a
                href="/seguranca"
                className="group px-10 py-5 border-2 border-blue-400/50 text-blue-300 rounded-xl font-semibold hover:bg-blue-500/20 hover:border-blue-400 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm relative overflow-hidden w-full sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <Icon name="fas fa-shield-alt" className="relative z-10 w-4 h-4 flex-shrink-0" />
                <span className="relative z-10">Ver limites e proteção</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
