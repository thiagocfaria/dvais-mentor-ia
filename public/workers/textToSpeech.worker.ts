// Web Worker para Text-to-Speech (TTS)
// Nota: SpeechSynthesis não pode ser usada diretamente em Workers
// Este worker gerencia a queue de mensagens e processa resultados
// A API real deve ser chamada no main thread

type TTSMessage = {
  id: string
  text: string
  voice?: string
  rate?: number
  pitch?: number
}

const messageQueue: TTSMessage[] = []
let isProcessing = false
let currentUtteranceId: string | null = null

self.onmessage = e => {
  const { type, data } = e.data

  switch (type) {
    case 'speak':
      // Adicionar mensagem à queue
      const message: TTSMessage = {
        id: data.id || `msg_${Date.now()}`,
        text: data.text.slice(0, 400), // Limitar a 400 caracteres
        voice: data.voice || 'default',
        rate: data.rate || 1.1, // 10% mais rápido
        pitch: data.pitch || 1.0,
      }
      messageQueue.push(message)
      self.postMessage({ type: 'queued', id: message.id, queueLength: messageQueue.length })

      // Processar queue se não estiver processando
      if (!isProcessing) {
        processQueue()
      }
      break

    case 'cancel':
      // Cancelar mensagem atual e limpar queue
      currentUtteranceId = null
      messageQueue.length = 0
      self.postMessage({ type: 'cancelled' })
      break

    case 'completed':
      // Mensagem foi completada no main thread
      if (data.id === currentUtteranceId) {
        currentUtteranceId = null
        isProcessing = false
        // Processar próxima mensagem na queue
        processQueue()
      }
      break

    case 'error':
      // Erro ao processar mensagem
      if (data.id === currentUtteranceId) {
        currentUtteranceId = null
        isProcessing = false
        // Processar próxima mensagem na queue (ou retry se necessário)
        processQueue()
      }
      break

    default:
      self.postMessage({ type: 'error', error: `Tipo desconhecido: ${type}` })
  }
}

function processQueue() {
  if (isProcessing || messageQueue.length === 0) {
    return
  }

  const message = messageQueue.shift()
  if (!message) {
    return
  }

  isProcessing = true
  currentUtteranceId = message.id

  // Enviar mensagem para main thread processar
  self.postMessage({
    type: 'process',
    message: {
      id: message.id,
      text: message.text,
      voice: message.voice,
      rate: message.rate,
      pitch: message.pitch,
    },
  })
}
