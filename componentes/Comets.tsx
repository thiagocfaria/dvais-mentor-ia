'use client'

import { useEffect, useRef } from 'react'
import { getSelectorForTargetId } from '@/biblioteca/assistente/actionValidator'
import { stopHighlight as stopHighlightEvent } from '@/biblioteca/assistente/cometEvents'

type Comet = {
  element: HTMLDivElement
  originalX: number
  originalY: number
  currentX: number
  currentY: number
  size: number
  speed: number
  speedBase?: number // Fixado no highlight
  sizeBase?: number // Fixado no highlight
  isActive: boolean
  respawnTimeout: number | null
}

type PerformanceProfile = 'low' | 'medium' | 'high'

type HighlightMode = {
  selector: string
  bounds: DOMRect
  centerX: number
  centerY: number
  radius: number
  timeoutId: number | null
}

export default function Comets() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | null>(null)
  const cometsRef = useRef<Comet[]>([])
  const isPausedRef = useRef(false)
  const highlightModeRef = useRef<HighlightMode | null>(null)

  // Detectar perfil de performance baseado em hardware
  const getPerformanceProfile = (): PerformanceProfile => {
    if (typeof window === 'undefined') return 'medium'

    const isMobile = window.innerWidth < 768
    if (isMobile) return 'low'

    // Usar hardwareConcurrency e deviceMemory quando disponível
    const nav = navigator as Navigator & { hardwareConcurrency?: number; deviceMemory?: number }
    const cores = nav.hardwareConcurrency || 4
    const memory = nav.deviceMemory || 4

    if (cores >= 8 && memory >= 8) return 'high'
    if (cores >= 4 && memory >= 4) return 'medium'
    return 'low'
  }

  // Determinar quantidade de cometas baseado no perfil
  const getCometCount = (profile: PerformanceProfile, isMobile: boolean): number => {
    if (isMobile) return Math.floor(Math.random() * 3) // 0-2 cometas em mobile
    if (profile === 'low') return 0
    if (profile === 'medium') return Math.floor(Math.random() * 6) + 5 // 5-10
    return Math.floor(Math.random() * 11) + 10 // 10-20
  }

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
    if (typeof window === 'undefined') return

    const container = containerRef.current
    if (!container) return

    // Inicializar posição do mouse no centro
    mousePosRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }

    // Rastrear posição do mouse
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const container = containerRef.current
    if (!container) return

    const isMobile = window.innerWidth < 768
    const profile = getPerformanceProfile()
    const cometCount = getCometCount(profile, isMobile)

    // Se não há cometas, não criar nada
    if (cometCount === 0) {
      return
    }

    const comets: Comet[] = []
    const width = window.innerWidth
    const height = window.innerHeight

    // Criar cometas em posições iniciais fixas (evitar alocação no loop)
    for (let i = 0; i < cometCount; i++) {
      const comet = document.createElement('div')
      comet.className = 'comet-trail'

      // Tamanho bem pequeno
      const size = Math.random() * 2 + 1 // 1-3px
      comet.style.width = `${size}px`
      comet.style.height = `${size}px`

      // Posição inicial aleatória nas bordas
      const side = Math.floor(Math.random() * 4) // 0=top, 1=right, 2=bottom, 3=left
      let originalX = 0
      let originalY = 0

      if (side === 0) {
        // Top
        originalX = Math.random() * width
        originalY = 0
      } else if (side === 1) {
        // Right
        originalX = width
        originalY = Math.random() * height
      } else if (side === 2) {
        // Bottom
        originalX = Math.random() * width
        originalY = height
      } else {
        // Left
        originalX = 0
        originalY = Math.random() * height
      }

      // Usar transform em vez de left/top (GPU accelerated, evita reflow)
      comet.style.transform = `translate3d(${originalX}px, ${originalY}px, 0)`
      comet.style.opacity = '0.7'
      comet.style.position = 'absolute'
      comet.style.zIndex = '1'
      comet.style.pointerEvents = 'none'
      comet.style.willChange = 'transform, opacity' // Otimização para GPU

      container.appendChild(comet)

      const speed = Math.random() * 0.5 + 0.3 // Velocidade variável

      comets.push({
        element: comet,
        originalX,
        originalY,
        currentX: originalX,
        currentY: originalY,
        size,
        speed,
        isActive: true,
        respawnTimeout: null,
      })
    }

    cometsRef.current = comets

    // Variáveis reutilizáveis (evitar alocação no loop)
    let mouseX = 0
    let mouseY = 0
    let dx = 0
    let dy = 0
    let distance = 0
    let angle = 0

    // ÚNICO loop de animação para todos os cometas
    const animate = () => {
      // Verificar se deve pausar
      const shouldPauseAnimation = shouldPause()
      if (shouldPauseAnimation !== isPausedRef.current) {
        isPausedRef.current = shouldPauseAnimation
        if (shouldPauseAnimation) {
          // Pausar: não continuar o loop
          return
        }
      }

      if (isPausedRef.current) {
        // Se pausado, não animar mas continuar verificando
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Atualizar posição do mouse uma vez por frame
      mouseX = mousePosRef.current.x
      mouseY = mousePosRef.current.y

      const highlightMode = highlightModeRef.current

      // Animar todos os cometas no mesmo frame
      for (let i = 0; i < comets.length; i++) {
        const comet = comets[i]

        // Verificações de segurança
        if (!comet.isActive || !comet.element || !comet.element.parentNode) {
          continue
        }

        if (highlightMode) {
          // Modo highlight: orbit circular ao redor do botão
          const { centerX, centerY, radius } = highlightMode
          // Orbit circular: cada cometa em ângulo diferente, girando continuamente
          const time = Date.now() * 0.001 // Velocidade base de rotação
          const baseAngle = time + i * ((Math.PI * 2) / comets.length)
          // Velocidade de orbit (fixada ao entrar em highlight, usar como multiplicador)
          const orbitSpeed = comet.speedBase || 2.0
          const angle = baseAngle * orbitSpeed

          // Usar viewport coords (getBoundingClientRect já retorna viewport)
          comet.currentX = centerX + Math.cos(angle) * radius
          comet.currentY = centerY + Math.sin(angle) * radius

          // Tamanho já fixado (sizeBase) - não recalcular
        } else {
          // Modo normal: seguir mouse
          // Calcular direção (reutilizar variáveis, evitar alocação)
          dx = mouseX - comet.currentX
          dy = mouseY - comet.currentY
          distance = Math.sqrt(dx * dx + dy * dy)

          // Se chegou perto do mouse (dentro de 20px), desaparecer e renascer
          if (distance < 20) {
            comet.isActive = false
            comet.element.style.opacity = '0'
            comet.element.style.transition = 'opacity 0.3s ease-out'

            // Limpar timeout anterior se existir
            if (comet.respawnTimeout !== null) {
              clearTimeout(comet.respawnTimeout)
            }

            // Renascer na posição original após um delay
            comet.respawnTimeout = window.setTimeout(() => {
              if (!comet.element || !comet.element.parentNode) return
              comet.currentX = comet.originalX
              comet.currentY = comet.originalY
              comet.element.style.transform = `translate3d(${comet.originalX}px, ${comet.originalY}px, 0)`
              comet.element.style.opacity = '0.7'
              comet.element.style.transition = 'opacity 0.3s ease-in'
              comet.isActive = true
              comet.respawnTimeout = null
            }, 300)
            continue
          }

          // Mover em direção ao mouse (reutilizar variáveis)
          angle = Math.atan2(dy, dx)
          comet.currentX += Math.cos(angle) * comet.speed
          comet.currentY += Math.sin(angle) * comet.speed
        }

        // Usar transform em vez de left/top (GPU accelerated)
        // getBoundingClientRect() já retorna viewport coords, então está correto
        comet.element.style.transform = `translate3d(${comet.currentX}px, ${comet.currentY}px, 0)`
      }

      // Continuar loop único
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

    // Listeners para eventos de highlight
    const handleHighlight = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetId: string }>
      const { targetId } = customEvent.detail

      // Mapear targetId → selector via page-elements.json
      const selector = getSelectorForTargetId(targetId)
      if (!selector) {
        console.warn(`[Comets] Selector não encontrado para targetId: ${targetId}`)
        return
      }

      const element = document.querySelector(selector) as HTMLElement
      if (!element) {
        console.warn(`[Comets] Elemento não encontrado: ${selector}`)
        return
      }

      // getBoundingClientRect() retorna viewport coords (já correto)
      const bounds = element.getBoundingClientRect()
      const centerX = bounds.left + bounds.width / 2
      const centerY = bounds.top + bounds.height / 2
      const radius = Math.max(bounds.width, bounds.height) / 2 + 30

      // Limpar highlight anterior se existir
      if (highlightModeRef.current?.timeoutId) {
        clearTimeout(highlightModeRef.current.timeoutId)
      }

      highlightModeRef.current = {
        selector,
        bounds,
        centerX,
        centerY,
        radius,
        timeoutId: window.setTimeout(() => {
          stopHighlightEvent()
        }, 8000), // Auto-stop após 8s
      }

      // Fixar speedBase e sizeBase para cada cometa ao entrar em highlight
      comets.forEach(comet => {
        if (!comet.speedBase) {
          // speedBase usado como multiplicador de velocidade de orbit (1.5-3.0)
          comet.speedBase = 1.5 + Math.random() * 1.5
        }
        if (!comet.sizeBase) {
          comet.sizeBase = 4 + Math.random() * 4 // 4-8px (fixado)
        }
        // Aplicar classe highlight
        comet.element.classList.add('comet-trail-highlight')
        comet.element.style.zIndex = '50'
        comet.element.style.width = `${comet.sizeBase}px`
        comet.element.style.height = `${comet.sizeBase}px`
      })
    }

    const handleStopHighlight = () => {
      if (highlightModeRef.current?.timeoutId) {
        clearTimeout(highlightModeRef.current.timeoutId)
      }
      highlightModeRef.current = null

      // Voltar ao modo normal
      comets.forEach(comet => {
        comet.speedBase = undefined
        comet.sizeBase = undefined
        comet.element.classList.remove('comet-trail-highlight')
        comet.element.style.zIndex = '1'
        // Restaurar tamanho original
        comet.element.style.width = `${comet.size}px`
        comet.element.style.height = `${comet.size}px`
      })
    }

    window.addEventListener('comet-highlight-button', handleHighlight as EventListener)
    window.addEventListener('comet-stop-highlight', handleStopHighlight)

    // Iniciar animação única
    animationFrameRef.current = requestAnimationFrame(animate)

    // Cleanup perfeito
    return () => {
      // Cancelar RAF único
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Remover event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
      window.removeEventListener('comet-highlight-button', handleHighlight as EventListener)
      window.removeEventListener('comet-stop-highlight', handleStopHighlight)

      // Log de debug em desenvolvimento para rastrear leaks
      if (process.env.NODE_ENV === 'development') {
        console.log('[Comets] Cleanup completo:', {
          animationFrame: animationFrameRef.current ? 'cancelado' : 'não havia',
          eventListeners: 'removidos',
          comets: cometsRef.current.length,
        })
      }

      // Limpar highlight se existir
      if (highlightModeRef.current?.timeoutId) {
        clearTimeout(highlightModeRef.current.timeoutId)
      }
      highlightModeRef.current = null

      // Limpar cometas e timeouts
      comets.forEach(comet => {
        if (comet.respawnTimeout !== null) {
          clearTimeout(comet.respawnTimeout)
        }
        if (comet.element.parentNode) {
          comet.element.parentNode.removeChild(comet.element)
        }
      })

      cometsRef.current = []
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'screen', zIndex: 0 }}
    />
  )
}
