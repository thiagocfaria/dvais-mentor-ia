'use client'

import { useCallback, useRef, useState } from 'react'
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  isSpeechRecognitionAvailable,
  type SpeechRecognitionError,
} from '@/biblioteca/assistente/speechRecognition'
import type { VoiceIssue, VoiceRuntimeState } from '../types'

type UseLiveVoiceArgs = {
  hasSTT: () => boolean
  hasTTS: () => boolean
  mobileModeEnabled?: boolean
  isSessionActiveRef: React.MutableRefObject<boolean>
  isThinkingRef: React.MutableRefObject<boolean>
  isTTSSpeakingRef: React.MutableRefObject<boolean>
  isDegradedTextRef: React.MutableRefObject<boolean>
  onAsk: (
    speechAvailable: boolean,
    ttsAvailable: boolean,
    questionOverride?: string
  ) => Promise<void>
  setQuestion: (value: string) => void
  setCaption: (value: string) => void
  onVoiceIssue?: (issue: VoiceIssue) => void
  onDiagnosticMessage?: (value: string) => void
}

export function shouldAutoSubmitVoiceTranscript(args: { text: string; isFinal: boolean }) {
  return args.isFinal && args.text.trim().length >= 2
}

export function createVoiceSessionState(args: {
  active: boolean
  hidden: boolean
  degradedText: boolean
  isStarting?: boolean
  isListening?: boolean
  isThinking?: boolean
  isTTSSpeaking?: boolean
  hasError?: boolean
}): VoiceRuntimeState {
  if (!args.active) return 'off'
  if (args.hasError) return 'error'
  if (args.degradedText) return 'degraded_text'
  if (args.hidden) return 'hidden'
  if (args.isTTSSpeaking) return 'speaking'
  if (args.isThinking) return 'thinking'
  if (args.isListening) return 'listening'
  if (args.isStarting) return 'starting'
  return 'listening'
}

