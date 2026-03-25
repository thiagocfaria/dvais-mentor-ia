'use client'

export type SpeechRecognitionResult = {
  text: string
  isFinal: boolean
  confidence?: number
}

export type SpeechRecognitionErrorCode =
  | 'speech_not_supported'
  | 'mic_permission_denied'
  | 'no_speech'
  | 'audio_capture_failed'
  | 'stt_timeout'
  | 'stt_error'

export type SpeechRecognitionError = {
  code: SpeechRecognitionErrorCode
  message: string
}

export type SpeechRecognitionCallbacks = {
  onResult?: (result: SpeechRecognitionResult) => void
  onError?: (error: SpeechRecognitionError) => void
  onStart?: () => void
  onEnd?: (reason?: 'ended' | 'manual_stop') => void
}

export type SpeechRecognitionOptions = {
  silenceTimeoutMs?: number
  continuous?: boolean
  mobile?: boolean
}

let recognitionInstance: SpeechRecognition | null = null
let microphonePermissionState: 'unknown' | 'granted' | 'denied' = 'unknown'
let permissionRequestPromise: Promise<boolean> | null = null

function createError(code: SpeechRecognitionErrorCode, message: string): SpeechRecognitionError {
  return { code, message }
}

export function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  if (window.webkitSpeechRecognition) return window.webkitSpeechRecognition
  if (window.SpeechRecognition) return window.SpeechRecognition
  return null
}

export function isSpeechRecognitionAvailable(): boolean {
  return getSpeechRecognition() !== null
}

async function requestMicrophonePermission(): Promise<boolean> {
  if (microphonePermissionState === 'granted') return true
  if (microphonePermissionState === 'denied') return false
  if (permissionRequestPromise) return permissionRequestPromise

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false
  }

  permissionRequestPromise = (async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      microphonePermissionState = 'granted'
      return true
    } catch (error: unknown) {
      const err = error as { name?: string }
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        microphonePermissionState = 'denied'
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
    callbacks.onError?.(
      createError('speech_not_supported', 'Captura de voz não disponível neste navegador.')
    )
    return () => {}
  }

  const hasPermission = await requestMicrophonePermission()
  if (!hasPermission) {
    callbacks.onError?.(
      createError(
        'mic_permission_denied',
        'Permissão de microfone negada. Clique no cadeado do navegador e permita o microfone, ou use o botão de texto.'
      )
    )
    return () => {}
  }

  const recognition = new Recognition()
  recognition.lang = 'pt-BR'
  recognition.continuous = options?.continuous ?? false
  recognition.interimResults = true

  let finalTranscript = ''
  let latestTranscript = ''
  let latestConfidence = 0.5
  let silenceTimeoutId: ReturnType<typeof setTimeout> | null = null
  let endReason: 'ended' | 'manual_stop' = 'ended'
  const silenceTimeoutMs = options?.silenceTimeoutMs ?? 20000

  const clearSilenceTimeout = () => {
    if (silenceTimeoutId) {
      clearTimeout(silenceTimeoutId)
      silenceTimeoutId = null
    }
  }

  const resetSilenceTimeout = () => {
    clearSilenceTimeout()
    silenceTimeoutId = setTimeout(() => {
      const usefulTranscript = latestTranscript.trim()
      if (options?.mobile && usefulTranscript.length >= 2) {
        callbacks.onResult?.({
          text: usefulTranscript,
          isFinal: true,
          confidence: latestConfidence,
        })
        try {
          recognition.stop()
        } catch {
          // noop
        }
        return
      }
      callbacks.onError?.(
        createError(
          'stt_timeout',
          `Timeout: nenhum áudio detectado por ${Math.round(silenceTimeoutMs / 1000)} segundos.`
        )
      )
      try {
        recognition.stop()
      } catch {
        // noop
      }
    }, silenceTimeoutMs)
  }

  recognition.onstart = () => {
    endReason = 'ended'
    resetSilenceTimeout()
    callbacks.onStart?.()
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    resetSilenceTimeout()
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      const confidence = event.results[i][0].confidence || 0.5
      latestConfidence = confidence

      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' '
      } else {
        interimTranscript += transcript
      }

      const fullText = (finalTranscript + interimTranscript).trim()
      latestTranscript = fullText
      callbacks.onResult?.({
        text: fullText,
        isFinal: interimTranscript === '',
        confidence,
      })
    }
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    clearSilenceTimeout()

    let error = createError('stt_error', 'Erro ao capturar voz.')
    if (event.error === 'no-speech') {
      error = createError('no_speech', 'Nenhum áudio detectado. Tente novamente.')
    } else if (event.error === 'audio-capture') {
      error = createError('audio_capture_failed', 'Microfone não encontrado ou sem permissão.')
    } else if (event.error === 'not-allowed') {
      microphonePermissionState = 'denied'
      error = createError('mic_permission_denied', 'Permissão de microfone negada. Use o botão de texto.')
    }

    callbacks.onError?.(error)
  }

  recognition.onend = () => {
    clearSilenceTimeout()
    callbacks.onEnd?.(endReason)
  }

  try {
    recognition.start()
    recognitionInstance = recognition
  } catch (error: unknown) {
    callbacks.onError?.(
      createError('stt_error', error instanceof Error ? error.message : 'Erro ao iniciar captura de voz.')
    )
    return () => {}
  }

  return () => {
    clearSilenceTimeout()
    endReason = 'manual_stop'
    try {
      recognition.stop()
    } catch {
      // noop
    }
    recognitionInstance = null
  }
}

export function stopSpeechRecognition() {
  if (!recognitionInstance) return
  try {
    recognitionInstance.stop()
  } catch {
    // noop
  }
  recognitionInstance = null
}

export function resetSpeechPermissionCache() {
  microphonePermissionState = 'unknown'
  permissionRequestPromise = null
}
