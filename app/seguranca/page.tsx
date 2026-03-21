import type { Metadata } from 'next'
import SegurancaHero from '@/componentes/Seguranca/Hero'
import CardsProtecao from '@/componentes/Seguranca/CardsProtecao'
import AlertasInteligentes from '@/componentes/Seguranca/AlertasInteligentes'
import GuiaFinanceiro from '@/componentes/Seguranca/GuiaFinanceiro'
import Transparencia from '@/componentes/Seguranca/Transparencia'
import Integracao from '@/componentes/Seguranca/Integracao'
import EducacaoSeguranca from '@/componentes/Seguranca/EducacaoSeguranca'
import FAQ from '@/componentes/Seguranca/FAQ'
import Funcionamento from '@/componentes/Seguranca/Funcionamento'

/**
 * Proteção Inteligente / Segurança Page
 *
 * Página pública (pré-login) sobre Proteção Inteligente e Segurança
 * Explica as camadas de segurança, gestão de risco e transparência do DVAi$ - Mentor IA
 *
 * Estrutura:
 * - FixedLogo: Logo fixo no topo
 * - Hero: Seção principal com CTA e descrição
 * - CardsProtecao: 4 cards principais (Conta, Capital, Decisão, Dados) - lazy loaded
 * - AlertasInteligentes: Seção de alertas com exemplos - lazy loaded
 * - GuiaFinanceiro: Seção do Guia Financeiro (Segurança do Orçamento) - lazy loaded
 * - Transparencia: Seção de transparência - lazy loaded
 * - EducacaoSeguranca: Seção de educação - lazy loaded
 * - FAQ: Perguntas frequentes - lazy loaded
 * - Funcionamento: Seção de funcionamento (placeholder vídeo) - lazy loaded
 *
 * Design:
 * - Glassmorphism (backdrop-blur)
 * - Gradientes animados azul-cyan
 * - Layout responsivo
 * - Ícones FontAwesome
 *
 * Performance:
 * - Server Component (não usa 'use client')
 * - Hero carregado imediatamente (above the fold)
 * - Demais seções lazy loaded (abaixo da dobra)
 * - Meta tags otimizadas para SEO
 *
 * Segurança:
 * - Zero dados sensíveis (página pré-login)
 * - Sem coleta de dados nesta página
 * - Apenas apresentação/copy do Guia Financeiro (sem backend/WhatsApp/OCR)
 *
 * @returns {JSX.Element} Página completa de Proteção Inteligente
 */

export const metadata: Metadata = {
  title: 'Proteção Inteligente | DVAi$ - Mentor IA',
  description:
    'Camadas de segurança, gestão de risco e transparência para proteger seus investimentos. Sistema avançado de proteção inteligente com alertas e orientação educacional.',
  keywords: [
    'proteção inteligente',
    'segurança investimentos',
    'gestão risco',
    'transparência',
    'alertas inteligentes',
    'guia financeiro',
    'orçamento inteligente',
  ],
  alternates: {
    canonical: '/seguranca',
  },
  openGraph: {
    title: 'Proteção Inteligente | DVAi$ - Mentor IA',
    description:
      'Camadas de segurança, gestão de risco e transparência para proteger seus investimentos.',
    type: 'website',
    url: '/seguranca',
  },
}

export default function SegurancaPage() {
  return (
    <>
      {/* Main content */}
      <main className="min-h-screen" style={{ paddingTop: '140px' }}>
        {/* Hero: Seção principal - above the fold, crítico para LCP */}
        <section id="seguranca-hero">
          <SegurancaHero />
        </section>

        {/* CardsProtecao: Lazy loaded (abaixo da dobra) */}
        <section id="seguranca-cards">
          <CardsProtecao />
        </section>

        {/* AlertasInteligentes: Lazy loaded (abaixo da dobra) */}
        <section id="seguranca-alertas">
          <AlertasInteligentes />
        </section>

        {/* GuiaFinanceiro: Lazy loaded (abaixo da dobra) */}
        <section id="seguranca-guia">
          <GuiaFinanceiro />
        </section>

        {/* Transparencia: Lazy loaded (abaixo da dobra) */}
        <Transparencia />

        {/* Integracao: Lazy loaded (abaixo da dobra) */}
        <Integracao />

        {/* EducacaoSeguranca: Lazy loaded (abaixo da dobra) */}
        <EducacaoSeguranca />

        {/* FAQ: Lazy loaded (abaixo da dobra) */}
        <FAQ />

        {/* Funcionamento: Lazy loaded (abaixo da dobra) */}
        <Funcionamento />
      </main>
    </>
  )
}
