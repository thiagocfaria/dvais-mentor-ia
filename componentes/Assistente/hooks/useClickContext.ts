'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSelectorForTargetId } from '@/biblioteca/assistente/actionValidator'

export type ClickedContext = {
  targetId?: string
  text?: string
  tag?: string
  timestamp: number
}

type UseClickContextArgs = {
  isActive: boolean
  selectionMode: boolean
  setSelectionMode: (value: boolean) => void
  showTextDebug: boolean
  assistantRootRef: React.RefObject<HTMLElement>
  highlight: (targetId: string) => void
  highlightElement: (element: HTMLElement | null) => void
}

export function useClickContext({
  isActive,
  selectionMode,
  setSelectionMode,
  showTextDebug,
  assistantRootRef,
  highlight,
  highlightElement,
}: UseClickContextArgs) {
  const [clickedContext, setClickedContext] = useState<ClickedContext | null>(null)
  const [hintMessage, setHintMessage] = useState('')

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

  const resolveUnderlyingTarget = useCallback(
    (target: HTMLElement | null, point?: { x: number; y: number }) => {
      if (!target) return null
      const widgetRoot = target.closest('[data-testid="assistente-widget"]') as HTMLElement | null
      const assistantRoot = assistantRootRef.current
      const blockingRoot =
        widgetRoot || (assistantRoot?.contains(target) ? assistantRoot : null)

      if (!blockingRoot) {
        return target
      }
      if (!point) return null

      const previousPointerEvents = blockingRoot.style.pointerEvents
      blockingRoot.style.pointerEvents = 'none'
      const underlying = document.elementFromPoint(point.x, point.y) as HTMLElement | null
      blockingRoot.style.pointerEvents = previousPointerEvents

      if (underlying && !blockingRoot.contains(underlying)) {
        return underlying
      }
      return null
    },
    [assistantRootRef]
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !isActive) return

    const captureSelection = (
      target: HTMLElement | null,
      event: Event,
      point?: { x: number; y: number }
    ) => {
      if (!selectionMode || showTextDebug) return
      if (target?.closest('[data-assistente-selection-ui="true"]')) return
      const resolvedTarget = resolveUnderlyingTarget(target, point)
      if (!resolvedTarget) return

      const candidate = (resolvedTarget.closest(
        'button, a, [role="button"], [role="link"], [data-ia], [id], section, article, header, footer, h1, h2, h3, p, li'
      ) || resolvedTarget) as HTMLElement

      event.preventDefault()
      event.stopPropagation()

      const targetId = resolveClickedTargetId(candidate)
      const text = extractElementText(candidate)
      const tag = candidate?.tagName?.toLowerCase() || ''

      setClickedContext({
        targetId: targetId || undefined,
        text: text || undefined,
        tag: tag || undefined,
        timestamp: Date.now(),
      })
      setHintMessage(`Selecionado: ${text || 'este item'}. Agora pergunte no chat ou toque no microfone.`)
      setSelectionMode(false)

      if (targetId) {
        highlight(targetId)
      } else {
        highlightElement(candidate)
      }
    }

    const handleClickCapture = (event: MouseEvent) => {
      if (event.button !== 0) return
      captureSelection(event.target as HTMLElement | null, event, {
        x: event.clientX,
        y: event.clientY,
      })
    }

    const handleTouchCapture = (event: TouchEvent) => {
      const touchTarget =
        (event.changedTouches[0]?.target as HTMLElement | null) ??
        (event.target as HTMLElement | null)
      captureSelection(touchTarget, event, {
        x: event.changedTouches[0]?.clientX ?? 0,
        y: event.changedTouches[0]?.clientY ?? 0,
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectionMode) {
        setSelectionMode(false)
        setHintMessage('Seleção cancelada. Você pode continuar no chat ou escolher outro item.')
      }
    }

    document.addEventListener('click', handleClickCapture, true)
    document.addEventListener('touchend', handleTouchCapture, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('click', handleClickCapture, true)
      document.removeEventListener('touchend', handleTouchCapture, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [
    assistantRootRef,
    extractElementText,
    highlight,
    highlightElement,
    isActive,
    resolveClickedTargetId,
    resolveUnderlyingTarget,
    selectionMode,
    setSelectionMode,
    showTextDebug,
  ])

  return {
    clickedContext,
    setClickedContext,
    hintMessage,
    setHintMessage,
  }
}
