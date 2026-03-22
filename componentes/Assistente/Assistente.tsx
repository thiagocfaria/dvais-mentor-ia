'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { speakText } from '@/biblioteca/assistente/textToSpeech'
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
import { ConsentModal } from './ConsentModal'
import type { GuidedStep, VoiceRuntimeState } from './types'
import { CLICK_CONTEXT_TTL_MS } from './types'
import { hasSTT, hasTTS, isCoarsePointerDevice, normalizeTtsText } from './utils'

type AssistenteProps = {
  onMobileSelectionModeChange?: (active: boolean) => void
  cancelSelectionToken?: number
}

export default function Assistente({
  onMobileSelectionModeChange,
  cancelSelectionToken = 0,
}: AssistenteProps) {
  const [isActive, setIsActive] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [useVoice, setUseVoice] = useState(false)
  const [caption, setCaption] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
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
    ? 'Seleção ativa. Toque em um item da página para explicar aquela parte.'
    : 'Escreva sua pergunta ou use "Selecionar item" para capturar contexto da página.'

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

  const steps: GuidedStep[] = useMemo(
    () => [
      {
        id: 'hero',
        title: 'Página inicial',
        description:
          'Aqui fica a visão geral do produto, com proposta, métricas e entrada para cadastro.',
        targetId: 'hero-content',
      },
      {
        id: 'features',
        title: 'Capacidades do assistente',
        description:
          'Esta seção resume voz, clique contextual, validação de ações e a camada de resiliência.',
        targetId: 'features-section',
      },
      {
        id: 'stats',
        title: 'Indicadores do projeto',
        description:
          'Aqui você vê a parte de stack, testes e foco técnico desta vitrine.',
        targetId: 'stats-section',
      },
    ],
    []
  )

  const runStep = useCallback(
    (index: number) => {
      const step = steps[index]
      if (!step) return
      setCurrentIndex(index)
      const msg = step.description || step.title
      setCaption(msg)
      setHintMessage(msg)
      if (useVoice && hasTTS()) {
        speakText(normalizeTtsText(msg)).catch(() => {})
      }
      highlight(step.targetId)
    },
    [useVoice, highlight, steps, setHintMessage]
  )

  const activate = useCallback(
    (withVoice: boolean, continuous: boolean = false) => {
      const voiceEnabled = withVoice && speechAvailable
      const continuousAllowed = continuous && voiceEnabled && !isCoarsePointer

      setUseVoice(voiceEnabled)
      setIsActive(true)
      setShowConsent(false)
      setCurrentIndex(0)
      setSelectionMode(false)
      setContinuousMode(continuousAllowed)

      const introMessage = continuousAllowed
        ? 'Assistente ativado. Você pode falar naturalmente ou selecionar uma parte da página para eu explicar.'
        : 'Assistente ativado. Use o chat, o microfone manual ou o botão "Selecionar item" para capturar contexto.'

      setHintMessage(introMessage)
      setCaption(introMessage)
      setConversationHistory(prev =>
        [...prev, { question: '', answer: introMessage, timestamp: Date.now() }].slice(-10)
      )

      const startLive = () => {
        if (startLiveTimeoutRef.current !== null) {
          clearTimeout(startLiveTimeoutRef.current)
        }
        startLiveTimeoutRef.current = window.setTimeout(() => {
          if (startContinuousListeningRef.current) {
            startContinuousListeningRef.current()
          }
          startLiveTimeoutRef.current = null
        }, 500)
      }

      if (continuousAllowed) {
        if (voiceEnabled && ttsAvailable) {
          setIsTTSSpeaking(true)
          speakText(normalizeTtsText(introMessage))
            .catch(() => {})
            .finally(() => {
              setIsTTSSpeaking(false)
              startLive()
            })
        } else {
          startLive()
        }
      }
    },
    [
      isCoarsePointer,
      setConversationHistory,
      setHintMessage,
      setIsTTSSpeaking,
      speechAvailable,
      startContinuousListeningRef,
      ttsAvailable,
    ]
  )

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

  const liveHintMessage = hintMessage || caption || liveHintFallback

  return (
    <div
      ref={assistantRootRef}
      className={`relative z-20 flex h-full min-h-[540px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black/65 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl ${
        shouldUnlockSelectionSurface ? 'opacity-70' : ''
      }`}
    >
      {!isActive ? (
        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Assistente contextual
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Chat por texto, voz opcional e contexto por toque.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              A experiência recomendada no celular é texto + toque. Quando o navegador suportar bem a captura, você pode usar voz manual ou conversa contínua no desktop.
            </p>
          </div>

          <button
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition-colors hover:from-cyan-400 hover:to-blue-500"
            onClick={() => setShowConsent(true)}
          >
            Ativar assistente
          </button>

          <p className="text-xs text-slate-400">
            Funciona em texto em qualquer dispositivo compatível com o site. Voz depende do navegador e das permissões.
          </p>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <AssistantHeader
            runtimeState={runtimeState}
            continuousMode={continuousMode}
            selectionMode={selectionMode}
            speechAvailable={speechAvailable}
            isCoarsePointer={isCoarsePointer}
            onToggleSelection={toggleSelectionMode}
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
            liveHintMessage={liveHintMessage}
            steps={steps}
            currentIndex={currentIndex}
            setQuestion={setQuestion}
            handleAsk={handleAsk}
            toggleListening={toggleListening}
            runStep={runStep}
            handleExportTranscript={handleExportTranscript}
            handleClearTranscript={handleClearTranscript}
            selectionMode={selectionMode}
            toggleSelectionMode={toggleSelectionMode}
            canReplayAudio={canReplayAudio}
            replayAudio={replayAudio}
            diagnosticMessage={diagnosticMessage}
            isCoarsePointer={isCoarsePointer}
          />
        </div>
      )}

      {showConsent && (
        <ConsentModal
          speechAvailable={speechAvailable}
          isCoarsePointer={isCoarsePointer}
          onActivate={activate}
          onCancel={() => setShowConsent(false)}
        />
      )}
    </div>
  )
}
