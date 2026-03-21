import Icon from '@/componentes/Icon'

/**
 * VantagemCompetitivaReal Component
 *
 * Seção destacada sobre a vantagem competitiva real do Mentor IA
 * - Separada do componente DadosExclusivos para poder ser movida independentemente
 * - Call to action final destacando os benefícios
 *
 * Design:
 * - Texto centralizado
 * - Gradiente no título (mesmo estilo do título principal)
 * - Ícone de troféu
 * - Lista de benefícios com checkmarks
 *
 * Performance:
 * - Server Component (não usa 'use client')
 * - Lazy loaded na página principal
 *
 * @returns {JSX.Element} Seção de vantagem competitiva real
 */
export default function VantagemCompetitivaReal() {
  return (
    <section className="py-20 px-4 lg:px-8">
      <div className="text-center">
        <Icon name="fas fa-trophy" className="text-yellow-400 text-4xl mb-4" />
        <h3 className="text-2xl lg:text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Valor técnico já demonstrado
          </span>
        </h3>
        <p className="text-lg text-gray-300 mb-6">
          O repositório já demonstra decisões úteis de produto e engenharia:
          <br />
          <span className="text-cyan-400 font-bold">UX guiada, validação de ações e resiliência operacional.</span>
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Icon name="fas fa-check-circle" className="text-green-400" />
          <span>Assistente contextual</span>
          <span className="mx-2">•</span>
          <Icon name="fas fa-check-circle" className="text-green-400" />
          <span>Fluxos validados</span>
          <span className="mx-2">•</span>
          <Icon name="fas fa-check-circle" className="text-green-400" />
          <span>Arquitetura resiliente</span>
        </div>
      </div>
    </section>
  )
}