export function shouldResumeVoiceSession(args: {
  sessionActive: boolean
  uiHidden: boolean
  degradedText: boolean
  isThinking: boolean
  isTTSSpeaking: boolean
  documentVisible: boolean
  speechAvailable: boolean
}) {
  return (
    args.sessionActive &&
    !args.degradedText &&
    !args.isThinking &&
    !args.isTTSSpeaking &&
    args.documentVisible &&
    args.speechAvailable
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

function isRecoverableVoiceIssue(issue: VoiceIssue) {
  return issue === 'no_speech' || issue === 'stt_timeout'
}

export function useLiveVoice({
  hasSTT,
  hasTTS,
  mobileModeEnabled = false,
  isSessionActiveRef,
  isThinkingRef,
  isTTSSpeakingRef,
  isDegradedTextRef,
  onAsk,
  setQuestion,
  setCaption,
  onVoiceIssue,
  onDiagnosticMessage,
}: UseLiveVoiceArgs) {
  const [isListening, setIsListening] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const speechCleanupRef = useRef<(() => void) | null>(null)
  const submittedInSessionRef = useRef(false)
  const resumeTimeoutRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (resumeTimeoutRef.current !== null) {
      clearTimeout(resumeTimeoutRef.current)
      resumeTimeoutRef.current = null
    }
  }, [])

  const stopListening = useCallback(() => {
    clearTimers()
    stopSpeechRecognition()
    speechCleanupRef.current?.()
    speechCleanupRef.current = null
    setIsListening(false)
    setIsStarting(false)
  }, [clearTimers])

  const startVoiceSession = useCallback(async () => {
    if (
      !isSessionActiveRef.current ||
      isThinkingRef.current ||
      isTTSSpeakingRef.current ||
      isDegradedTextRef.current
    ) {
      setIsStarting(false)
      return
    }

    if (!isSpeechRecognitionAvailable()) {
      onVoiceIssue?.('speech_not_supported')
      onDiagnosticMessage?.(
        'Captura de voz não disponível neste navegador. O Davi entrou em modo texto.'
      )
      setCaption('Captura de voz não disponível neste navegador. O Davi entrou em modo texto.')
      setIsStarting(false)
      return
    }

    clearTimers()
    submittedInSessionRef.current = false
    setIsStarting(true)

    const speechAvail = hasSTT()
    const ttsAvail = hasTTS()
    const silenceTimeoutMs = mobileModeEnabled ? 6500 : 20000
    const recoverableResumeDelayMs = mobileModeEnabled ? 280 : 700
    const idleResumeDelayMs = mobileModeEnabled ? 180 : 450
    let cleanupCurrent: (() => void) | null = null

    const scheduleResume = (delayMs: number) => {
      if (resumeTimeoutRef.current !== null) {
        clearTimeout(resumeTimeoutRef.current)
      }
      resumeTimeoutRef.current = window.setTimeout(() => {
        if (
          shouldResumeVoiceSession({
            sessionActive: isSessionActiveRef.current,
            uiHidden: false,
            degradedText: isDegradedTextRef.current,
            isThinking: isThinkingRef.current,
            isTTSSpeaking: isTTSSpeakingRef.current,
            documentVisible:
              typeof document === 'undefined' ? true : document.visibilityState === 'visible',
            speechAvailable: hasSTT(),
          })
        ) {
          startVoiceSession().catch(() => {})
        }
        resumeTimeoutRef.current = null
      }, delayMs)
    }

    const cleanup = await startSpeechRecognition(
      {
        onStart: () => {
          setIsStarting(false)
          setIsListening(true)
          onVoiceIssue?.('none')
          onDiagnosticMessage?.('')
          setCaption(mobileModeEnabled ? 'Pode falar.' : '🎤 Ouvindo...')
        },
        onResult: result => {
          setQuestion(result.text)
          if (result.text.trim()) {
            setCaption(
              result.isFinal
                ? 'Entendi, processando...'
                : mobileModeEnabled
                  ? `Pode falar: ${result.text.trim()}`
                  : '🎤 Ouvindo...'
            )
          }
          if (shouldAutoSubmitVoiceTranscript(result)) {
            submittedInSessionRef.current = true
            const finalText = result.text.trim()
            setQuestion(finalText)
            cleanupCurrent?.()
            if (
              isSessionActiveRef.current &&
              !isThinkingRef.current &&
              onAsk
            ) {
              void onAsk(speechAvail, ttsAvail, finalText)
            }
          }
        },
        onError: error => {
          setIsListening(false)
          setIsStarting(false)
          const issue = mapSpeechErrorToVoiceIssue(error)
          onVoiceIssue?.(issue)
          onDiagnosticMessage?.(voiceErrorMessage(error))
          setCaption(
            isRecoverableVoiceIssue(issue) && mobileModeEnabled
              ? 'Ainda ouvindo. Tente falar de novo.'
              : `Erro: ${voiceErrorMessage(error)}`
          )
          speechCleanupRef.current?.()
          speechCleanupRef.current = null
          if (isRecoverableVoiceIssue(issue)) {
            scheduleResume(recoverableResumeDelayMs)
          }
        },
        onEnd: reason => {
          setIsListening(false)
          setIsStarting(false)
          speechCleanupRef.current = null
          if (submittedInSessionRef.current || reason === 'manual_stop') {
            return
          }
          scheduleResume(idleResumeDelayMs)
        },
      },
      { silenceTimeoutMs, continuous: false, mobile: mobileModeEnabled }
    )

    cleanupCurrent = cleanup
    speechCleanupRef.current = cleanup
  }, [
    clearTimers,
    hasSTT,
    hasTTS,
    mobileModeEnabled,
    isDegradedTextRef,
    isSessionActiveRef,
    isTTSSpeakingRef,
    isThinkingRef,
    onAsk,
    onDiagnosticMessage,
    onVoiceIssue,
    setCaption,
    setQuestion,
  ])

  const resumeIfAllowed = useCallback(() => {
    if (
      shouldResumeVoiceSession({
        sessionActive: isSessionActiveRef.current,
        uiHidden: false,
        degradedText: isDegradedTextRef.current,
        isThinking: isThinkingRef.current,
        isTTSSpeaking: isTTSSpeakingRef.current,
        documentVisible:
          typeof document === 'undefined' ? true : document.visibilityState === 'visible',
        speechAvailable: hasSTT(),
      })
    ) {
      startVoiceSession().catch(() => {})
    }
  }, [hasSTT, isDegradedTextRef, isSessionActiveRef, isTTSSpeakingRef, isThinkingRef, startVoiceSession])

  const cleanupVoice = useCallback(() => {
    stopListening()
  }, [stopListening])

  return {
    isListening,
    isStarting,
    setIsListening,
    startVoiceSession,
    resumeIfAllowed,
    stopListening,
    cleanupVoice,
  }
}
