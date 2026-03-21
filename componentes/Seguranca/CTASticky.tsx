import Link from 'next/link'
import Icon from '@/componentes/Icon'
import RocketIcon from '@/componentes/RocketIcon'

/**
 * CTASticky
 *
 * Barra fixa de CTA (pré-login) — sem JS e sem libs.
 * Nota: o `main` da página deve ter padding-bottom suficiente para não cobrir conteúdo no mobile.
 */
type CTAStickyProps = {
  title?: string
  subtitle?: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  secondaryAriaLabel?: string
}

export default function CTASticky({
  title = 'Proteção Inteligente',
  subtitle = 'Pré-login • sem coleta de dados • sem custódia',
  primaryHref = '/login',
  primaryLabel = 'Começar Agora',
  secondaryHref = '#funcionamento',
  secondaryLabel = 'Ver funcionamento',
  secondaryAriaLabel = 'Ver funcionamento',
}: CTAStickyProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-3">
      <div className="max-w-7xl mx-auto">
        <div className="glass-intense border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl shadow-blue-500/10">
          <div className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/20 border border-white/10 flex items-center justify-center">
                <Icon name="fas fa-shield-alt" className="text-cyan-300" aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <p className="text-white font-semibold">{title}</p>
                <p className="text-xs text-gray-400">{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={primaryHref}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-base shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
                aria-label="Começar agora (ir para login)"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/40 via-cyan-300/40 to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <RocketIcon className="relative z-10 w-6 h-6 transform group-hover:translate-y-[-2px] transition-all duration-500 flex-shrink-0" />
                <span className="relative z-10">{primaryLabel}</span>
              </Link>

              <Link
                href={secondaryHref}
                className="group px-6 py-3 border-2 border-cyan-400/40 text-cyan-200 rounded-xl font-semibold hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm"
                aria-label={secondaryAriaLabel}
              >
                <Icon name="fas fa-play" className="text-cyan-300" aria-hidden="true" />
                {secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
