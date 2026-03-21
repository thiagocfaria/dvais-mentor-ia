'use client'

import { useEffect, useRef } from 'react'
import { isSpeaking } from '@/biblioteca/assistente/textToSpeech'

/**
 * Reinicia escuta contínua após resposta do assistente.
 * Usa refs para evitar stale closures e proteção contra race condition.
 */
export function useContinuousRestart(args: {
  continuousMode: boolean
  useVoice: boolean
  isThinking: boolean
  isListening: boolean
  isActive: boolean
  qaAnswer: string
  isTTSSpeaking: boolean
  startContinuousListeningRef: React.MutableRefObject<(() => void) | null>
}) {
  const {
    continuousMode,
    useVoice,
    isThinking,
    isListening,
    isActive,
    qaAnswer,
    isTTSSpeaking,
    startContinuousListeningRef,
  } = args

  // Refs para stale closure prevention
  const isActiveRef = useRef(isActive)
  const continuousModeRef = useRef(continuousMode)
  const isThinkingRef = useRef(isThinking)
  const isTTSSpeakingRef = useRef(isTTSSpeaking)
  const isRestartingRef = useRef(false)
  const lastAnswerRef = useRef<string>('')

  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { continuousModeRef.current = continuousMode }, [continuousMode])
  useEffect(() => { isThinkingRef.current = isThinking }, [isThinking])
  useEffect(() => { isTTSSpeakingRef.current = isTTSSpeaking }, [isTTSSpeaking])

  useEffect(() => {
    if (isRestartingRef.current) return

    if (
      continuousMode &&
      useVoice &&
      !isThinking &&
      !isListening &&
      isActive &&
      qaAnswer &&
      qaAnswer !== lastAnswerRef.current &&
      !isTTSSpeaking &&
      !isSpeaking()
    ) {
      lastAnswerRef.current = qaAnswer
      isRestartingRef.current = true

      const timeoutId = setTimeout(() => {
        if (
          startContinuousListeningRef.current &&
          continuousModeRef.current &&
          isActiveRef.current &&
          !isThinkingRef.current &&
          !isListening &&
          !isTTSSpeakingRef.current
        ) {
          startContinuousListeningRef.current()
        }
        isRestartingRef.current = false
      }, 500)

      return () => {
        clearTimeout(timeoutId)
        isRestartingRef.current = false
      }
    }
  }, [continuousMode, useVoice, isThinking, isListening, isActive, qaAnswer, isTTSSpeaking, startContinuousListeningRef])

  return { isActiveRef, continuousModeRef, isThinkingRef, isTTSSpeakingRef, isRestartingRef }
}
