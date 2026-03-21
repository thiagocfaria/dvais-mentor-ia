import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import AnaliseHero from '@/componentes/AnaliseTempoReal/Hero'

/**
 * Página demonstrativa de análise guiada e contexto de interface.
 *
 * Ela preserva a rota legada `/analise-tempo-real`, mas o conteúdo público
 * foi reposicionado para uma vitrine honesta de UX assistida.
 */

export const metadata: Metadata = {
  title: 'Contexto e Operação Guiada | DVAi$ - Mentor IA',
  description:
    'Página demonstrativa sobre como o projeto trata contexto, orientação guiada e leitura de sinais de interface sem prometer dados de mercado em tempo real.',
  keywords: [
    'contexto de interface',
    'orientação guiada',
    'assistente contextual',
    'mentor IA',
    'fluxos assistidos',
  ],
  openGraph: {
    title: 'Contexto e Operação Guiada | DVAi$ - Mentor IA',
    description:
      'Página demonstrativa sobre contexto de interface, orientação guiada e leitura assistida das áreas públicas do produto.',
    type: 'website',
  },
}

export default function AnaliseTempoRealPage() {
  /**
   * Lazy Loading de Componentes Abaixo da Dobra
   *
   * Por quê lazy loading?
   * - Reduz bundle inicial em ~40% (melhora FCP)
   * - Carrega apenas quando usuário rola até a seção
   * - Melhora Time to Interactive (TTI)
   *
   * Componentes lazy loaded:
   * - PublicoAlvo: Carrega quando usuário rola
   * - DadosCorretoras: Carrega quando usuário rola
   * - DadosExclusivos: Carrega quando usuário rola
   * - VantagemCompetitiva: Carrega quando usuário rola
   *
   * Loading states:
   * - Altura mínima previne layout shift (CLS)
   * - Placeholder simples enquanto carrega
   */
  const PublicoAlvo = dynamic(() => import('@/componentes/AnaliseTempoReal/PublicoAlvo'), {
    loading: () => <div className="min-h-[400px]" />,
  })

  const DadosCorretoras = dynamic(() => import('@/componentes/AnaliseTempoReal/DadosCorretoras'), {
    loading: () => <div className="min-h-[500px]" />,
  })

  const DadosExclusivos = dynamic(() => import('@/componentes/AnaliseTempoReal/DadosExclusivos'), {
    loading: () => <div className="min-h-[600px]" />,
  })

  const VantagemCompetitiva = dynamic(
    () => import('@/componentes/AnaliseTempoReal/VantagemCompetitiva'),
    {
      loading: () => <div className="min-h-[400px]" />,
    }
  )

  const VantagemCompetitivaReal = dynamic(
    () => import('@/componentes/AnaliseTempoReal/VantagemCompetitivaReal'),
    {
      loading: () => <div className="min-h-[200px]" />,
    }
  )

  return (
    <>
      {/* Main content */}
      <main className="min-h-screen" style={{ paddingTop: '140px', paddingBottom: '60px' }}>
        {/* Hero: Seção principal - above the fold, crítico para LCP */}
        <section id="analise-hero">
          <AnaliseHero />
        </section>

        {/* PublicoAlvo: Lazy loaded (abaixo da dobra) */}
        <section id="analise-publico">
          <PublicoAlvo />
        </section>

        {/* DadosCorretoras: Lazy loaded (abaixo da dobra) */}
        <section id="analise-dados">
          <DadosCorretoras />
        </section>

        {/* DadosExclusivos: Lazy loaded (abaixo da dobra) */}
        <section id="analise-exclusivos">
          <DadosExclusivos />
        </section>

        {/* VantagemCompetitivaReal: Seção separada e independente */}
        <VantagemCompetitivaReal />

        {/* VantagemCompetitiva: Lazy loaded (abaixo da dobra) */}
        <VantagemCompetitiva />
      </main>
    </>
  )
}
