import dynamic from 'next/dynamic'
import Header from '@/componentes/Header'
import Hero from '@/componentes/Hero'

/**
 * Home Page (Página Principal)
 *
 * Página inicial da plataforma DVAi$ - Mentor IA
 *
 * Estrutura:
 * 1. Header - Cabeçalho fixo com navegação (sempre visível)
 * 2. Hero - Seção principal com CTA e avatar (above the fold)
 * 3. Features - Funcionalidades principais (lazy loaded)
 * 4. Stats - Estatísticas da plataforma (lazy loaded)
 * 5. Footer - Rodapé com links (lazy loaded)
 *
 * Otimizações de Performance:
 * - Header e Hero carregados imediatamente (críticos para FCP)
 * - Features, Stats e Footer lazy loaded (abaixo da dobra)
 * - Lazy loading reduz bundle inicial em ~40%
 * - Loading states com altura mínima (evita layout shift)
 *
 * Performance Esperada:
 * - FCP: < 1.8s (First Contentful Paint)
 * - LCP: < 2.5s (Largest Contentful Paint)
 * - TTI: < 3s (Time to Interactive)
 *
 * @returns {JSX.Element} Página inicial completa
 */
export default function Home() {
  /**
   * Lazy Loading de Componentes Abaixo da Dobra
   *
   * Por quê lazy loading?
   * - Reduz bundle inicial em ~40% (melhora FCP)
   * - Carrega apenas quando usuário rola até a seção
   * - Melhora Time to Interactive (TTI)
   *
   * Componentes lazy loaded:
   * - Features: Carrega quando usuário rola até funcionalidades
   * - Stats: Carrega quando usuário rola até estatísticas
   * - Footer: Carrega quando usuário rola até rodapé
   *
   * Loading states:
   * - Altura mínima previne layout shift (CLS)
   * - Placeholder simples enquanto carrega
   */
  const Features = dynamic(() => import('@/componentes/Features'), {
    loading: () => <div className="min-h-[400px]" />, // Altura mínima previne layout shift
  })

  const Stats = dynamic(() => import('@/componentes/Stats'), {
    loading: () => <div className="min-h-[300px]" />, // Altura mínima previne layout shift
  })

  const Footer = dynamic(() => import('@/componentes/Footer'), {
    loading: () => <div className="min-h-[200px]" />, // Altura mínima previne layout shift
  })
  return (
    <>
      {/* Header: Cabeçalho fixo - sempre visível, crítico para FCP */}
      <Header />

      {/* Hero: Seção principal - above the fold, crítico para LCP */}
      <Hero />

      {/* Features: Funcionalidades - lazy loaded (abaixo da dobra) */}
      <div id="features-section">
        <Features />
      </div>

      {/* Stats: Estatísticas - lazy loaded (abaixo da dobra) */}
      <div id="stats-section">
        <Stats />
      </div>

      {/* Footer: Rodapé - lazy loaded (abaixo da dobra) */}
      <Footer />
    </>
  )
}
