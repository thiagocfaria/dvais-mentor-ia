'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { KBAction } from '@/biblioteca/assistente/knowledgeBase'
import { highlightButton, stopHighlight } from '@/biblioteca/assistente/cometEvents'
import { getSelectorForTargetId } from '@/biblioteca/assistente/actionValidator'
import { speakText } from '@/biblioteca/assistente/textToSpeech'
import { hasTTS, normalizeTtsText, waitForElement } from '../utils'

/**
 * Gerencia processamento de actions (scroll, highlight, navigate)
 * e navegação pós-clique com MutationObserver.
 */
export function useNavigationActions(args: {
  isActive: boolean
  useVoice: boolean
  highlight: (targetId: string) => void
  highlightTimeoutRef: React.MutableRefObject<number | null>
  setCaption: (value: string) => void
}) {
  const { isActive, useVoice, highlight, highlightTimeoutRef, setCaption } = args
  const scrollTimeoutRef = useRef<number | null>(null)
  const actionTimeoutRef = useRef<number | null>(null)

  const getButtonTargetIdForRoute = useCallback((route: string): string | null => {
    const routeMap: Record<string, string> = {
      '/cadastro': 'button-comecar-agora',
      '/login': 'button-login',
      '/analise-tempo-real': 'nav-analise',
      '/seguranca': 'nav-seguranca',
      '/aprendizado-continuo': 'nav-aprendizado',
    }
    return routeMap[route] || null
  }, [])

  const handleNavigation = useCallback(
    async (route: string, targetId?: string) => {
      const navMessage = `Para acessar esta informação, vamos para a página correspondente. Clique no botão destacado.`
      setCaption(navMessage)
      if (useVoice && hasTTS()) speakText(normalizeTtsText(navMessage))

      const buttonTargetId = getButtonTargetIdForRoute(route)
      if (!buttonTargetId) {
        const buttonName =
          route === '/cadastro'
            ? 'Começar Agora'
            : route === '/login'
              ? 'Login'
              : 'o botão correspondente'
        setCaption(`Para acessar esta página, clique em ${buttonName} no topo da página.`)
        return
      }

      if (targetId) {
        sessionStorage.setItem(
          'pendingNavigation',
          JSON.stringify({ route, targetId, timestamp: Date.now() })
        )
      }

      highlightButton(buttonTargetId)
    },
    [useVoice, getButtonTargetIdForRoute, setCaption]
  )

  const processActions = useCallback(
    (actions: KBAction[] = []) => {
      if (actionTimeoutRef.current !== null) {
        clearTimeout(actionTimeoutRef.current)
      }
      actionTimeoutRef.current = window.setTimeout(() => {
        for (const action of actions) {
          switch (action.type) {
            case 'scrollToSection':
            case 'highlightSection':
              if (action.targetId) {
                highlight(action.targetId)
              }
              break
            case 'navigateRoute':
              handleNavigation(action.route, action.targetId)
              break
            case 'showTooltip':
              if (action.targetId && action.text) {
                setCaption(action.text)
              }
              break
          }
        }
        actionTimeoutRef.current = null
      }, 100)
    },
    [highlight, handleNavigation, setCaption]
  )

  // Scroll pós-navegação com MutationObserver
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingNavigation')
    if (!pending) return

    try {
      const { route, targetId, timestamp } = JSON.parse(pending)

      if (Date.now() - timestamp > 30000) {
        sessionStorage.removeItem('pendingNavigation')
        return
      }

      if (window.location.pathname !== route) return

      const scrollToTarget = async () => {
        const selector = getSelectorForTargetId(targetId)
        if (!selector) {
          sessionStorage.removeItem('pendingNavigation')
          return
        }

        try {
          const element = await waitForElement(selector, 10000)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            const prev = element.style.boxShadow
            element.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.7)'
            const highlightTimeoutId = window.setTimeout(() => {
              element.style.boxShadow = prev
            }, 3500)
            if (highlightTimeoutRef.current !== null) {
              clearTimeout(highlightTimeoutRef.current)
            }
            highlightTimeoutRef.current = highlightTimeoutId

            sessionStorage.removeItem('pendingNavigation')

            const routeNames: Record<string, string> = {
              '/analise-tempo-real': 'Análise em Tempo Real',
              '/seguranca': 'Proteção Inteligente',
              '/aprendizado-continuo': 'Aprendizado Contínuo',
            }
            const routeName = routeNames[route] || route
            const explanation = `Estamos na página ${routeName}. ${targetId ? 'Veja a seção destacada.' : ''}`
            setCaption(explanation)
            if (hasTTS()) speakText(normalizeTtsText(explanation))
          } else {
            sessionStorage.removeItem('pendingNavigation')
            setCaption('A seção está nesta página, role até encontrar.')
          }
        } catch {
          sessionStorage.removeItem('pendingNavigation')
        }
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollToTarget()
        scrollTimeoutRef.current = null
      }, 300)
    } catch {
      sessionStorage.removeItem('pendingNavigation')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Limpar pendingNavigation quando desativar
  useEffect(() => {
    if (!isActive) {
      sessionStorage.removeItem('pendingNavigation')
      stopHighlight()
    }
  }, [isActive])

  // Cleanup
  const cleanupNavigation = useCallback(() => {
    if (scrollTimeoutRef.current !== null) {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = null
    }
    if (actionTimeoutRef.current !== null) {
      clearTimeout(actionTimeoutRef.current)
      actionTimeoutRef.current = null
    }
  }, [])

  return { processActions, handleNavigation, cleanupNavigation }
}
