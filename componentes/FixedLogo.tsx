import Link from 'next/link'
import Icon from './Icon'

/**
 * FixedLogo Component
 *
 * Logo fixo da aplicação que não se move durante scroll
 * - Posicionado fixo na tela (position: fixed)
 * - Sempre visível (não desaparece ao rolar)
 * - Link para página inicial
 * - Design com gradiente e glassmorphism
 *
 * Comportamento:
 * - Fixo na tela (não rola com conteúdo)
 * - Clique retorna para página inicial
 * - Hover com efeitos visuais
 * - Acessível (aria-label)
 *
 * Design:
 * - Gradiente azul-cyan
 * - Ícone de cérebro (FontAwesome)
 * - Texto com gradiente animado
 * - Sombra e brilho
 *
 * Performance:
 * - Server Component (compatível com App Router)
 * - Renderizado no servidor (menor bundle)
 * - CSS otimizado (transform, opacity)
 *
 * @returns {JSX.Element} Logo fixo com link para home
 */
export default function FixedLogo() {
  return (
    <Link
      href="/"
      className="fixed-logo-dvais flex items-center space-x-3 group cursor-pointer pointer-events-auto"
      aria-label="DVAi$ - Mentor IA - Ir para página inicial"
    >
      <div
        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"
        aria-hidden="true"
      >
        <Icon name="fas fa-brain" className="text-white text-2xl" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
        DVAi$ - Mentor IA
      </span>
    </Link>
  )
}
