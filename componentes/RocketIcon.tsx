import { useId } from 'react'

type RocketIconProps = {
  className?: string
}

/**
 * RocketIcon
 *
 * Ícone de foguete reutilizável (mesmo estilo do botão da Home).
 * Server Component - IDs únicos usando timestamp para evitar colisão.
 */
export default function RocketIcon({ className = '' }: RocketIconProps) {
  const uid = useId().replace(/:/g, '')

  const rocketBodyId = `${uid}-rocketBody`
  const rocketNoseId = `${uid}-rocketNose`
  const platformId = `${uid}-platform`
  const glowId = `${uid}-glow`

  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={rocketBodyId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={rocketNoseId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={platformId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4b5563" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1f2937" stopOpacity="0.9" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Plataforma de lançamento - estilo SpaceX */}
      <rect x="4" y="20" width="16" height="2" rx="0.5" fill={`url(#${platformId})`} />
      <rect x="6" y="21" width="12" height="1" fill="#374151" opacity="0.8" />
      <line x1="8" y1="20" x2="8" y2="22" stroke="#6b7280" strokeWidth="0.5" opacity="0.6" />
      <line x1="12" y1="20" x2="12" y2="22" stroke="#6b7280" strokeWidth="0.5" opacity="0.6" />
      <line x1="16" y1="20" x2="16" y2="22" stroke="#6b7280" strokeWidth="0.5" opacity="0.6" />

      {/* Fogo e fumaça - animação no hover (controlada via CSS em globals.css) */}
      <g className="rocket-fire" style={{ opacity: 0, transition: 'opacity 0.3s ease' }}>
        {/* Fumaça */}
        <ellipse
          cx="8"
          cy="20"
          rx="2"
          ry="1.5"
          fill="#9ca3af"
          opacity="0.8"
          className="animate-smoke-rise"
        />
        <ellipse
          cx="10"
          cy="20"
          rx="2"
          ry="1.5"
          fill="#6b7280"
          opacity="0.7"
          className="animate-smoke-rise smoke-delay-1"
        />
        <ellipse
          cx="12"
          cy="20"
          rx="3"
          ry="2"
          fill="#4b5563"
          opacity="0.7"
          className="animate-smoke-rise smoke-delay-2"
        />
        <ellipse
          cx="14"
          cy="20"
          rx="2"
          ry="1.5"
          fill="#6b7280"
          opacity="0.7"
          className="animate-smoke-rise smoke-delay-3"
        />
        <ellipse
          cx="16"
          cy="20"
          rx="2"
          ry="1.5"
          fill="#9ca3af"
          opacity="0.8"
          className="animate-smoke-rise smoke-delay-4"
        />

        {/* Chama */}
        <path
          d="M8 20 Q9 17 10 20 Q11 15 12 20 Q13 15 14 20 Q15 17 16 20"
          fill="#fbbf24"
          opacity="1"
          filter={`url(#${glowId})`}
          className="animate-fire-flicker"
        />
        <path
          d="M9 20 Q10 18 11 20 Q12 16 13 20 Q14 18 15 20"
          fill="#f59e0b"
          opacity="0.95"
          className="animate-fire-flicker fire-delay-1"
        />
        <path
          d="M9.5 20 Q10.5 19 11.5 20 Q12 17 12.5 20 Q13.5 19 14.5 20"
          fill="#dc2626"
          opacity="0.9"
          className="animate-fire-flicker fire-delay-2"
        />
        <path
          d="M10 20 Q11 19.5 12 20"
          fill="#ef4444"
          opacity="0.85"
          className="animate-fire-flicker fire-delay-3"
        />
      </g>

      {/* Corpo principal do foguete - estilo Falcon 9 */}
      <rect x="10" y="6" width="4" height="14" rx="0.5" fill="currentColor" opacity="0.95" />
      <rect x="10" y="6" width="4" height="14" rx="0.5" fill={`url(#${rocketBodyId})`} />

      {/* Ponta cônica do foguete */}
      <path d="M12 2 L10 6 L14 6 Z" fill="currentColor" opacity="0.98" />
      <path d="M12 2 L10 6 L12 5.5 Z" fill={`url(#${rocketNoseId})`} />

      {/* Aletas laterais - estilo Falcon 9 */}
      <path d="M10 18 L8 22 L10 22 L10.5 20 Z" fill="currentColor" opacity="0.9" />
      <path d="M14 18 L16 22 L14 22 L13.5 20 Z" fill="currentColor" opacity="0.9" />

      {/* Linhas horizontais - detalhes do foguete */}
      <line x1="10" y1="8" x2="14" y2="8" stroke="#ffffff" strokeWidth="0.3" opacity="0.4" />
      <line x1="10" y1="12" x2="14" y2="12" stroke="#ffffff" strokeWidth="0.3" opacity="0.4" />
      <line x1="10" y1="16" x2="14" y2="16" stroke="#ffffff" strokeWidth="0.3" opacity="0.4" />

      {/* Logo/Janela circular */}
      <circle cx="12" cy="10" r="1.2" fill="#60a5fa" opacity="0.9" />
      <circle cx="12" cy="10" r="0.8" fill="#93c5fd" opacity="0.7" />
    </svg>
  )
}
