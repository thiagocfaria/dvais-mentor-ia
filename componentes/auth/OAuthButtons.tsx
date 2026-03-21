import type { OAuthButtonsProps } from '@/tipos/auth'
import Icon from '../Icon'

export default function OAuthButtons({
  providers = ['google', 'facebook', 'apple'],
  mode = 'login',
}: OAuthButtonsProps) {
  const providerConfig = {
    google: {
      name: 'Google',
      icon: 'fab fa-google',
      bg: 'bg-white hover:bg-gray-100',
      text: 'text-gray-900',
      border: 'border-gray-300',
    },
    facebook: {
      name: 'Facebook',
      icon: 'fab fa-facebook',
      bg: 'bg-[#1877F2] hover:bg-[#166FE5]',
      text: 'text-white',
      border: 'border-[#1877F2]',
    },
    apple: {
      name: 'Apple',
      icon: 'fab fa-apple',
      bg: 'bg-black hover:bg-gray-900',
      text: 'text-white',
      border: 'border-gray-800',
    },
    microsoft: {
      name: 'Microsoft',
      icon: 'fab fa-microsoft',
      bg: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-white',
      border: 'border-blue-500',
    },
  }

  const actionText = mode === 'login' ? 'Entrar com' : 'Cadastrar com'

  return (
    <div className="space-y-3">
      {providers.map(provider => {
        const config = providerConfig[provider]

        return (
          <button
            key={provider}
            type="button"
            disabled
            aria-disabled="true"
            className={`
              w-full flex items-center justify-center gap-3 px-6 py-3
              ${config.bg} ${config.text} border ${config.border}
              rounded-lg font-medium text-sm
              transition-all duration-300
              opacity-70 cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
            `}
          >
            <Icon name={config.icon} className="text-lg" aria-hidden="true" />
            <span>
              {actionText} {config.name}
            </span>
            <span className="rounded-full bg-black/10 px-2 py-1 text-[10px] uppercase tracking-wide">
              Demo
            </span>
          </button>
        )
      })}

      <p className="text-xs text-gray-500">
        OAuth está representado apenas como interface nesta versão pública.
      </p>
    </div>
  )
}
