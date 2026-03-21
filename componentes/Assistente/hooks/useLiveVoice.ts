'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  isSpeechRecognitionAvailable,
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

  const stopListening = useCallback(() => {
    // Limpar timeout de onEnd se existir
    if (onEndTimeoutRef.current !== null) {
      clearTimeout(onEndTimeoutRef.current)
      onEndTimeoutRef.current = null
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
            if (result.isFinal && result.text.trim().length > 2) {
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
            if (error.includes('no-speech') || error.includes('Timeout')) {
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
              setCaption(`Erro: ${error}`)
              setContinuousMode(false)
            }
            speechCleanupRef.current?.()
            speechCleanupRef.current = null
          },
          onEnd: () => {
            // Limpar timeout anterior se existir
            if (onEndTimeoutRef.current !== null) {
              clearTimeout(onEndTimeoutRef.current)
            }
            onEndTimeoutRef.current = window.setTimeout(() => {
              if (
                isActiveRef.current &&
                continuousModeRef.current &&
                !isThinkingRef.current &&
                !isTTSSpeakingRef.current
              ) {
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

  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening()
      setContinuousMode(false)
      return
    }

    if (!isSpeechRecognitionAvailable()) {
      setCaption('Captura de voz não disponível neste navegador.')
      return
    }

    const cleanup = await startSpeechRecognition(
      {
        onStart: () => {
          setIsListening(true)
          setCaption('Ouvindo...')
        },
        onResult: result => {
          setQuestion(result.text)
          if (result.isFinal) {
            setIsListening(false)
            setCaption('Captura finalizada. Clique em "Perguntar" para enviar.')
          }
        },
        onError: error => {
          setIsListening(false)
          setCaption(error)
          speechCleanupRef.current?.()
          speechCleanupRef.current = null
        },
        onEnd: () => {
          setIsListening(false)
          speechCleanupRef.current = null
        },
      },
      { silenceTimeoutMs: 10000 }
    )

    speechCleanupRef.current = cleanup
  }, [isListening, setCaption, setContinuousMode, setQuestion, stopListening])

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
