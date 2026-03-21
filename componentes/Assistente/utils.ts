import type { TranscriptEntry } from './types'

export const hasSTT = () =>
  typeof window !== 'undefined' &&
  (!!(window as typeof globalThis & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
    !!(window as typeof globalThis & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition)

export const hasTTS = () =>
  typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'

export const normalizeTtsText = (text: string) =>
  text
    .replace(/DVAi\$/gi, 'Davi')
    .replace(/DVAiS/gi, 'Davi')
    .replace(/DVAi/gi, 'Davi')

/**
 * Aguarda elemento aparecer no DOM usando MutationObserver.
 */
export function waitForElement(selector: string, timeout: number = 10000): Promise<HTMLElement | null> {
  return new Promise(resolve => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      resolve(element)
      return
    }

    let observer: MutationObserver | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let resolved = false

    const cleanup = () => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    const checkAndResolve = (el: HTMLElement | null) => {
      if (!resolved && el) {
        resolved = true
        cleanup()
        resolve(el)
      }
    }

    observer = new MutationObserver(() => {
      const el = document.querySelector(selector) as HTMLElement
      checkAndResolve(el)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        const el = document.querySelector(selector) as HTMLElement
        resolve(el)
      }
    }, timeout)
  })
}

export function formatTranscript(
  history: TranscriptEntry[],
  sessionId: string | null,
  currentPage: string
): string {
  const header = [
    'Transcricao de testes - Assistente Davi',
    `Sessao: ${sessionId ?? 'sem-id'}`,
    `Pagina: ${currentPage || '-'}`,
    `Gerado em: ${new Date().toISOString()}`,
  ]

  const entries = history
    .filter(item => item.question || item.answer)
    .map(item => {
      const timestamp = new Date(item.timestamp).toLocaleString('pt-BR')
      const lines: string[] = []
      if (item.question) {
        lines.push(`Usuario (${timestamp}): ${item.question}`)
      }
      if (item.answer) {
        lines.push(`Davi (${timestamp}): ${item.answer}`)
      }
      return lines.join('\n')
    })

  return [...header, '', ...entries].join('\n\n').trim()
}
