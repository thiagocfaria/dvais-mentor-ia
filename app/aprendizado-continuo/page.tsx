import type { Metadata } from 'next'
import Icon from '@/componentes/Icon'

export const metadata: Metadata = {
  title: 'Aprendizado Contínuo | DVAi$ - Mentor IA',
  description:
    'IA que aprende com você e com o mercado — para orientar decisões mais conscientes. Educação prática e personalização contínua, sem promessas de retorno.',
  keywords: [
    'aprendizado contínuo',
    'educação financeira',
    'IA investimentos',
    'personalização',
    'alertas',
    'gestão de risco',
  ],
  alternates: { canonical: '/aprendizado-continuo' },
  openGraph: {
    title: 'Aprendizado Contínuo | DVAi$ - Mentor IA',
    description:
      'IA que aprende com você e com o mercado — para orientar decisões mais conscientes.',
    type: 'website',
    url: '/aprendizado-continuo',
  },
}

type Card = { icon: string; title: string; description: string }

function InfoCard({ icon, title, description }: Card) {
  return (
    <div className="group relative glass-intense border border-blue-400/20 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-cyan-400/40 hover:shadow-cyan-500/20 card-glow-hover">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 space-y-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
          <Icon name={icon} className="text-white text-xl" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function AprendizadoContinuoPage() {
  const voceAprende: Card[] = [
    {
      icon: 'fas fa-graduation-cap',
      title: 'Glossário e explicações por contexto',
      description:
        'Cada botão e funcionalidade traz explicações simples, diretas e aplicáveis no momento da ação.',
    },
    {
      icon: 'fas fa-play',
      title: 'Simuladores de plataforma',
      description:
        'Ensinamos você a usar simuladores de plataforma para aprender fazendo de forma responsável, com cenários reais e práticos que treinam disciplina e leitura de contexto.',
    },
    {
      icon: 'fas fa-bullseye',
      title: 'Rotina guiada (progressiva)',
      description:
        'Do básico ao avançado, com passos curtos e consistentes para criar hábitos e reduzir erro operacional.',
    },
  ]

  const realidade: Card[] = [
    {
      icon: 'fas fa-user-plus',
      title: 'Preferências e objetivos',
      description:
        'Prazo, foco e tolerância a risco orientam sugestões e checklists de forma personalizada.',
    },
    {
      icon: 'fas fa-lock',
      title: 'Rotina financeira (opcional)',
      description:
        'Você escolhe o que informar. Sem credenciais de corretora e sem custódia (não guardamos seus ativos) — apenas contexto para orientar melhor.',
    },
    {
      icon: 'fas fa-clock',
      title: 'Alertas comportamentais',
      description:
        'Linguagem cuidadosa para sugerir pausas e reduzir exposição quando você sinaliza pressa, estresse ou incerteza.',
    },
  ]

  const mercado: Card[] = [
    {
      icon: 'fas fa-bolt',
      title: 'Adaptação de contexto',
      description:
        'A proposta de produto considera sinais de contexto e linguagem do usuário para ajustar explicações, prioridade e profundidade da orientação.',
    },
    {
      icon: 'fas fa-chart-bar',
      title: 'Ajuste ao perfil informado',
      description:
        'Objetivos, preferências e nível de experiência ajudam a modular a interface e os exemplos apresentados ao usuário.',
    },
    {
      icon: 'fas fa-sync-alt',
      title: 'Evolução orientada por iteração',
      description:
        'O protótipo evolui a partir de feedback, testes e ajustes de copy, sem prometer atualização automática de mercado nesta versão pública.',
    },
  ]

  const exemplos = [
    {
      title: 'Mercado volátil + perfil conservador',
      text: 'Orientação: reduzir exposição, priorizar segurança e reforçar limites antes de novas entradas.',
      icon: 'fas fa-shield-alt',
    },
    {
      title: 'Objetivo de curto prazo',
      text: 'Orientação: foco em proteção e previsibilidade, com decisões alinhadas ao seu prazo e à sua rotina.',
      icon: 'fas fa-calendar-check',
    },
  ]

  return (
    <>
      <main className="min-h-screen" style={{ paddingTop: '140px', paddingBottom: '120px' }}>
        {/* HERO */}
        <section id="aprendizado-hero" className="py-20 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <Icon
                  name="fas fa-graduation-cap"
                  className="text-white text-4xl"
                  aria-hidden="true"
                />
              </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Aprendizado Contínuo
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              IA que aprende com o uso da interface e com o contexto informado para orientar decisões mais conscientes.
            </p>
          </div>
        </section>

        {/* Seção 1 */}
        <section className="py-20 px-4 lg:px-8" aria-labelledby="voce-aprende">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="voce-aprende" className="text-3xl lg:text-5xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Você aprende fazendo
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Educação prática para reduzir erros e aumentar clareza — passo a passo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {voceAprende.map(c => (
                <InfoCard key={c.title} {...c} />
              ))}
            </div>
          </div>
        </section>

        {/* Seção 2 */}
        <section className="py-20 px-4 lg:px-8" aria-labelledby="aprende-realidade">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="aprende-realidade" className="text-3xl lg:text-5xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  A plataforma aprende com a sua realidade
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Personalização com controle e consentimento — você decide o que compartilhar.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {realidade.map(c => (
                <InfoCard key={c.title} {...c} />
              ))}
            </div>
          </div>
        </section>

        {/* Seção 3 */}
        <section className="py-20 px-4 lg:px-8" aria-labelledby="aprende-mercado">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="aprende-mercado" className="text-3xl lg:text-5xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  A plataforma se adapta ao mercado
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Ajustes contínuos de contexto para manter consistência e disciplina.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {mercado.map(c => (
                <InfoCard key={c.title} {...c} />
              ))}
            </div>
          </div>
        </section>

        {/* Transparência e exemplos */}
        <section className="py-20 px-4 lg:px-8" aria-labelledby="transparencia-controle">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="transparencia-controle" className="text-3xl lg:text-5xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Transparência e controle
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Método, clareza e segurança — para simplificar suas decisões financeiras.
              </p>
            </div>

            <div className="glass-intense border border-white/10 rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto">
              <ul className="space-y-3">
                {[
                  'Você controla o que compartilha (com consentimento).',
                  'Não somos corretora.',
                  'Não fazemos custódia (não guardamos seu dinheiro).',
                  'Sem promessas de retorno: orientação educacional e automatizada.',
                ].map(t => (
                  <li key={t} className="flex items-start gap-3">
                    <Icon
                      name="fas fa-check"
                      className="text-cyan-400 mt-1 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-gray-300">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {exemplos.map(e => (
                <div
                  key={e.title}
                  className="group relative glass-intense border border-cyan-400/20 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-cyan-400/40 hover:shadow-cyan-500/20 card-glow-hover"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start gap-3">
                      <Icon name={e.icon} className="text-cyan-300 mt-1" aria-hidden="true" />
                      <div>
                        <h3 className="text-lg font-bold text-white">{e.title}</h3>
                        <p className="text-gray-300 leading-relaxed">{e.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Funcionamento */}
        <section
          id="funcionamento"
          className="py-20 px-4 lg:px-8 scroll-mt-24"
          aria-labelledby="funcionamento-title"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="funcionamento-title" className="text-3xl lg:text-5xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Ver funcionamento
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Resumo visual do fluxo de aprendizado com foco em clareza e performance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              <div className="group relative glass-intense border border-white/10 rounded-2xl p-8 shadow-2xl card-glow-hover overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-60" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full text-sm text-blue-300 mb-6">
                      <Icon name="fas fa-play" className="text-blue-300" aria-hidden="true" />
                      Explicacao visual leve
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Demonstração do aprendizado
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      Este bloco resume a proposta de aprendizado continuo com uma apresentacao
                      leve, sem iframes e sem midia pesada, preservando a experiencia inicial.
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Icon name="fas fa-play" className="text-white text-xl" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-gray-400">
                      Painel textual pensado para explicar a proposta sem degradar carregamento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-intense border border-blue-400/15 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">O que você ganha com isso</h3>
                <ul className="space-y-4">
                  {[
                    'Clareza: explicações no momento da decisão.',
                    'Disciplina: checklists e alertas para reduzir impulso.',
                    'Personalização: orientações alinhadas ao seu contexto.',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-3">
                      <Icon
                        name="fas fa-check-circle"
                        className="text-cyan-400 mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-gray-300 leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 p-5 rounded-xl border border-white/10 bg-blue-500/5">
                  <div className="flex items-start gap-3">
                    <Icon
                      name="fas fa-shield-alt"
                      className="text-cyan-300 mt-1"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-gray-300">
                      Sem promessas de retorno. A ferramenta apoia com estrutura e transparência — a
                      decisão final é sempre sua.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
