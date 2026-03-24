'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { useAssistantSession } from './hooks/useAssistantSession'
import { useClickContext } from './hooks/useClickContext'
import { useVisibleElements } from './hooks/useVisibleElements'
import { useHighlight } from './hooks/useHighlight'
import { useConversationHistory } from './hooks/useConversationHistory'
import { useNavigationActions } from './hooks/useNavigationActions'
import { useAssistantAPI } from './hooks/useAssistantAPI'
import { AssistantHeader } from './AssistantHeader'
import { ChatArea } from './ChatArea'
import { InputArea } from './InputArea'
import type { VoiceRuntimeState } from './types'
import { CLICK_CONTEXT_TTL_MS } from './types'
import { createVoiceSessionState, useLiveVoice } from './hooks/useLiveVoice'
import { hasSTT, hasTTS, isCoarsePointerDevice } from './utils'

type AssistenteProps = {
  onMobileSelectionModeChange?: (active: boolean) => void
  cancelSelectionToken?: number
  onHide?: () => void
  hidden?: boolean
}

export default function Assistente({
  onMobileSelectionModeChange,
  cancelSelectionToken = 0,
  onHide,
  hidden = false,
}: AssistenteProps) {
  const [caption, setCaption] = useState('')
  const [question, setQuestion] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)
  const [degradedTextMode, setDegradedTextMode] = useState(false)

  const assistantRootRef = useRef<HTMLDivElement>(null)
  const isListeningRef = useRef(false)
  const stopListeningRef = useRef<() => void>(() => {})
  const isSessionActiveRef = useRef(true)
  const isDegradedTextRef = useRef(false)
  const lastCompletedAnswerRef = useRef('')
  const bootstrappedVoiceRef = useRef(false)

  const showTextDebug = process.env.NEXT_PUBLIC_ASSISTENTE_TEXT_DEBUG === 'true'
  const enableTranscriptDebug = process.env.NODE_ENV !== 'production' || showTextDebug

  useEffect(() => {
    setIsCoarsePointer(isCoarsePointerDevice())
  }, [])

  const shouldUnlockSelectionSurface = false

  useEffect(() => {
    onMobileSelectionModeChange?.(shouldUnlockSelectionSurface)
  }, [onMobileSelectionModeChange, shouldUnlockSelectionSurface])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('assistente:selection-mode', {
        detail: {
          active: shouldUnlockSelectionSurface,
          mobileSelection: shouldUnlockSelectionSurface,
        },
      })
    )
  }, [shouldUnlockSelectionSurface])

  const liveHintFallback = degradedTextMode
    ? 'Se a voz falhar aqui, continue pelo texto.'
    : 'Davi ligado. Pode falar naturalmente.'

  const isActive = true
  const speechAvailable = hasSTT()
  const ttsAvailable = hasTTS()
  const useVoice = speechAvailable && !degradedTextMode
  const continuousMode = useVoice

  const sessionIdRef = useAssistantSession()
  const visibleElements = useVisibleElements(isActive)
  const { highlight, highlightElement, cleanupHighlight, highlightTimeoutRef } = useHighlight()

  const {
    conversationHistory,
    setConversationHistory,
    handleExportTranscript,
    handleClearTranscript,
    chatEndRef,
  } = useConversationHistory({ sessionIdRef, enableTranscriptDebug })

  const { clickedContext, setClickedContext, hintMessage, setHintMessage } = useClickContext({
    isActive,
    selectionMode,
    setSelectionMode,
    showTextDebug,
    assistantRootRef,
    highlight,
    highlightElement,
  })

  const { processActions, cleanupNavigation } = useNavigationActions({
    isActive,
    useVoice,
    highlight,
    highlightTimeoutRef,
    setCaption,
  })

  const isThinkingRef = useRef(false)
  const isTTSSpeakingRef = useRef(false)

  const {
    handleAsk,
    handleAskRef,
    isThinking,
    mode,
    qaAnswer,
    setQaAnswer,
    isTTSSpeaking,
    setIsTTSSpeaking,
    setMode,
    abortControllerRef,
    diagnosticMessage,
    setDiagnosticMessage,
    voiceIssue,
    setVoiceIssue,
  } = useAssistantAPI({
    sessionIdRef,
    conversationHistory,
    setConversationHistory,
    clickedContext,
    setClickedContext,
    setHintMessage,
    visibleElements,
    useVoice,
    isListeningRef,
    continuousMode,
    stopListeningRef,
    processActions,
    question,
    setQuestion,
    setCaption,
  })

  const {
    isListening,
    isStarting,
    stopListening,
    startVoiceSession,
    resumeIfAllowed,
    cleanupVoice,
  } = useLiveVoice({
    hasSTT,
    hasTTS,
    isSessionActiveRef,
    isThinkingRef,
    isTTSSpeakingRef,
    isDegradedTextRef,
    onAsk: handleAsk,
    setQuestion,
    setCaption,
    onVoiceIssue: setVoiceIssue,
    onDiagnosticMessage: setDiagnosticMessage,
  })

  useEffect(() => { isListeningRef.current = isListening }, [isListening])
  useEffect(() => { stopListeningRef.current = stopListening }, [stopListening])
  useEffect(() => { isThinkingRef.current = isThinking }, [isThinking])
  useEffect(() => { isTTSSpeakingRef.current = isTTSSpeaking }, [isTTSSpeaking])
  useEffect(() => { isDegradedTextRef.current = degradedTextMode }, [degradedTextMode])

  const runtimeState: VoiceRuntimeState = useMemo(() => {
    return createVoiceSessionState({
      active: true,
      hidden,
      degradedText: degradedTextMode,
      isStarting,
      isListening,
      isThinking,
      isTTSSpeaking,
      hasError: mode === 'erro',
    })
  }, [degradedTextMode, hidden, isListening, isStarting, isThinking, isTTSSpeaking, mode])

  useEffect(() => {
    if (!clickedContext) return
    const timeoutId = window.setTimeout(() => {
      setClickedContext(prev =>
        prev && Date.now() - prev.timestamp >= CLICK_CONTEXT_TTL_MS ? null : prev
      )
    }, CLICK_CONTEXT_TTL_MS)
    return () => clearTimeout(timeoutId)
  }, [clickedContext, setClickedContext])

  useEffect(() => {
    return () => {
      cleanupHighlight()
      cleanupNavigation()
      abortControllerRef.current?.abort()
      cleanupVoice()
    }
  }, [cleanupHighlight, cleanupNavigation, cleanupVoice, abortControllerRef])

  useEffect(() => {
    if (!speechAvailable) {
      setDegradedTextMode(true)
      setVoiceIssue('speech_not_supported')
      setDiagnosticMessage('Captura de voz não disponível neste navegador. O Davi entrou em modo texto.')
      setCaption('Captura de voz não disponível neste navegador. O Davi entrou em modo texto.')
    }
  }, [speechAvailable, setDiagnosticMessage, setVoiceIssue])

  useEffect(() => {
    if (
      voiceIssue === 'speech_not_supported' ||
      voiceIssue === 'mic_denied' ||
      voiceIssue === 'tts_unavailable' ||
      voiceIssue === 'autoplay_blocked' ||
      voiceIssue === 'audio_capture_failed' ||
      voiceIssue === 'tts_failed'
    ) {
      setDegradedTextMode(true)
      stopListening()
    }
  }, [stopListening, voiceIssue])

  useEffect(() => {
    if (!useVoice || hidden || bootstrappedVoiceRef.current) return
    bootstrappedVoiceRef.current = true
    const timeoutId = window.setTimeout(() => {
      startVoiceSession().catch(() => {})
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [hidden, startVoiceSession, useVoice])

  useEffect(() => {
    if (!useVoice || !qaAnswer || isThinking || isTTSSpeaking) return
    if (qaAnswer === lastCompletedAnswerRef.current) return

    lastCompletedAnswerRef.current = qaAnswer
    const timeoutId = window.setTimeout(() => {
      resumeIfAllowed()
    }, 450)
    return () => clearTimeout(timeoutId)
  }, [isTTSSpeaking, isThinking, qaAnswer, resumeIfAllowed, useVoice])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resumeIfAllowed()
      } else {
        stopListening()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [resumeIfAllowed, stopListening])

  useEffect(() => {
    if (!cancelSelectionToken) return
    setSelectionMode(false)
    setHintMessage('Seleção cancelada. Continue pelo chat ou reative a seleção.')
  }, [cancelSelectionToken, setHintMessage])

  const memoizedMessages = useMemo(
    () =>
      conversationHistory.map((msg, idx) => (
        <div key={`${msg.timestamp}-${idx}`}>
          {msg.question && (
            <ChatMessage role="user" content={msg.question} timestamp={msg.timestamp} />
          )}
          {msg.answer && (
            <ChatMessage
              role="assistant"
              content={msg.answer}
              timestamp={msg.timestamp}
            />
          )}
        </div>
      )),
    [conversationHistory]
  )

  return (
    <div
      ref={assistantRootRef}
      className={`relative z-20 flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black/65 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl transition-all ${
        hidden ? 'pointer-events-none invisible opacity-0' : 'pointer-events-auto opacity-100'
      } ${
        shouldUnlockSelectionSurface ? 'opacity-70' : ''
      }`}
    >
      <div className="flex h-full flex-col">
        <AssistantHeader
          runtimeState={runtimeState}
          voiceIssue={voiceIssue}
          continuousMode={continuousMode}
          selectionMode={selectionMode}
          speechAvailable={speechAvailable}
          onDeactivate={onHide ?? (() => {})}
        />
        <ChatArea
          memoizedMessages={memoizedMessages}
          isThinking={isThinking}
          chatEndRef={chatEndRef}
          caption={caption}
          hintMessage={hintMessage}
          liveHintFallback={liveHintFallback}
          clickedContext={clickedContext}
          setClickedContext={setClickedContext}
          setHintMessage={setHintMessage}
          selectionMode={selectionMode}
          hasMessages={conversationHistory.length > 0}
        />
        <InputArea
          enableTranscriptDebug={enableTranscriptDebug}
          continuousMode={continuousMode}
          isThinking={isThinking}
          speechAvailable={speechAvailable}
          ttsAvailable={ttsAvailable}
          mode={mode}
          runtimeState={runtimeState}
          question={question}
          setQuestion={setQuestion}
          handleAsk={handleAsk}
          handleExportTranscript={handleExportTranscript}
          handleClearTranscript={handleClearTranscript}
          diagnosticMessage={diagnosticMessage}
          voiceIssue={voiceIssue}
          showFallbackInput={degradedTextMode}
        />
      </div>
    </div>
  )
}
