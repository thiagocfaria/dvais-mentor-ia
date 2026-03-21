import { calculatePasswordStrength } from '@/biblioteca/auth/validation-password'
import type { PasswordStrengthProps } from '@/tipos/auth'

/**
 * PasswordStrength Component
 *
 * Componente para exibir força da senha
 * - Calcula força baseado em requisitos
 * - Exibe barra visual e feedback
 * - Server Component (compatível com App Router)
 *
 * Performance:
 * - Server Component (menor bundle)
 * - Função pura `calculatePasswordStrength` (sem hooks)
 * - Pode ser usado dentro de Client Components
 *
 * @param {string} password - Senha a ser analisada
 * @param {boolean} showFeedback - Mostrar feedback detalhado
 * @param {boolean} showScore - Mostrar pontuação numérica
 * @param {number} minScore - Pontuação mínima aceitável
 *
 * @returns {JSX.Element | null} Componente de força de senha ou null se senha vazia
 */
export default function PasswordStrength({
  password,
  showFeedback = true,
  showScore = false,
  minScore = 60,
}: PasswordStrengthProps) {
  const strength = calculatePasswordStrength(password)

  // Não mostrar nada se senha vazia
  if (!password || password.length === 0) {
    return null
  }

  // Cores baseadas no nível
  const colors = {
    weak: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      bar: 'bg-red-500',
    },
    medium: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400',
      bar: 'bg-yellow-500',
    },
    strong: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      bar: 'bg-blue-500',
    },
    'very-strong': {
      bg: 'bg-green-500/20',
      border: 'border-green-500/50',
      text: 'text-green-400',
      bar: 'bg-green-500',
    },
  }

  const color = colors[strength.level]
  const labels = {
    weak: 'Fraca',
    medium: 'Média',
    strong: 'Forte',
    'very-strong': 'Muito Forte',
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de força */}
      <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color.bar} transition-all duration-300 ease-out`}
          style={{ width: `${strength.score}%` }}
        />
      </div>

      {/* Label e score */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${color.text}`}>Senha: {labels[strength.level]}</span>
        {showScore && <span className="text-gray-400">{strength.score}/100</span>}
      </div>

      {/* Feedback detalhado */}
      {showFeedback && strength.feedback.length > 0 && (
        <div className={`p-3 rounded-lg border ${color.bg} ${color.border}`}>
          <p className="text-xs font-medium text-gray-300 mb-2">Para melhorar sua senha:</p>
          <ul className="text-xs space-y-1">
            {strength.feedback.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-400">
                <span className={color.text}>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aviso se senha muito fraca */}
      {strength.score < minScore && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs text-red-400">
            ⚠️ Sua senha é muito fraca. Escolha uma senha mais forte para proteger sua conta.
          </p>
        </div>
      )}
    </div>
  )
}
