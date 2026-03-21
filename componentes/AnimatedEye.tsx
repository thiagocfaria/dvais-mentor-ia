'use client'

import { useEffect, useRef } from 'react'

/**
 * AnimatedEye Component
 *
 * Olho animado idêntico ao FontAwesome fa-eye, mas com pupila se movendo levemente
 * - Usa manipulação direta do DOM (sem re-renderizações React)
 * - SVG idêntico ao FontAwesome fa-eye
 * - Animação suave e contínua (60fps sem re-render)
 * - Pausa quando página está oculta ou prefers-reduced-motion
 */
export default function AnimatedEye({ className = 'w-6 h-6 text-white' }: { className?: string }) {
  const pupilRef = useRef<SVGCircleElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const isPausedRef = useRef(false)

  // Verificar se deve pausar animação
  const shouldPause = (): boolean => {
    if (typeof document === 'undefined') return true
    if (document.visibilityState === 'hidden') return true

    // Verificar prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return true

    return false
  }

  useEffect(() => {
    // Verificar se está no cliente (SSR safety)
    if (typeof window === 'undefined') return

    const pupil = pupilRef.current
    if (!pupil) return

    // ÚNICO loop de animação (sem re-renderizações React)
    const animate = (currentTime: number) => {
      // Verificar se deve pausar
      const shouldPauseAnimation = shouldPause()
      if (shouldPauseAnimation !== isPausedRef.current) {
        isPausedRef.current = shouldPauseAnimation
        if (shouldPauseAnimation) {
          // Pausar: não continuar o loop
          return
        } else {
          // Retomar: resetar startTime para continuar suavemente
          startTimeRef.current = currentTime
        }
      }

      if (isPausedRef.current) {
        // Se pausado, não animar mas continuar verificando
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Inicializar startTime na primeira execução
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const cycle = elapsed % 4000 // 4 segundos

      // Movimento suave: 0 -> 3px (direita) -> 0 -> -3px (esquerda) -> 0
      let x = 0
      if (cycle < 1000) {
        // 0 a 1s: move para direita
        x = (cycle / 1000) * 3
      } else if (cycle < 2000) {
        // 1s a 2s: volta ao centro
        x = 3 - ((cycle - 1000) / 1000) * 3
      } else if (cycle < 3000) {
        // 2s a 3s: move para esquerda
        x = -((cycle - 2000) / 1000) * 3
      } else {
        // 3s a 4s: volta ao centro
        x = -3 + ((cycle - 3000) / 1000) * 3
      }

      // Manipulação direta do DOM (sem re-renderização React)
      pupil.setAttribute('cx', String(288 + x))

      // Continuar loop
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Listener para visibility change
    const handleVisibilityChange = () => {
      isPausedRef.current = shouldPause()
    }

    // Listener para prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleReducedMotionChange = () => {
      isPausedRef.current = shouldPause()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)

    // Iniciar animação
    animationFrameRef.current = requestAnimationFrame(animate)

    // Cleanup perfeito
    return () => {
      // Cancelar RAF
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Remover event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
    }
  }, [])

  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 576 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Forma externa do olho (idêntica ao FontAwesome fa-eye) */}
      <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0z" />
      {/* Pupila (animada - move levemente para direita e esquerda via DOM direto) */}
      <circle ref={pupilRef} cx="288" cy="256" r="64" fill="currentColor" />
    </svg>
  )
}
