'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TTSResult } from '@/biblioteca/assistente/textToSpeech'
import { speakText } from '@/biblioteca/assistente/textToSpeech'
import { detectIntent } from '@/biblioteca/assistente/intentDetection'
import { inferTopicHintFromText, questionLooksIndependent } from '@/biblioteca/assistente/conversationSignals'
import { pickVariant } from '@/biblioteca/assistente/knowledgeBase'
import type { KBAction } from '@/biblioteca/assistente/knowledgeBase'
import { stopHighlight } from '@/biblioteca/assistente/cometEvents'
import type { ClickedContext } from './useClickContext'
import type { TranscriptEntry, AssistantMode, VoiceIssue } from '../types'
import { CLICK_CONTEXT_TTL_MS } from '../types'
import { normalizeTtsText } from '../utils'

export function buildConversationHistory(history: TranscriptEntry[]) {
  return history
    .flatMap(entry => {
      const turns: Array<{ role: 'user' | 'assistant'; content: string }> = []
      if (entry.question) turns.push({ role: 'user', content: entry.question })
      if (entry.answer) turns.push({ role: 'assistant', content: entry.answer })
      return turns
    })
    .slice(-12)
    .map(entry => ({ ...entry, content: entry.content.slice(0, 240) }))
}

function trimByPriority(content: string, limit: number) {
  return content.replace(/\s+/g, ' ').trim().slice(0, limit)
}

export function buildConversationPayload(
  history: TranscriptEntry[],
  currentQuestion: string,
  activeClick?: ClickedContext | null
) {
  const relevantEntries = history
    .filter(entry => entry.question || entry.answer)
    .slice(-3)

  const historyTurns = relevantEntries.flatMap((entry, index) => {
    const isNewest = index === relevantEntries.length - 1
    const isMiddle = index === relevantEntries.length - 2
    const questionLimit = isNewest ? 240 : isMiddle ? 180 : 120
    const answerLimit = isNewest ? 320 : isMiddle ? 220 : 160
    const turns: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (entry.question) turns.push({ role: 'user', content: trimByPriority(entry.question, questionLimit) })
    if (entry.answer) turns.push({ role: 'assistant', content: trimByPriority(entry.answer, answerLimit) })
    return turns
  })

  const lastEntry = [...history].reverse().find(entry => entry.question || entry.answer)
  const lastQuestion = lastEntry?.question || ''
  const lastAnswer = lastEntry?.answer || ''
  const lastTopicHint = inferTopicHintFromText(lastQuestion, lastAnswer)
  const independent = questionLooksIndependent(currentQuestion, lastTopicHint)

  const summaryParts = [
    lastTopicHint ? `Último tópico: ${lastTopicHint}.` : '',
    lastQuestion ? `Última pergunta: ${trimByPriority(lastQuestion, 120)}.` : '',
    lastAnswer ? `Última resposta útil: ${trimByPriority(lastAnswer, 180)}.` : '',
    activeClick?.text ? `Último contexto de clique: ${trimByPriority(activeClick.text, 90)}.` : '',
  ].filter(Boolean)

  return {
    history: historyTurns,
    summary: summaryParts.join(' '),
    lastQuestion,
    lastAnswer,
    lastTopicHint,
    questionLooksIndependent: independent,
  }
}

function mapAssistantError(data: Record<string, unknown>): string {
  const errorType = typeof data.errorType === 'string' ? data.errorType : ''

  if (errorType === 'quota_exceeded') {
    return 'A IA ficou sem créditos ou quota disponível. O chat continua em texto quando houver resposta da KB.'
  }
  if (errorType === 'rate_limited') {
    return 'O provider limitou temporariamente as requisições. Aguarde um pouco e tente de novo.'
  }
  if (errorType === 'unauthorized') {
    return 'A configuração da chave da IA está inválida no servidor.'
  }
  if (errorType === 'timeout') {
    return 'A IA demorou demais para responder. Tente uma pergunta mais curta.'
  }
  if (errorType === 'model_not_found') {
    return 'O modelo configurado não está disponível neste provider.'
  }
  if (errorType === 'missing_api_key') {
    return 'O assistente de IA não está configurado neste ambiente. Respostas cobertas pela base de conhecimento continuam funcionando.'
  }

  return ''
}

