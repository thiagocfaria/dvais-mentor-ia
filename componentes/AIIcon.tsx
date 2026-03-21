import Image from 'next/image'

interface AIIconProps {
  size?: number
  imageSrc?: string
}

/**
 * AIIcon Component
 *
 * Componente para exibir ícone de cabeça de IA
 * - Suporta imagem externa (preferencial) ou SVG estático
 * - Otimizado com next/image para melhor performance
 * - Server Component (compatível com App Router)
 *
 * Performance:
 * - Server Component (menor bundle)
 * - SVG estático em arquivo separado (cacheável)
 * - next/image para otimização automática de imagens
 *
 * @param {number} size - Tamanho do ícone em pixels (padrão: 80)
 * @param {string} imageSrc - URL da imagem externa (opcional)
 *
 * @returns {JSX.Element} Ícone de cabeça de IA
 */
export default function AIIcon({ size = 80, imageSrc }: AIIconProps) {
  // Se tiver imagem, usar ela (muito mais realista) - OTIMIZADO com next/image
  if (imageSrc) {
    return (
      <div
        className="relative flex items-center justify-center ai-head-container"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: 'none',
          transition: 'none',
        }}
      >
        <div
          className="relative rounded-xl overflow-visible ai-head-image-wrapper"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: 'transparent',
            isolation: 'isolate',
          }}
        >
          <Image
            src={imageSrc}
            alt="AI Head"
            width={size}
            height={size}
            className="object-contain object-center w-full h-full ai-head-img"
            style={{
              filter:
                'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5)) brightness(1.1) contrast(1.2) saturate(1.15)',
              mixBlendMode: 'normal',
              imageRendering: 'auto',
              display: 'block',
              position: 'relative',
              zIndex: 1,
            }}
            priority={false} // Lazy loading (não é crítico)
            quality={85} // Balance qualidade/tamanho
            onLoad={() => {}}
            onError={e => {
              console.error('Erro ao carregar imagem:', imageSrc)
              e.currentTarget.style.display = 'none'
            }}
          />

          {/* Overlay para remover fundo escuro */}
          <div
            className="absolute inset-0 pointer-events-none ai-bg-remover"
            style={{
              background:
                'radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
              mixBlendMode: 'screen',
              opacity: 0.8,
              zIndex: 2,
            }}
          />

          {/* Máscara para remover fundo escuro */}
          <div
            className="absolute inset-0 pointer-events-none ai-bg-mask"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 100%)',
              mixBlendMode: 'multiply',
              opacity: 0.6,
              zIndex: 3,
            }}
          />
        </div>
      </div>
    )
  }

  // SVG estático (fallback quando não há imageSrc)
  return (
    <div
      className="relative flex items-center justify-center ai-head-container"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: 'none',
        transition: 'none',
      }}
    >
      <Image
        src="/ai-icon.svg"
        alt="AI Head"
        width={size}
        height={size}
        className="ai-head-svg"
        style={{
          filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))',
        }}
        priority={false}
      />
    </div>
  )
}
