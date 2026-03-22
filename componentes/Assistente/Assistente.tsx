'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { ChatMessage } from './ChatMessage'
import { useAssistantSession } from './hooks/useAssistantSession'
import { useClickContext } from './hooks/useClickContext'
import { useLiveVoice } from './hooks/useLiveVoice'
import { useVisibleElements } from './hooks/useVisibleElements'
import { useHighlight } from './hooks/useHighlight'
import { useConversationHistory } from './hooks/useConversationHistory'
import { useNavigationActions } from './hooks/useNavigationActions'
import { useAssistantAPI } from './hooks/useAssistantAPI'
import { useContinuousRestart } from './hooks/useContinuousRestart'
import { AssistantHeader } from './AssistantHeader'
import { ChatArea } from './ChatArea'
import { InputArea } from './InputArea'
import type { VoiceRuntimeState } from './types'
import { CLICK_CONTEXT_TTL_MS } from './types'
import { hasSTT, hasTTS, isCoarsePointerDevice } from './utils'

type AssistenteProps = {
  onMobileSelectionModeChange?: (active: boolean) => void
  cancelSelectionToken?: number
  onClose?: () => void
}

export default function Assistente({
  onMobileSelectionModeChange,
  cancelSelectionToken = 0,
  onClose,
}: AssistenteProps) {
  const [isActive, setIsActive] = useState(false)
  const [useVoice, setUseVoice] = useState(false)
  const [caption, setCaption] = useState('')
  const [question, setQuestion] = useState('')
  const [continuousMode, setContinuousMode] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  const assistantRootRef = useRef<HTMLDivElement>(null)
  const startLiveTimeoutRef = useRef<number | null>(null)
  const isListeningRef = useRef(false)
  const stopListeningRef = useRef<() => void>(() => {})
  const sharedHandleAskRef = useRef<((speechAvailable: boolean, ttsAvailable: boolean) => Promise<void>) | null>(null)

  const showTextDebug = process.env.NEXT_PUBLIC_ASSISTENTE_TEXT_DEBUG === 'true'
  const enableTranscriptDebug = process.env.NODE_ENV !== 'production' || showTextDebug

  useEffect(() => {
    setIsCoarsePointer(isCoarsePointerDevice())
  }, [])

  const prefersMobileSelectionMode = isCoarsePointer || isCoarsePointerDevice()
  const shouldUnlockSelectionSurface = Boolean(isActive && selectionMode && prefersMobileSelectionMode)

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

  const liveHintFallback = selectionMode
    ? 'Toque em um item da página.'
    : 'Pronto para conversar.'

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

  const isActiveRef = useRef(isActive)
  const continuousModeRef = useRef(continuousMode)
  const isThinkingRef = useRef(false)
  const isTTSSpeakingRef = useRef(false)

  const {
    isListening,
    setIsListening,
    toggleListening,
    startContinuousListeningRef,
    stopListening,
    cleanupVoice,
  } = useLiveVoice({
    hasSTT,
    hasTTS,
    isActiveRef,
    continuousModeRef,
    isThinkingRef,
    isTTSSpeakingRef,
    handleAskRef: sharedHandleAskRef,
    setQuestion,
    setCaption,
    setContinuousMode,
  })

  useEffect(() => { isListeningRef.current = isListening }, [isListening])
  useEffect(() => { stopListeningRef.current = stopListening }, [stopListening])

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
    voiceIssue,
    canReplayAudio,
    replayAudio,
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

  useEffect(() => { sharedHandleAskRef.current = handleAsk }, [handleAsk])
  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { continuousModeRef.current = continuousMode }, [continuousMode])
  useEffect(() => { isThinkingRef.current = isThinking }, [isThinking])
  useEffect(() => { isTTSSpeakingRef.current = isTTSSpeaking }, [isTTSSpeaking])

  const { isRestartingRef } =
    useContinuousRestart({
      continuousMode,
      useVoice,
      isThinking,
      isListening,
      isActive,
      qaAnswer,
      isTTSSpeaking,
      startContinuousListeningRef,
    })

  const speechAvailable = hasSTT()
  const ttsAvailable = hasTTS()

  const runtimeState: VoiceRuntimeState = useMemo(() => {
    if (!isActive) return 'idle'
    if (mode === 'erro') return 'error'
    if (isTTSSpeaking) return 'speaking'
    if (isThinking) return 'thinking'
    if (isListening) return 'listening'
    return selectionMode ? 'armed' : 'idle'
  }, [isActive, isListening, isThinking, isTTSSpeaking, mode, selectionMode])

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
      if (startLiveTimeoutRef.current !== null) {
        clearTimeout(startLiveTimeoutRef.current)
        startLiveTimeoutRef.current = null
      }
      abortControllerRef.current?.abort()
      cleanupVoice()
      isRestartingRef.current = false
    }
  }, [cleanupHighlight, cleanupNavigation, cleanupVoice, abortControllerRef, isRestartingRef])

  // Auto-ativação no mount com defaults por dispositivo (cautela #3)
  useEffect(() => {
    if (isActive) return
    const voiceEnabled = speechAvailable
    setUseVoice(voiceEnabled)
    setContinuousMode(false)
    setSelectionMode(false)
    setIsActive(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deactivate = useCallback(() => {
    cleanupHighlight()
    cleanupNavigation()
    if (startLiveTimeoutRef.current !== null) {
      clearTimeout(startLiveTimeoutRef.current)
      startLiveTimeoutRef.current = null
    }
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    stopListening()
    setIsActive(false)
    setQuestion('')
    setQaAnswer('')
    setCaption('')
    setHintMessage('')
    setClickedContext(null)
    setMode('normal')
    setIsListening(false)
    setContinuousMode(false)
    setSelectionMode(false)
    setIsTTSSpeaking(false)
    isRestartingRef.current = false
    onClose?.()
  }, [
    stopListening,
    cleanupHighlight,
    cleanupNavigation,
    abortControllerRef,
    setQaAnswer,
    setHintMessage,
    setClickedContext,
    setMode,
    setIsListening,
    setIsTTSSpeaking,
    isRestartingRef,
    onClose,
  ])

  const toggleSelectionMode = useCallback(() => {
    const next = !selectionMode
    setSelectionMode(next)
    setHintMessage(
      next
        ? prefersMobileSelectionMode
          ? 'Selecionando item na página. O chat ficou em barra compacta para liberar o toque no conteúdo.'
          : 'Seleção ativa. Toque em um item da página para capturar o contexto dessa parte.'
        : 'Seleção cancelada. Continue pelo chat ou reative a seleção.'
    )
  }, [prefersMobileSelectionMode, selectionMode, setHintMessage])

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
      className={`relative z-20 flex h-full min-h-[540px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black/65 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl ${
        shouldUnlockSelectionSurface ? 'opacity-70' : ''
      }`}
    >
      <div className="flex h-full flex-col">
        {isActive && (
          <>
          <AssistantHeader
            runtimeState={runtimeState}
            voiceIssue={voiceIssue}
            continuousMode={continuousMode}
            selectionMode={selectionMode}
            speechAvailable={speechAvailable}
            isCoarsePointer={isCoarsePointer}
            onDeactivate={deactivate}
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
            isListening={isListening}
            isThinking={isThinking}
            isTTSSpeaking={isTTSSpeaking}
            useVoice={useVoice}
            speechAvailable={speechAvailable}
            ttsAvailable={ttsAvailable}
            mode={mode}
            runtimeState={runtimeState}
            question={question}
            setQuestion={setQuestion}
            handleAsk={handleAsk}
            toggleListening={toggleListening}
            handleExportTranscript={handleExportTranscript}
            handleClearTranscript={handleClearTranscript}
            selectionMode={selectionMode}
            toggleSelectionMode={toggleSelectionMode}
            canReplayAudio={canReplayAudio}
            replayAudio={replayAudio}
            diagnosticMessage={diagnosticMessage}
            voiceIssue={voiceIssue}
            isCoarsePointer={isCoarsePointer}
          />
          </>
        )}
      </div>
    </div>
  )
}
