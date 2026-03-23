'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  isSpeechRecognitionAvailable,
  type SpeechRecognitionError,
} from '@/biblioteca/assistente/speechRecognition'
import type { VoiceIssue } from '../types'

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
  onVoiceIssue?: (issue: VoiceIssue) => void
  onDiagnosticMessage?: (value: string) => void
}

export function shouldAutoSubmitManualTranscript(args: { text: string; isFinal: boolean }) {
  return args.isFinal && args.text.trim().length >= 2
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

export function mapSpeechErrorToVoiceIssue(error: SpeechRecognitionError): VoiceIssue {
  switch (error.code) {
    case 'speech_not_supported':
      return 'speech_not_supported'
    case 'mic_permission_denied':
      return 'mic_denied'
    case 'no_speech':
      return 'no_speech'
    case 'audio_capture_failed':
      return 'audio_capture_failed'
    case 'stt_timeout':
      return 'stt_timeout'
    default:
      return 'tts_failed'
  }
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
  onVoiceIssue,
  onDiagnosticMessage,
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

  const startManualListening = useCallback(() => {
    if (!isSpeechRecognitionAvailable()) {
      onVoiceIssue?.('speech_not_supported')
      onDiagnosticMessage?.('Captura de voz não disponível neste navegador. Continue pelo texto.')
      setCaption('Captura de voz não disponível neste navegador.')
      return
    }

    const startListening = async () => {
      if (!isActiveRef.current || isThinkingRef.current) {
        setIsListening(false)
        return
      }

      submittedInSessionRef.current = false
      const speechAvail = hasSTT()
      const ttsAvail = hasTTS()
      let cleanupCurrent: (() => void) | null = null

      const cleanup = await startSpeechRecognition(
        {
          onStart: () => {
            setIsListening(true)
            onVoiceIssue?.('none')
            onDiagnosticMessage?.('')
            setCaption('🎤 Ouvindo... fale sua pergunta')
          },
          onResult: result => {
            setQuestion(result.text)
            if (shouldAutoSubmitManualTranscript(result)) {
              submittedInSessionRef.current = true
              const finalText = result.text.trim()
              setQuestion(finalText)
              cleanupCurrent?.()
              manualSubmitTimeoutRef.current = window.setTimeout(() => {
                if (
                  isActiveRef.current &&
                  !isThinkingRef.current &&
                  handleAskRef.current
                ) {
                  handleAskRef.current(speechAvail, ttsAvail)
                }
                manualSubmitTimeoutRef.current = null
              }, 250)
            }
          },
          onError: error => {
            setIsListening(false)
            const issue = mapSpeechErrorToVoiceIssue(error)
            onVoiceIssue?.(issue)
            onDiagnosticMessage?.(voiceErrorMessage(error))
            setCaption(`Erro: ${voiceErrorMessage(error)}`)
            setContinuousMode(false)
            speechCleanupRef.current?.()
            speechCleanupRef.current = null
          },
          onEnd: () => {
            if (onEndTimeoutRef.current !== null) {
              clearTimeout(onEndTimeoutRef.current)
            }
            onEndTimeoutRef.current = window.setTimeout(() => {
              setIsListening(false)
              speechCleanupRef.current = null
              onEndTimeoutRef.current = null
            }, 150)
          },
        },
        { silenceTimeoutMs: 20000, continuous: false }
      )

      cleanupCurrent = cleanup
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
    onDiagnosticMessage,
    onVoiceIssue,
  ])

  useEffect(() => {
    startContinuousListeningRef.current = startManualListening
  }, [startManualListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
      setContinuousMode(false)
      return
    }

    if (!isSpeechRecognitionAvailable()) {
      onVoiceIssue?.('speech_not_supported')
      onDiagnosticMessage?.('Captura de voz não disponível neste navegador. Continue pelo texto.')
      setCaption('Captura de voz não disponível neste navegador.')
      return
    }

    setContinuousMode(false)
    continuousModeRef.current = false
    startManualListening()
  }, [isListening, stopListening, setContinuousMode, setCaption, startManualListening, continuousModeRef, onDiagnosticMessage, onVoiceIssue])

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
