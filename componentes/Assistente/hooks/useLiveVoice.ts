'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  isSpeechRecognitionAvailable,
  type SpeechRecognitionError,
} from '@/biblioteca/assistente/speechRecognition'

type UseLiveVoiceArgs = {
  hasSTT: () => boolean
  hasTTS: () => boolean
  isActiveRef: React.MutableRefObject<boolean>
  continuousModeRef: React.MutableRefObject<boolean>
  isThinkingRef: React.MutableRefObject<boolean>
  isTTSSpeakingRef: React.MutableRefObject<boolean>
  handleAskRef: React.MutableRefObject<
    ((speechAvailable: boolean, ttsAvailable: boolean) => Promise<void>) | null
  >
  setQuestion: (value: string) => void
  setCaption: (value: string) => void
  setContinuousMode: (value: boolean) => void
}

export function shouldAutoSubmitManualTranscript(args: { text: string; isFinal: boolean }) {
  return args.isFinal && args.text.trim().length > 2
}

export function shouldRestartContinuousListening(args: {
  continuousMode: boolean
  isActive: boolean
  isThinking: boolean
  isTTSSpeaking: boolean
  submittedInSession: boolean
  endReason?: 'ended' | 'manual_stop'
}) {
  return (
    args.continuousMode &&
    args.isActive &&
    !args.isThinking &&
    !args.isTTSSpeaking &&
    !args.submittedInSession &&
    args.endReason !== 'manual_stop'
  )
}

function voiceErrorMessage(error: SpeechRecognitionError) {
  return error.message
}

export function useLiveVoice({
  hasSTT,
  hasTTS,
  isActiveRef,
  continuousModeRef,
  isThinkingRef,
  isTTSSpeakingRef,
  handleAskRef,
  setQuestion,
  setCaption,
  setContinuousMode,
}: UseLiveVoiceArgs) {
  const [isListening, setIsListening] = useState(false)
  const speechCleanupRef = useRef<(() => void) | null>(null)
  const startContinuousListeningRef = useRef<(() => void) | null>(null)
  const onEndTimeoutRef = useRef<number | null>(null) // Para cleanup de timeout em onEnd
  const submittedInSessionRef = useRef(false)
  const manualSubmitTimeoutRef = useRef<number | null>(null)

  const stopListening = useCallback(() => {
    // Limpar timeout de onEnd se existir
    if (onEndTimeoutRef.current !== null) {
      clearTimeout(onEndTimeoutRef.current)
      onEndTimeoutRef.current = null
    }
    if (manualSubmitTimeoutRef.current !== null) {
      clearTimeout(manualSubmitTimeoutRef.current)
      manualSubmitTimeoutRef.current = null
    }
    stopSpeechRecognition()
    speechCleanupRef.current?.()
    speechCleanupRef.current = null
    setIsListening(false)
  }, [])

  // Função para iniciar escuta contínua (modo live)
  const startContinuousListening = useCallback(() => {
    if (!isSpeechRecognitionAvailable()) {
      setCaption('Captura de voz não disponível neste navegador.')
      return
    }

    const startListening = async () => {
      const shouldContinue =
        isActiveRef.current && continuousModeRef.current && !isThinkingRef.current

      if (!shouldContinue) {
        setIsListening(false)
        return
      }

      submittedInSessionRef.current = false
      const speechAvail = hasSTT()
      const ttsAvail = hasTTS()

      const cleanup = await startSpeechRecognition(
        {
          onStart: () => {
            setIsListening(true)
            setCaption('🎤 Ouvindo... fale naturalmente')
          },
          onResult: result => {
            setQuestion(result.text)
            if (shouldAutoSubmitManualTranscript(result)) {
              submittedInSessionRef.current = true
              const finalText = result.text.trim()
              setQuestion(finalText)
              setTimeout(() => {
                if (
                  isActiveRef.current &&
                  continuousModeRef.current &&
                  !isThinkingRef.current &&
                  handleAskRef.current
                ) {
                  handleAskRef.current(speechAvail, ttsAvail)
                }
              }, 500)
            }
          },
          onError: error => {
            setIsListening(false)
            if (error.code === 'no_speech' || error.code === 'stt_timeout') {
              setTimeout(() => {
                if (
                  isActiveRef.current &&
                  continuousModeRef.current &&
                  !isThinkingRef.current &&
                  !isTTSSpeakingRef.current
                ) {
                  startListening()
                }
              }, 1000)
            } else {
              setCaption(`Erro: ${voiceErrorMessage(error)}`)
              setContinuousMode(false)
            }
            speechCleanupRef.current?.()
            speechCleanupRef.current = null
          },
          onEnd: reason => {
            // Limpar timeout anterior se existir
            if (onEndTimeoutRef.current !== null) {
              clearTimeout(onEndTimeoutRef.current)
            }
            onEndTimeoutRef.current = window.setTimeout(() => {
              if (shouldRestartContinuousListening({
                continuousMode: continuousModeRef.current,
                isActive: isActiveRef.current,
                isThinking: isThinkingRef.current,
                isTTSSpeaking: isTTSSpeakingRef.current,
                submittedInSession: submittedInSessionRef.current,
                endReason: reason,
              })) {
                startListening()
              } else {
                setIsListening(false)
                speechCleanupRef.current = null
              }
              onEndTimeoutRef.current = null
            }, 1000)
          },
        },
        { silenceTimeoutMs: 20000 }
      )

      speechCleanupRef.current = cleanup
    }

    startListening()
  }, [
    continuousModeRef,
    handleAskRef,
    hasSTT,
    hasTTS,
    isActiveRef,
    isThinkingRef,
    isTTSSpeakingRef,
    setCaption,
    setContinuousMode,
    setQuestion,
  ])

  useEffect(() => {
    startContinuousListeningRef.current = startContinuousListening
  }, [startContinuousListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
      setContinuousMode(false)
      return
    }

    if (!isSpeechRecognitionAvailable()) {
      setCaption('Captura de voz não disponível neste navegador.')
      return
    }

    // Ativa modo contínuo: mic reabre automaticamente após cada resposta
    setContinuousMode(true)
    continuousModeRef.current = true
    startContinuousListening()
  }, [isListening, stopListening, setContinuousMode, setCaption, startContinuousListening, continuousModeRef])

  const cleanupVoice = useCallback(() => {
    stopListening()
  }, [stopListening])

  return {
    isListening,
    setIsListening,
    toggleListening,
    startContinuousListeningRef,
    stopListening,
    cleanupVoice,
  }
}
