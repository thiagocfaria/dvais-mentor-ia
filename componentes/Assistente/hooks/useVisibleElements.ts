'use client'

import { useEffect, useState } from 'react'

const TARGET_IDS = [
  'hero-content',
  'features-section',
  'stats-section',
  'analise-hero',
  'seguranca-hero',
  'aprendizado-hero',
  'login-card',
  'cadastro-card',
]

/**
 * Detecta elementos visíveis na página usando IntersectionObserver.
 * Retorna array de IDs dos elementos com >50% de visibilidade.
 */
export function useVisibleElements(isActive: boolean): string[] {
  const [visibleElements, setVisibleElements] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !isActive) return

    const visibleSet = new Set<string>()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const updateVisibleElements = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(() => {
        setVisibleElements(Array.from(visibleSet))
        debounceTimer = null
      }, 200)
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.id) {
            visibleSet.add(entry.target.id)
          } else if (entry.target.id) {
            visibleSet.delete(entry.target.id)
          }
        })
        updateVisibleElements()
      },
      { threshold: 0.5 }
    )

    TARGET_IDS.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      observer.disconnect()
    }
  }, [isActive])

  return visibleElements
}
