'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSelectorForTargetId } from '@/biblioteca/assistente/actionValidator'

const DOUBLE_CLICK_DELAY_MS = 260

export type ClickedContext = {
  targetId?: string
  text?: string
  tag?: string
  timestamp: number
}

type UseClickContextArgs = {
  isActive: boolean
  showTextDebug: boolean
  assistantRootRef: React.RefObject<HTMLElement>
  highlight: (targetId: string) => void
  highlightElement: (element: HTMLElement | null) => void
}

export function useClickContext({
  isActive,
  showTextDebug,
  assistantRootRef,
  highlight,
  highlightElement,
}: UseClickContextArgs) {
  const [clickedContext, setClickedContext] = useState<ClickedContext | null>(null)
  const [hintMessage, setHintMessage] = useState('')
  const pendingClickRef = useRef<{ timerId: number | null; target: HTMLElement | null } | null>(null)
  const bypassClickRef = useRef(false)

  const resolveClickedTargetId = useCallback((element: HTMLElement | null): string | null => {
    if (!element) return null
    if (element.id && getSelectorForTargetId(element.id)) return element.id
    const withId = element.closest('[id]') as HTMLElement | null
    if (withId?.id && getSelectorForTargetId(withId.id)) return withId.id
    return null
  }, [])

  const extractElementText = useCallback((element: HTMLElement | null): string => {
    if (!element) return ''
    const aria = element.getAttribute('aria-label') || element.getAttribute('title')
    const alt = element.getAttribute('alt')
    const text = aria || alt || element.textContent || ''
    return text.replace(/\s+/g, ' ').trim().slice(0, 140)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !isActive) return

    const handleClickCapture = (event: MouseEvent) => {
      if (showTextDebug) return
      if (bypassClickRef.current) {
        bypassClickRef.current = false
        return
      }
      if (event.button !== 0) return
      const target = event.target as HTMLElement | null
      if (!target) return
      if (assistantRootRef.current?.contains(target)) return

      const interactive = target.closest(
        'a, button, [role="button"], [role="link"]'
      ) as HTMLElement | null
      if (!interactive) return

      event.preventDefault()
      event.stopPropagation()

      if (pendingClickRef.current?.timerId) {
        clearTimeout(pendingClickRef.current.timerId)
      }

      pendingClickRef.current = {
        target: interactive,
        timerId: window.setTimeout(() => {
          const pending = pendingClickRef.current
          pendingClickRef.current = { timerId: null, target: null }
          if (!pending?.target) return

          bypassClickRef.current = true
          pending.target.click()
        }, DOUBLE_CLICK_DELAY_MS),
      }
    }

    const handleDoubleClick = (event: MouseEvent) => {
      if (event.button !== 0) return
      const target = event.target as HTMLElement | null
      if (!target) return
      if (assistantRootRef.current?.contains(target)) return

      event.preventDefault()
      event.stopPropagation()

      if (pendingClickRef.current?.timerId) {
        clearTimeout(pendingClickRef.current.timerId)
        pendingClickRef.current = { timerId: null, target: null }
      }

      const candidate = (target.closest(
        'button, a, [role="button"], [role="link"], [data-ia], [id], section, article, header, footer, h1, h2, h3, p, li'
      ) || target) as HTMLElement
      const targetId = resolveClickedTargetId(candidate)
      const text = extractElementText(candidate)
      const tag = candidate?.tagName?.toLowerCase() || ''

      setClickedContext({
        targetId: targetId || undefined,
        text: text || undefined,
        tag: tag || undefined,
        timestamp: Date.now(),
      })
      setHintMessage(
        `Selecionado: ${text || 'este item'}. Agora pergunte por voz sobre esse assunto.`
      )

      if (targetId) {
        highlight(targetId)
      } else {
        highlightElement(candidate)
      }
    }

    document.addEventListener('click', handleClickCapture, true)
    document.addEventListener('dblclick', handleDoubleClick, true)
    return () => {
      document.removeEventListener('click', handleClickCapture, true)
      document.removeEventListener('dblclick', handleDoubleClick, true)
      if (pendingClickRef.current?.timerId) {
        clearTimeout(pendingClickRef.current.timerId)
      }
      pendingClickRef.current = null
    }
  }, [
    assistantRootRef,
    extractElementText,
    highlight,
    highlightElement,
    isActive,
    resolveClickedTargetId,
    showTextDebug,
  ])

  return {
    clickedContext,
    setClickedContext,
    hintMessage,
    setHintMessage,
  }
}