export function mapTtsResultToVoiceIssue(result: TTSResult): VoiceIssue {
  if (result.ok) return 'none'
  switch (result.reason) {
    case 'autoplay_blocked':
      return 'autoplay_blocked'
    case 'tts_unavailable':
      return 'tts_unavailable'
    default:
      return 'tts_failed'
  }
}

export function getVoiceDiagnosticMessage(issue: VoiceIssue): string {
  switch (issue) {
    case 'autoplay_blocked':
      return 'O navegador não liberou áudio automático. A resposta foi mantida no chat e você pode tocar em "Ouvir resposta".'
    case 'tts_unavailable':
      return 'Este navegador não oferece fala confiável aqui. A resposta continua disponível em texto.'
    case 'mic_denied':
      return 'O microfone foi bloqueado. Libere a permissão no cadeado do navegador ou siga em texto.'
    case 'speech_not_supported':
      return 'Este navegador não suporta captura de voz confiável aqui. O chat continua em texto.'
    case 'no_speech':
      return 'Nenhum áudio foi detectado. Tente falar novamente ou use o texto.'
    case 'audio_capture_failed':
      return 'Não foi possível capturar o microfone. Verifique a permissão e o dispositivo de áudio.'
    case 'stt_timeout':
      return 'A captura ficou em silêncio por muito tempo. Tente de novo ou use o texto.'
    case 'tts_failed':
      return 'A resposta chegou no chat, mas a fala falhou desta vez. Você pode tentar "Ouvir resposta".'
    default:
      return ''
  }
}

