'use client'

/**
 * TTS com queue system e otimizações:
 * - Queue de mensagens para evitar sobreposição
 * - Pré-carregar voz na inicialização
 * - Cancelar áudio anterior antes de novo
 * - Ajustar velocidade (1.1x) e pitch
 * - Suporta Web Worker (quando disponível) com fallback direto
 */

type TTSMessage = {
  id: string
  text: string
  voice?: string
  rate?: number
  pitch?: number
}

const messageQueue: TTSMessage[] = []
let isProcessing = false
let currentUtterance: SpeechSynthesisUtterance | null = null
let workerInstance: Worker | null = null
let useWorker = false

// Ref para rastrear se está falando (proteção anti-eco)
const isSpeakingRef = { current: false }

// Nota: SpeechSynthesis não pode ser usada em Workers
// Os workers são criados mas não são usados para TTS
// Eles podem ser usados para gerenciar queue no futuro
// Por enquanto, usamos queue system direto no main thread
useWorker = false

// Pré-carregar voz na inicialização
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Carregar vozes disponíveis
  window.speechSynthesis.getVoices()

  // Chrome precisa de evento para carregar vozes
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      // Vozes carregadas
    }
  }
}

function processTTSMessage(message: TTSMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve()
      return
    }

    // Cancelar áudio anterior
    window.speechSynthesis.cancel()
    currentUtterance = null
    isSpeakingRef.current = true

    try {
      const utter = new SpeechSynthesisUtterance(message.text)
      utter.lang = 'pt-BR'
      utter.rate = message.rate || 1.1 // 10% mais rápido
      utter.pitch = message.pitch || 1.0

      // Tentar selecionar voz específica se disponível
      if (message.voice && message.voice !== 'default') {
        const voices = window.speechSynthesis.getVoices()
        const voice = voices.find(v => v.name.includes(message.voice!) || v.lang.includes('pt'))
        if (voice) {
          utter.voice = voice
        }
      }

      utter.onend = () => {
        currentUtterance = null
        isProcessing = false
        isSpeakingRef.current = false
        resolve()
        // Processar próxima mensagem na queue
        processQueue()
      }

      utter.onerror = error => {
        currentUtterance = null
        isProcessing = false
        isSpeakingRef.current = false
        reject(error)
        // Processar próxima mensagem na queue
        processQueue()
      }

      currentUtterance = utter
      window.speechSynthesis.speak(utter)
      isProcessing = true
    } catch (error) {
      isProcessing = false
      isSpeakingRef.current = false
      currentUtterance = null
      reject(error)
      processQueue()
    }
  })
}

function processQueue(): Promise<void> {
  return new Promise(resolve => {
    if (isProcessing || messageQueue.length === 0) {
      resolve()
      return
    }

    const message = messageQueue.shift()
    if (!message) {
      resolve()
      return
    }

    processTTSMessage(message)
      .then(resolve)
      .catch(() => resolve())
  })
}

function cancelCurrent() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
  isProcessing = false
  messageQueue.length = 0
}

export async function speakText(text: string) {
  const trimmed = text.slice(0, 400)
  const endpoint = process.env.NEXT_PUBLIC_TTS_URL

  // Tentar endpoint externo primeiro
  if (endpoint) {
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: process.env.NEXT_PUBLIC_TTS_TOKEN ?? '',
        },
        body: JSON.stringify({
          text: trimmed,
          voice: process.env.NEXT_PUBLIC_TTS_VOICE ?? 'default',
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (data?.audioUrl) {
        const audio = new Audio(data.audioUrl)
        await audio.play()
        return
      }
    } catch {
      /* fallback abaixo */
    }
  }

  // Usar SpeechSynthesis com queue system
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const messageId = `msg_${Date.now()}`
    const message: TTSMessage = {
      id: messageId,
      text: trimmed,
      rate: 1.1, // 10% mais rápido
      pitch: 1.0,
    }

    // Usar queue system direto (SpeechSynthesis não funciona em workers)
    messageQueue.push(message)
    return processQueue()
  }

  return Promise.resolve()
}

export function cancelSpeech() {
  cancelCurrent()
}

// Exportar flag para verificação
export function isSpeaking(): boolean {
  return isSpeakingRef.current
}
