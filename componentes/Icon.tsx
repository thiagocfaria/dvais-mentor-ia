import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  // Solid icons
  faCheck,
  faCheckCircle,
  faEye,
  faEyeSlash,
  faSpinner,
  faUserPlus,
  faPlay,
  faBrain,
  faBolt,
  faBars,
  faChartLine,
  faShieldAlt,
  faGraduationCap,
  faStar,
  faHeart,
  faRobot,
  faHeadset,
  faBuilding,
  faChartBar,
  faSignInAlt,
  faLock,
  faLightbulb,
  faTrophy,
  faRocket,
  faBullseye,
  faArrowRight,
  faClock,
  faWallet,
  faExclamationTriangle,
  faHandPointer,
  faBell,
  faArrowDown,
  faSyncAlt,
  faInfoCircle,
  faCalendarCheck,
  faHandHoldingHeart,
  faUserCheck,
  faChartPie,
  faEnvelope,
  faRoute,
  faClipboardCheck,
  faLayerGroup,
  faVial,
  faDesktop,
  faCloud,
  faCode,
  faDollarSign,
  faCalculator,
  faSync,
  faCompass,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'
import {
  // Brand icons
  faGoogle,
  faFacebook,
  faApple,
  faMicrosoft,
  faTwitter,
  faLinkedin,
  faGithub,
} from '@fortawesome/free-brands-svg-icons'

/**
 * Mapeamento de nomes de ícones para componentes FontAwesome
 *
 * Estrutura:
 * - Chave: nome do ícone (ex: 'fa-check-circle')
 * - Valor: componente FontAwesome correspondente
 *
 * Otimização:
 * - Apenas ícones usados no projeto são importados
 * - Tree-shaking remove ícones não usados
 * - Reduz bundle size significativamente
 */
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const iconMap: Record<string, IconDefinition> = {
  // Solid icons (ícones sólidos do FontAwesome)
  'fa-check': faCheck,
  'fa-check-circle': faCheckCircle,
  'fa-eye': faEye,
  'fa-eye-slash': faEyeSlash,
  'fa-spinner': faSpinner,
  'fa-user-plus': faUserPlus,
  'fa-play': faPlay,
  'fa-brain': faBrain,
  'fa-bolt': faBolt,
  'fa-bars': faBars,
  'fa-chart-line': faChartLine,
  'fa-shield-alt': faShieldAlt,
  'fa-graduation-cap': faGraduationCap,
  'fa-star': faStar,
  'fa-heart': faHeart,
  'fa-robot': faRobot,
  'fa-headset': faHeadset,
  'fa-building': faBuilding,
  'fa-chart-bar': faChartBar,
  'fa-sign-in-alt': faSignInAlt,
  'fa-lock': faLock,
  'fa-lightbulb': faLightbulb,
  'fa-trophy': faTrophy,
  'fa-rocket': faRocket,
  'fa-bullseye': faBullseye,
  'fa-arrow-right': faArrowRight,
  'fa-clock': faClock,
  'fa-wallet': faWallet,
  'fa-exclamation-triangle': faExclamationTriangle,
  'fa-hand-pointer': faHandPointer,
  'fa-bell': faBell,
  'fa-arrow-down': faArrowDown,
  'fa-sync-alt': faSyncAlt,
  'fa-info-circle': faInfoCircle,
  'fa-calendar-check': faCalendarCheck,
  'fa-hand-holding-heart': faHandHoldingHeart,
  'fa-user-check': faUserCheck,
  'fa-chart-pie': faChartPie,
  'fa-envelope': faEnvelope,
  'fa-route': faRoute,
  'fa-clipboard-check': faClipboardCheck,
  'fa-layer-group': faLayerGroup,
  'fa-vial': faVial,
  'fa-desktop': faDesktop,
  'fa-cloud': faCloud,
  'fa-code': faCode,
  'fa-dollar-sign': faDollarSign,
  'fa-calculator': faCalculator,
  'fa-sync': faSync,
  'fa-compass': faCompass,
  'fa-times': faTimes,
  // Brand icons
  'fa-google': faGoogle,
  'fa-facebook': faFacebook,
  'fa-apple': faApple,
  'fa-microsoft': faMicrosoft,
  'fa-twitter': faTwitter,
  'fa-linkedin': faLinkedin,
  'fa-github': faGithub,
}

interface IconProps {
  name: string
  className?: string
  spin?: boolean
  style?: React.CSSProperties
  'aria-hidden'?: string | boolean
  'aria-label'?: string
}

/**
 * Icon Component
 *
 * Componente wrapper para ícones FontAwesome
 * - Renderiza ícones SVG do FontAwesome
 * - Suporta ícones sólidos e de marcas
 * - Tree-shaking automático (apenas ícones usados)
 *
 * Funcionalidades:
 * - Normalização de nomes de ícones (aceita vários formatos)
 * - Suporte a animação spin
 * - Acessibilidade (aria-label, aria-hidden)
 * - Estilização via className
 *
 * Performance:
 * - Server Component (compatível com App Router)
 * - Tree-shaking remove ícones não usados
 * - SVG renderizado (leve e escalável)
 *
 * @param {string} name - Nome do ícone (ex: 'fa-check-circle', 'fas fa-check-circle')
 * @param {string} className - Classes CSS adicionais
 * @param {boolean} spin - Se true, anima o ícone com rotação
 * @param {object} props - Props adicionais (aria-label, aria-hidden, etc.)
 *
 * @returns {JSX.Element | null} Componente de ícone ou null se não encontrado
 */
export default function Icon({ name, className = '', spin = false, style, ...props }: IconProps) {
  /**
   * Normalizar nome do ícone
   *
   * Aceita vários formatos:
   * - 'fa-check-circle'
   * - 'fas fa-check-circle'
   * - 'fab fa-google'
   *
   * Remove prefixos desnecessários para buscar no iconMap
   */
  const iconName = name.replace(/^(fas|far|fab|fal|fad)\s+fa-?/, 'fa-')

  // Buscar ícone no mapeamento
  const icon = iconMap[iconName]

  // Se ícone não encontrado, avisar e retornar null (não quebra a UI)
  if (!icon) {
    console.warn(`Ícone não encontrado: ${name}. Verifique se foi importado em iconMap.`)
    return null
  }

  const ariaHidden = props['aria-hidden'] === 'true' || props['aria-hidden'] === true

  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      spin={spin}
      aria-hidden={ariaHidden ? true : undefined}
      aria-label={props['aria-label']}
      style={{
        color: 'currentColor',
        margin: '0 !important',
        padding: '0 !important',
        display: 'block !important',
        ...style,
      }}
    />
  )
}