/**
 * Gerencia a lógica principal de perguntas/respostas do assistente:
 * validação, histórico, chamada à API, TTS e atualização de UI.
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
  const [mode, setMode] = useState<AssistantMode>('normal')
  const [qaAnswer, setQaAnswer] = useState('')
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false)
  const [diagnosticMessage, setDiagnosticMessage] = useState('')
  const [audioReplayText, setAudioReplayText] = useState('')
  const [voiceIssue, setVoiceIssue] = useState<VoiceIssue>('none')

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

  const replayAudio = useCallback(async () => {
    if (!audioReplayText) return
    setIsTTSSpeaking(true)
    try {
      const result = await speakText(normalizeTtsText(audioReplayText), {
        kind: 'replay',
        interrupt: true,
      })
      if (!result.ok) {
        const issue = mapTtsResultToVoiceIssue(result)
        setVoiceIssue(issue)
        setDiagnosticMessage(getVoiceDiagnosticMessage(issue))
      } else {
        setVoiceIssue('none')
        setDiagnosticMessage('')
      }
    } finally {
      setIsTTSSpeaking(false)
    }
  }, [audioReplayText])

  const handleAsk = useCallback(
    async (_speechAvailable: boolean, ttsAvailable: boolean) => {
      const q = question.trim()
      if (!q) return
      if (q.length > 300) {
        setCaption('Resuma sua pergunta em até 300 caracteres.')
        return
      }

      if (clickedContext && shouldClearClickedContext(q)) {
        const clearMessage =
          'Perfeito. Se quiser, posso explicar outra parte. Use "Selecionar item" para apontar um novo assunto.'
        setClickedContext(null)
        setHintMessage(clearMessage)
        setQaAnswer(clearMessage)
        setCaption(clearMessage)
        setAudioReplayText(clearMessage)
        setVoiceIssue('none')
        setConversationHistory(prev =>
          [...prev, { question: q, answer: clearMessage, timestamp: Date.now() }].slice(-10)
        )
        if (useVoice && ttsAvailable) {
          setIsTTSSpeaking(true)
          try {
            const ttsResult = await speakText(normalizeTtsText(clearMessage), {
              kind: 'assistant-answer',
              interrupt: true,
            })
            if (!ttsResult.ok) {
              const issue = mapTtsResultToVoiceIssue(ttsResult)
              setVoiceIssue(issue)
              setDiagnosticMessage(getVoiceDiagnosticMessage(issue))
            }
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
      setDiagnosticMessage('')
      setVoiceIssue('none')

      const intent = detectIntent(q, {
        detectMultiple: true,
        considerHistory: true,
        useFuzzy: true,
      })

      const now = Date.now()
      const activeClick =
        clickedContext && now - clickedContext.timestamp < CLICK_CONTEXT_TTL_MS
          ? clickedContext
          : null
      const conversationPayload = buildConversationPayload(conversationHistory, q, activeClick)

      const context: Record<string, unknown> = {
        currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
        visibleSections: visibleElements,
        intent: intent.type,
        intentConfidence: intent.confidence,
        conversationSummary: conversationPayload.summary,
        lastQuestion: conversationPayload.lastQuestion,
        lastAnswer: conversationPayload.lastAnswer,
        lastTopicHint: conversationPayload.lastTopicHint,
        questionLooksIndependent: conversationPayload.questionLooksIndependent,
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
            history: conversationPayload.history,
            context,
          }),
          signal: abortControllerRef.current.signal,
        })
        const data = (await resp.json()) as Record<string, unknown>
        setIsThinking(false)

        if (!resp.ok) {
          const errorMessage =
            typeof data.error === 'string' ? data.error : 'Não consegui responder agora.'
          setMode(data?.mode === 'economico' ? 'economico' : 'erro')
          setCaption(errorMessage)
          setQaAnswer(errorMessage)
          setAudioReplayText('')
          setDiagnosticMessage(mapAssistantError(data))
          setConversationHistory(prev => {
            const updated = [...prev]
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                answer: errorMessage,
              }
            }
            return updated.slice(-10)
          })
          return
        }

        let spoken = typeof data.spokenText === 'string' ? data.spokenText : ''
        if (!spoken && typeof data.entryId === 'string' && Array.isArray(data.responses)) {
          spoken = pickVariant(data.responses as string[], data.entryId)
        } else if (!spoken) {
          spoken = 'Posso ajudar nisso.'
        }

        setMode(data?.mode === 'economico' ? 'economico' : 'normal')
        setQaAnswer(spoken)
        setCaption(spoken)
        setAudioReplayText(spoken)

        if (useVoice && ttsAvailable) {
          if (continuousMode && isListeningRef.current) {
            stopListeningRef.current()
          }
          setIsTTSSpeaking(true)
          try {
            const ttsResult = await speakText(normalizeTtsText(spoken), {
              kind: 'assistant-answer',
              interrupt: true,
            })
            if (!ttsResult.ok) {
              const issue = mapTtsResultToVoiceIssue(ttsResult)
              setVoiceIssue(issue)
              setDiagnosticMessage(getVoiceDiagnosticMessage(issue))
            } else {
              setVoiceIssue('none')
            }
          } finally {
            setIsTTSSpeaking(false)
          }
        } else if (useVoice && !ttsAvailable) {
          setVoiceIssue('tts_unavailable')
          setDiagnosticMessage(getVoiceDiagnosticMessage('tts_unavailable'))
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

        const actions = Array.isArray(data.actions) ? data.actions : []
        processActions(actions as KBAction[])

        if (activeClick) {
          setClickedContext(prev => (prev ? { ...prev, timestamp: Date.now() } : prev))
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
        setAudioReplayText('')
        setVoiceIssue('none')
        setDiagnosticMessage('A requisição falhou antes de concluir. Verifique a rede e tente novamente.')
        setConversationHistory(prev => {
          const updated = [...prev]
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              answer: 'Erro ao processar. Tente novamente.',
            }
          }
          return updated.slice(-10)
        })
      }
    },
    [
      question, visibleElements, conversationHistory, clickedContext,
      shouldClearClickedContext, processActions,
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
    mode,
    qaAnswer,
    setQaAnswer,
    isTTSSpeaking,
    setIsTTSSpeaking,
    setMode,
    setIsThinking,
    abortControllerRef,
    diagnosticMessage,
    voiceIssue,
    canReplayAudio: !!audioReplayText,
    replayAudio,
  }
}
