'use client'

import { useCallback, useRef } from 'react'
import { getSelectorForTargetId } from '@/biblioteca/assistente/actionValidator'
import { HIGHLIGHT_MS } from '../types'

/**
 * Gerencia highlight visual de elementos no DOM com auto-cleanup por timeout.
 */
export function useHighlight() {
  const cleanupRef = useRef<(() => void) | null>(null)
  const highlightTimeoutRef = useRef<number | null>(null)

  const clearHighlightTimeout = () => {
    if (highlightTimeoutRef.current !== null) {
      clearTimeout(highlightTimeoutRef.current)
      highlightTimeoutRef.current = null
    }
  }

  const applyHighlight = (el: HTMLElement) => {
    cleanupRef.current?.()
    const prev = el.style.boxShadow
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.7)'
    cleanupRef.current = () => {
      el.style.boxShadow = prev
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      cleanupRef.current?.()
      highlightTimeoutRef.current = null
    }, HIGHLIGHT_MS)
  }

  const highlight = useCallback((targetId: string) => {
    clearHighlightTimeout()
    cleanupRef.current?.()
    const selector = getSelectorForTargetId(targetId) || `#${targetId}`
    const el = document.querySelector(selector) as HTMLElement
    if (!el) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      cleanupRef.current = null
      return
    }
    applyHighlight(el)
  }, [])

  const highlightElement = useCallback((element: HTMLElement | null) => {
    if (!element) return
    clearHighlightTimeout()
    cleanupRef.current?.()
    const prev = element.style.boxShadow
    element.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.7)'
    cleanupRef.current = () => {
      element.style.boxShadow = prev
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      cleanupRef.current?.()
      highlightTimeoutRef.current = null
    }, HIGHLIGHT_MS)
  }, [])

  const cleanupHighlight = useCallback(() => {
    clearHighlightTimeout()
    cleanupRef.current?.()
    cleanupRef.current = null
  }, [])

  return { highlight, highlightElement, cleanupHighlight, highlightTimeoutRef }
}
