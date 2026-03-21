// Web Worker para Speech Recognition (STT)
// Nota: Web Speech API não pode ser usada diretamente em Workers
// Este worker apenas processa resultados e gerencia timeouts
// A API real deve ser chamada no main thread

let recognitionInstance: unknown = null
let timeoutId: number | null = null
let silenceTimeoutId: number | null = null
const SILENCE_TIMEOUT_MS = 10000 // 10 segundos de silêncio

self.onmessage = e => {
  const { type, data } = e.data

  switch (type) {
    case 'start':
      // Worker não pode iniciar SpeechRecognition diretamente
      // Retornar erro informando que precisa ser feito no main thread
      self.postMessage({
        type: 'error',
        error: 'SpeechRecognition deve ser iniciado no main thread. Use fallback direto.',
      })
      break

    case 'result':
      // Processar resultado recebido do main thread
      if (data.text && data.confidence !== undefined) {
        // Filtrar por confidence threshold (0.7)
        if (data.confidence >= 0.7) {
          self.postMessage({
            type: 'result',
            text: data.text,
            isFinal: data.isFinal || false,
            confidence: data.confidence,
          })
        } else if (!data.isFinal) {
          // Mostrar resultado intermediário com opacidade reduzida
          self.postMessage({
            type: 'interim',
            text: data.text,
            confidence: data.confidence,
          })
        }
      }
      break

    case 'timeout':
      // Configurar timeout de silêncio
      if (silenceTimeoutId) {
        clearTimeout(silenceTimeoutId)
      }
      silenceTimeoutId = setTimeout(() => {
        self.postMessage({ type: 'timeout' })
        silenceTimeoutId = null
      }, SILENCE_TIMEOUT_MS) as unknown as number
      break

    case 'stop':
      // Limpar timeouts
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (silenceTimeoutId) {
        clearTimeout(silenceTimeoutId)
        silenceTimeoutId = null
      }
      self.postMessage({ type: 'stopped' })
      break

    default:
      self.postMessage({ type: 'error', error: `Tipo desconhecido: ${type}` })
  }
}
