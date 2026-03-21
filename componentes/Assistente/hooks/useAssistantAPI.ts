'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { speakText } from '@/biblioteca/assistente/textToSpeech'
import { detectIntent } from '@/biblioteca/assistente/intentDetection'
import { pickVariant } from '@/biblioteca/assistente/knowledgeBase'
import type { KBAction } from '@/biblioteca/assistente/knowledgeBase'
import { stopHighlight } from '@/biblioteca/assistente/cometEvents'
import type { ClickedContext } from './useClickContext'
import type { TranscriptEntry, AssistantMode } from '../types'
import { CLICK_CONTEXT_TTL_MS, MAX_SPOKEN_LEN } from '../types'
import { normalizeTtsText } from '../utils'

/**
 * Gerencia a lógica principal de perguntas/respostas do assistente:
 * validação, intent detection, chamada à API, TTS e atualização de histórico.
 */
export function useAssistantAPI(args: {
  sessionIdRef: React.MutableRefObject<string | null>
  conversationHistory: TranscriptEntry[]
  setConversationHistory: React.Dispatch<React.SetStateAction<TranscriptEntry[]>>
  clickedContext: ClickedContext | null
  setClickedContext: React.Dispatch<React.SetStateAction<ClickedContext | null>>
  setHintMessage: (msg: string) => void
  visibleElements: string[]
  useVoice: boolean
  isListeningRef: React.MutableRefObject<boolean>
  continuousMode: boolean
  stopListeningRef: React.MutableRefObject<() => void>
  processActions: (actions: KBAction[]) => void
  question: string
  setQuestion: (q: string) => void
  setCaption: (c: string) => void
}) {
  const {
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
  } = args

  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [mode, setMode] = useState<AssistantMode>('normal')
  const [qaAnswer, setQaAnswer] = useState('')
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const handleAskRef = useRef<
    ((speechAvailable: boolean, ttsAvailable: boolean) => Promise<void>) | null
  >(null)

  const shouldClearClickedContext = useCallback((text: string): boolean => {
    const normalized = text.toLowerCase().trim()
    const clearPhrases = [
      'ja entendi', 'já entendi', 'entendi', 'obrigado', 'obrigada', 'valeu',
      'ok', 'beleza', 'tudo bem', 'não precisa', 'nao precisa', 'pode seguir',
      'segue', 'próximo', 'proximo', 'mudar assunto', 'outro assunto',
      'outra coisa', 'outra parte', 'quero ver outra', 'pode ir', 'segue em frente',
    ]
    return clearPhrases.some(phrase => normalized.includes(phrase))
  }, [])

  const appendFollowUp = useCallback((text: string): string => {
    const trimmed = text.trim()
    if (!trimmed) return text
    if (trimmed.endsWith('?')) return trimmed
    if (/quer saber mais/i.test(trimmed)) return trimmed
    const next = `${trimmed} Quer saber mais sobre esse assunto?`
    return next.length > MAX_SPOKEN_LEN ? trimmed : next
  }, [])

  const handleAsk = useCallback(
    async (speechAvailable: boolean, ttsAvailable: boolean) => {
      const q = question.trim()
      if (!q) return
      if (q.length > 300) {
        setCaption('Resuma sua pergunta em até 300 caracteres.')
        return
      }

      if (clickedContext && shouldClearClickedContext(q)) {
        const clearMessage =
          'Perfeito. Se quiser, posso explicar outra parte. Dê um duplo clique no item e pergunte.'
        setClickedContext(null)
        setHintMessage(clearMessage)
        setQaAnswer(clearMessage)
        setCaption(clearMessage)
        setConversationHistory(prev =>
          [...prev, { question: q, answer: clearMessage, timestamp: Date.now() }].slice(-10)
        )
        if (useVoice && ttsAvailable) {
          setIsTTSSpeaking(true)
          try {
            await speakText(normalizeTtsText(clearMessage))
          } finally {
            setIsTTSSpeaking(false)
          }
        }
        return
      }

      if (isListeningRef.current && !continuousMode) {
        stopListeningRef.current()
      }

      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      sessionStorage.removeItem('pendingNavigation')
      stopHighlight()

      const questionTimestamp = Date.now()
      setConversationHistory(prev => [
        ...prev,
        { question: q, answer: '', timestamp: questionTimestamp },
      ])
      setQuestion('')
      setIsThinking(true)
      setIsStreaming(false)

      const intent = detectIntent(q, {
        detectMultiple: true,
        considerHistory: true,
        useFuzzy: true,
      })

      const recentHistory = conversationHistory
        .filter(h => h.question)
        .slice(-5)
        .map(h => ({ role: 'user' as const, content: h.question }))

      const now = Date.now()
      const activeClick =
        clickedContext && now - clickedContext.timestamp < CLICK_CONTEXT_TTL_MS
          ? clickedContext
          : null

      const context: Record<string, unknown> = {
        currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
        visibleSections: visibleElements,
        intent: intent.type,
        intentConfidence: intent.confidence,
      }
      if (activeClick) {
        if (activeClick.targetId) context.clickedTargetId = activeClick.targetId
        if (activeClick.text) context.clickedText = activeClick.text
        if (activeClick.tag) context.clickedTag = activeClick.tag
      }

      try {
        const headers: Record<string, string> = { 'content-type': 'application/json' }
        if (sessionIdRef.current) {
          headers['x-user-id'] = sessionIdRef.current
        }

        const resp = await fetch('/api/assistente/perguntar', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            question: q,
            history: recentHistory,
            context,
          }),
          signal: abortControllerRef.current.signal,
        })
        const data = await resp.json()
        setIsThinking(false)

        if (!resp.ok) {
          setMode(data?.mode === 'economico' ? 'economico' : 'erro')
          setCaption(data?.error ?? 'Não consegui responder agora.')
          setQaAnswer('')
          setConversationHistory(prev => {
            const updated = [...prev]
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                answer: data?.error ?? 'Erro ao processar.',
              }
            }
            return updated
          })
          return
        }

        let spoken = data?.spokenText
        if (!spoken && data?.entryId && data?.responses) {
          spoken = pickVariant(data.responses, data.entryId)
        } else if (!spoken) {
          spoken = 'Posso ajudar nisso.'
        }

        if (activeClick) {
          spoken = appendFollowUp(spoken)
        }

        setMode(data?.mode === 'economico' ? 'economico' : 'normal')
        setQaAnswer(spoken)
        setCaption(spoken)

        if (useVoice && ttsAvailable) {
          if (continuousMode && isListeningRef.current) {
            stopListeningRef.current()
          }
          setIsTTSSpeaking(true)
          try {
            await speakText(normalizeTtsText(spoken))
          } finally {
            setIsTTSSpeaking(false)
          }
        }

        setConversationHistory(prev => {
          const updated = [...prev]
          if (updated.length > 0 && updated[updated.length - 1].question === q) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              answer: spoken,
            }
          } else {
            updated.push({ question: q, answer: spoken, timestamp: questionTimestamp })
          }
          return updated.slice(-10)
        })

        const actions = Array.isArray(data?.actions) ? data.actions : []
        processActions(actions as KBAction[])

        if (activeClick) {
          setClickedContext(prev =>
            prev ? { ...prev, timestamp: Date.now() } : prev
          )
        }

        if (continuousMode && useVoice) {
          setQuestion('')
        }
      } catch (err: unknown) {
        setIsThinking(false)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setMode('erro')
        setCaption('Falha ao consultar o assistente. Tente novamente.')
        setQaAnswer('')
        setConversationHistory(prev => {
          const updated = [...prev]
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              answer: 'Erro ao processar. Tente novamente.',
            }
          }
          return updated
        })
      }
    },
    [
      question, visibleElements, conversationHistory, clickedContext,
      appendFollowUp, shouldClearClickedContext, processActions,
      continuousMode, useVoice, setCaption, setQuestion,
      setConversationHistory, setClickedContext, setHintMessage, sessionIdRef,
      isListeningRef, stopListeningRef,
    ]
  )

  useEffect(() => {
    handleAskRef.current = handleAsk
  }, [handleAsk])

  return {
    handleAsk,
    handleAskRef,
    isThinking,
    isStreaming,
    mode,
    qaAnswer,
    setQaAnswer,
    isTTSSpeaking,
    setIsTTSSpeaking,
    setMode,
    setIsThinking,
    setIsStreaming,
    abortControllerRef,
  }
}
