'use client'

/**
 * Speech-to-Text (STT) usando Web Speech API
 * Suporta Web Worker (quando disponível) com fallback para API direta
 * Fallback automático para input de texto se não disponível
 */

export type SpeechRecognitionResult = {
  text: string
  isFinal: boolean
  confidence?: number
}

export type SpeechRecognitionCallbacks = {
  onResult?: (result: SpeechRecognitionResult) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

export type SpeechRecognitionOptions = {
  /**
   * Timeout de silêncio em milissegundos
   * Padrão: 20000ms (20 segundos) para modo Live
   * Modo Manual pode usar valores menores (ex: 10000ms)
   */
  silenceTimeoutMs?: number
}

let recognitionInstance: SpeechRecognition | null = null
let workerInstance: Worker | null = null
let useWorker = false
let microphonePermissionState: 'unknown' | 'granted' | 'denied' = 'unknown'
let permissionRequestPromise: Promise<boolean> | null = null

// Nota: Web Speech API não pode ser usada em Workers
// Os workers são criados mas não são usados para SpeechRecognition
// Eles podem ser usados para processamento de resultados no futuro
// Por enquanto, usamos API direta com otimizações
useWorker = false

export function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null

  // Chrome/Edge
  if (window.webkitSpeechRecognition) {
    return window.webkitSpeechRecognition
  }

  // Firefox (experimental)
  if (window.SpeechRecognition) {
    return window.SpeechRecognition
  }

  return null
}

export function isSpeechRecognitionAvailable(): boolean {
  return getSpeechRecognition() !== null
}

// Solicitar permissão de microfone explicitamente
async function requestMicrophonePermission(): Promise<boolean> {
  if (microphonePermissionState === 'granted') return true
  if (microphonePermissionState === 'denied') return false
  if (permissionRequestPromise) return permissionRequestPromise

  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false
  }

  permissionRequestPromise = (async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      microphonePermissionState = 'granted'
      return true
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string }
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        microphonePermissionState = 'denied'
        return false
      }
      return false
    } finally {
      permissionRequestPromise = null
    }
  })()

  return permissionRequestPromise
}

export async function startSpeechRecognition(
  callbacks: SpeechRecognitionCallbacks,
  options?: SpeechRecognitionOptions
): Promise<() => void> {
  const Recognition = getSpeechRecognition()
  if (!Recognition) {
    callbacks.onError?.('Speech Recognition não disponível neste navegador.')
    return () => {}
  }

  // Solicitar permissão de microfone antes de iniciar
  const hasPermission = await requestMicrophonePermission()
  if (!hasPermission) {
    callbacks.onError?.('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereço e permita o microfone, ou use o botão de texto.')
    return () => {}
  }

  // Criar nova instância
  const recognition = new Recognition()
  recognition.lang = 'pt-BR'
  recognition.continuous = true
  recognition.interimResults = true

  let finalTranscript = ''
  let silenceTimeoutId: ReturnType<typeof setTimeout> | null = null
  // Timeout configurável: padrão 20s para modo Live (permite TTS + tempo de resposta do usuário)
  // Modo Manual pode usar valores menores (ex: 10s)
  const SILENCE_TIMEOUT_MS = options?.silenceTimeoutMs ?? 20000 // 20 segundos padrão (modo Live)
  const CONFIDENCE_THRESHOLD = 0.7

  const resetSilenceTimeout = () => {
    if (silenceTimeoutId) {
      clearTimeout(silenceTimeoutId)
    }
    const timeoutSeconds = Math.round(SILENCE_TIMEOUT_MS / 1000)
    silenceTimeoutId = setTimeout(() => {
      callbacks.onError?.(`Timeout: nenhum áudio detectado por ${timeoutSeconds} segundos.`)
      stopSpeechRecognition()
    }, SILENCE_TIMEOUT_MS)
  }

  recognition.onstart = () => {
    resetSilenceTimeout()
    callbacks.onStart?.()
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    resetSilenceTimeout() // Resetar timeout a cada resultado
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      const confidence = event.results[i][0].confidence || 0.5

      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' '
      } else {
        interimTranscript += transcript
      }

      const fullText = finalTranscript + interimTranscript
      const isFinal = interimTranscript === ''

      // Filtrar por confidence threshold apenas para resultados finais
      if (isFinal && confidence < CONFIDENCE_THRESHOLD) {
        // Resultado final com baixa confiança - mostrar mas com aviso
        callbacks.onResult?.({
          text: fullText.trim(),
          isFinal: true,
          confidence,
        })
      } else {
        callbacks.onResult?.({
          text: fullText.trim(),
          isFinal,
          confidence,
        })
      }
    }
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (silenceTimeoutId) {
      clearTimeout(silenceTimeoutId)
      silenceTimeoutId = null
    }

    let errorMsg = 'Erro ao capturar voz.'
    if (event.error === 'no-speech') {
      errorMsg = 'Nenhum áudio detectado. Tente novamente.'
    } else if (event.error === 'audio-capture') {
      errorMsg = 'Microfone não encontrado ou sem permissão.'
    } else if (event.error === 'not-allowed') {
      microphonePermissionState = 'denied'
      errorMsg = 'Permissão de microfone negada. Use o botão de texto.'
    }
    callbacks.onError?.(errorMsg)
  }

  recognition.onend = () => {
    if (silenceTimeoutId) {
      clearTimeout(silenceTimeoutId)
      silenceTimeoutId = null
    }
    callbacks.onEnd?.()
  }

  try {
    recognition.start()
    recognitionInstance = recognition
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao iniciar captura de voz.'
    callbacks.onError?.(msg)
    return () => {}
  }

  // Retornar função de cleanup
  return () => {
    if (silenceTimeoutId) {
      clearTimeout(silenceTimeoutId)
      silenceTimeoutId = null
    }
    try {
      recognition.stop()
    } catch {
      // Ignorar erro ao parar
    }
    recognitionInstance = null
  }
}

export function stopSpeechRecognition() {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop()
    } catch {
      // Ignorar erro
    }
    recognitionInstance = null
  }
}

export function resetSpeechPermissionCache() {
  microphonePermissionState = 'unknown'
  permissionRequestPromise = null
}
