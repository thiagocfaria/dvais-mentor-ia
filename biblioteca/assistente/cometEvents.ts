import { getSelectorForTargetId } from './actionValidator'

export type CometHighlightEvent = {
  targetId: string
  route?: string
}

/**
 * Dispara evento para comets circularem um botão/elemento
 * @param targetIdOrKey - targetId que será mapeado via page-elements.json (NUNCA selector livre)
 */
export function highlightButton(targetIdOrKey: string): void {
  // Validar que targetId existe em page-elements.json
  const selector = getSelectorForTargetId(targetIdOrKey)
  if (!selector) {
    console.warn(`[cometEvents] targetId não encontrado em page-elements.json: ${targetIdOrKey}`)
    return
  }

  const event = new CustomEvent<CometHighlightEvent>('comet-highlight-button', {
    detail: { targetId: targetIdOrKey },
  })
  window.dispatchEvent(event)
}

/**
 * Para o modo highlight dos comets
 */
export function stopHighlight(): void {
  const event = new CustomEvent('comet-stop-highlight', {})
  window.dispatchEvent(event)
}
