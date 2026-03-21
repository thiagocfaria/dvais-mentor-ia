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
import type { GuidedStep } from './types'
import { CLICK_CONTEXT_TTL_MS } from './types'
import { hasSTT, hasTTS, normalizeTtsText } from './utils'

export default function Assistente() {
  // --- UI state ---
  const [isActive, setIsActive] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [useVoice, setUseVoice] = useState(false)
  const [caption, setCaption] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [question, setQuestion] = useState('')
  const [continuousMode, setContinuousMode] = useState(false)

  const assistantRootRef = useRef<HTMLDivElement>(null)
  const startLiveTimeoutRef = useRef<number | null>(null)
  // Refs to break circular dependency between useAssistantAPI and useLiveVoice
  const isListeningRef = useRef(false)
  const stopListeningRef = useRef<() => void>(() => {})
  const sharedHandleAskRef = useRef<((speechAvailable: boolean, ttsAvailable: boolean) => Promise<void>) | null>(null)

  const showTextDebug = process.env.NEXT_PUBLIC_ASSISTENTE_TEXT_DEBUG === 'true'
  const enableTranscriptDebug = process.env.NODE_ENV !== 'production' || showTextDebug
  const liveHintFallback =
    'Use clique único para abrir e duplo clique rápido para selecionar o assunto.'

  // --- hooks ---
  const sessionIdRef = useAssistantSession()
  const visibleElements = useVisibleElements(isActive)
  const { highlight, highlightElement, cleanupHighlight, highlightTimeoutRef } = useHighlight()

  const {
    conversationHistory, setConversationHistory,
    lastQuestion, lastAnswer,
    handleExportTranscript, handleClearTranscript,
    chatEndRef,
  } = useConversationHistory({ sessionIdRef, enableTranscriptDebug })

  const { clickedContext, setClickedContext, hintMessage, setHintMessage } = useClickContext({
    isActive,
    showTextDebug,
    assistantRootRef,
    highlight,
    highlightElement,
  })

  const { processActions, handleNavigation, cleanupNavigation } = useNavigationActions({
    isActive,
    useVoice,
    highlight,
    highlightTimeoutRef,
    setCaption,
  })

  // Refs for continuous restart (needed by both useLiveVoice and useAssistantAPI)
  const isActiveRef = useRef(isActive)
  const continuousModeRef = useRef(continuousMode)
  const isThinkingRef = useRef(false)
  const isTTSSpeakingRef = useRef(false)

  const {
    isListening, setIsListening,
    toggleListening, startContinuousListeningRef,
    stopListening, cleanupVoice,
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

  // Wire refs to break circular dependency
  useEffect(() => { isListeningRef.current = isListening }, [isListening])
  useEffect(() => { stopListeningRef.current = stopListening }, [stopListening])

  const {
    handleAsk, handleAskRef,
    isThinking, isStreaming, mode, qaAnswer,
    setQaAnswer, isTTSSpeaking, setIsTTSSpeaking, setMode,
    abortControllerRef,
  } = useAssistantAPI({
    sessionIdRef,
    conversationHistory, setConversationHistory,
    clickedContext, setClickedContext,
    setHintMessage,
    visibleElements,
    useVoice,
    isListeningRef,
    continuousMode,
    stopListeningRef,
    processActions,
    question, setQuestion,
    setCaption,
  })

  // Sync refs after state is available
  useEffect(() => { sharedHandleAskRef.current = handleAsk }, [handleAsk])
  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { continuousModeRef.current = continuousMode }, [continuousMode])
  useEffect(() => { isThinkingRef.current = isThinking }, [isThinking])
  useEffect(() => { isTTSSpeakingRef.current = isTTSSpeaking }, [isTTSSpeaking])

  const { isRestartingRef } =
    useContinuousRestart({
      continuousMode, useVoice, isThinking, isListening,
      isActive, qaAnswer, isTTSSpeaking, startContinuousListeningRef,
    })

  // --- derived state ---
  const liveHintMessage = hintMessage || (caption && caption !== qaAnswer ? caption : liveHintFallback)
  const speechAvailable = hasSTT()
  const ttsAvailable = hasTTS()

  // --- effects ---

  // Click context TTL expiration
  useEffect(() => {
    if (!clickedContext) return
    const timeoutId = window.setTimeout(() => {
      setClickedContext(prev =>
        prev && Date.now() - prev.timestamp >= CLICK_CONTEXT_TTL_MS ? null : prev
      )
    }, CLICK_CONTEXT_TTL_MS)
    return () => clearTimeout(timeoutId)
  }, [clickedContext, setClickedContext])

  // Disable text selection in live mode
  useEffect(() => {
    if (typeof window === 'undefined' || !isActive || showTextDebug) return
    const bodyStyle = document.body.style
    const prevUserSelect = bodyStyle.userSelect
    const prevWebkitUserSelect = (bodyStyle as CSSStyleDeclaration & Record<string, string>).webkitUserSelect
    const prevTouchCallout = (bodyStyle as CSSStyleDeclaration & Record<string, string>).webkitTouchCallout

    bodyStyle.userSelect = 'none'
    ;(bodyStyle as CSSStyleDeclaration & Record<string, string>).webkitUserSelect = 'none'
    ;(bodyStyle as CSSStyleDeclaration & Record<string, string>).webkitTouchCallout = 'none'

    return () => {
      bodyStyle.userSelect = prevUserSelect
      ;(bodyStyle as CSSStyleDeclaration & Record<string, string>).webkitUserSelect = prevWebkitUserSelect
      ;(bodyStyle as CSSStyleDeclaration & Record<string, string>).webkitTouchCallout = prevTouchCallout
    }
  }, [isActive, showTextDebug])

  // Component cleanup
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

  // --- guided tour ---
  const steps: GuidedStep[] = useMemo(
    () => [
      {
        id: 'hero',
        title: 'Bem-vindo ao DVAi$',
        description:
          'Esta é a página inicial. Aqui você encontra informações sobre a plataforma e pode começar seu cadastro clicando em "Começar Agora".',
        targetId: 'hero-content',
      },
      {
        id: 'features',
        title: 'Funcionalidades chave',
        description:
          'O DVAi$ oferece três pilares principais: análise guiada de interface, proteção inteligente para reduzir erro operacional e aprendizado contínuo para explicar o produto com clareza.',
        targetId: 'features-section',
      },
      {
        id: 'stats',
        title: 'Resultados e métricas',
        description:
          'Veja os indicadores técnicos desta vitrine, incluindo foco em stack, testes e operação do projeto.',
        targetId: 'stats-section',
      },
    ],
    []
  )

  const runStep = useCallback(
    (index: number) => {
      const step = steps[index]
      if (!step) return
      const msg = step.description || step.title
      setCaption(msg)
      if (useVoice && hasTTS()) speakText(normalizeTtsText(msg))
      highlight(step.targetId)
    },
    [useVoice, highlight, steps]
  )

  const activate = useCallback(
    (withVoice: boolean, continuous: boolean = false) => {
      const voiceEnabled = withVoice && hasSTT()
      setUseVoice(voiceEnabled)
      setIsActive(true)
      setShowConsent(false)
      setCurrentIndex(0)
      const willBeContinuous = continuous && voiceEnabled
      setContinuousMode(willBeContinuous)

      const introMessage =
        'Assistente ativado. Clique uma vez para abrir, e dê um duplo clique rápido para selecionar o assunto. Depois pergunte por voz e eu respondo em tempo real.'
      setHintMessage(introMessage)
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

      if (willBeContinuous) {
        if (voiceEnabled && hasTTS()) {
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
      } else {
        runStep(0)
      }
    },
    [runStep, setConversationHistory, setHintMessage, setIsTTSSpeaking, startContinuousListeningRef]
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
    setIsTTSSpeaking(false)
    isRestartingRef.current = false
  }, [stopListening, cleanupHighlight, cleanupNavigation, abortControllerRef, setQaAnswer, setHintMessage, setClickedContext, setMode, setIsListening, setIsTTSSpeaking, isRestartingRef])

  // --- memoized messages ---
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
              isStreaming={isStreaming && idx === conversationHistory.length - 1}
            />
          )}
        </div>
      )),
    [conversationHistory, isStreaming]
  )

  // --- render ---
  return (
    <div
      ref={assistantRootRef}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur flex flex-col relative z-20"
      style={{ minHeight: '500px', maxHeight: '700px' }}
    >
      {!isActive ? (
        <div className="space-y-3 p-4">
          <p className="text-sm text-gray-200">
            Assistente ao vivo (voz). Ative para iniciar a apresentação e tirar dúvidas em tempo real.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500"
              onClick={() => setShowConsent(true)}
            >
              <span className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-20 bg-white/20" />
              <span className="relative flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                  🎧
                </span>
                <span>Ativar IA ao vivo</span>
              </span>
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Voz em tempo real + seleção por clique para explicar cada parte da página.
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <AssistantHeader
            continuousMode={continuousMode}
            isListening={isListening}
            isThinking={isThinking}
            isTTSSpeaking={isTTSSpeaking}
            useVoice={useVoice}
            ttsAvailable={ttsAvailable}
            showTextDebug={showTextDebug}
            onDeactivate={deactivate}
          />
          <ChatArea
            showTextDebug={showTextDebug}
            memoizedMessages={memoizedMessages}
            isThinking={isThinking}
            isStreaming={isStreaming}
            isListening={isListening}
            chatEndRef={chatEndRef}
            lastQuestion={lastQuestion}
            lastAnswer={lastAnswer}
            qaAnswer={qaAnswer}
            caption={caption}
            hintMessage={hintMessage}
            liveHintFallback={liveHintFallback}
            clickedContext={clickedContext}
            setClickedContext={setClickedContext}
            setHintMessage={setHintMessage}
          />
          <InputArea
            showTextDebug={showTextDebug}
            enableTranscriptDebug={enableTranscriptDebug}
            continuousMode={continuousMode}
            isListening={isListening}
            isThinking={isThinking}
            isTTSSpeaking={isTTSSpeaking}
            isStreaming={isStreaming}
            useVoice={useVoice}
            speechAvailable={speechAvailable}
            ttsAvailable={ttsAvailable}
            mode={mode}
            question={question}
            caption={caption}
            qaAnswer={qaAnswer}
            liveHintMessage={liveHintMessage}
            steps={steps}
            currentIndex={currentIndex}
            setQuestion={setQuestion}
            handleAsk={handleAsk}
            toggleListening={toggleListening}
            runStep={runStep}
            handleExportTranscript={handleExportTranscript}
            handleClearTranscript={handleClearTranscript}
          />
        </div>
      )}

      {showConsent && (
        <ConsentModal
          speechAvailable={speechAvailable}
          showTextDebug={showTextDebug}
          onActivate={activate}
          onCancel={() => setShowConsent(false)}
        />
      )}
    </div>
  )
}
