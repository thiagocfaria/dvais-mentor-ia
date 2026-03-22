'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TranscriptEntry } from '../types'
import { TRANSCRIPT_STORAGE_KEY } from '../types'
import { formatTranscript } from '../utils'

/**
 * Gerencia histórico de conversa com persistência em sessionStorage
 * e exportação de transcrição para debug.
 */
export function useConversationHistory(args: {
  sessionIdRef: React.MutableRefObject<string | null>
  enableTranscriptDebug: boolean
}) {
  const { sessionIdRef, enableTranscriptDebug } = args
  const chatEndRef = useRef<HTMLDivElement>(null)
  const currentPage = typeof window !== 'undefined' ? window.location.pathname : ''

  const [conversationHistory, setConversationHistory] = useState<TranscriptEntry[]>([])

  // Histórico mantido apenas em estado React (page-scoped, sem persistência)

  const buildTranscript = useCallback(() => {
    return formatTranscript(conversationHistory, sessionIdRef.current, currentPage)
  }, [conversationHistory, currentPage, sessionIdRef])

  // Debug: salvar transcrição no localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !enableTranscriptDebug) return
    if (conversationHistory.length === 0) return
    const transcript = buildTranscript()
    if (!transcript) return
    try {
      localStorage.setItem(TRANSCRIPT_STORAGE_KEY, transcript)
    } catch {
      // Ignorar falhas de storage
    }
  }, [conversationHistory, buildTranscript, enableTranscriptDebug])

  const handleExportTranscript = useCallback(() => {
    if (typeof window === 'undefined') return
    const transcript = buildTranscript()
    if (!transcript) return
    const blob = new Blob([`${transcript}\n`], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.href = url
    link.download = `davi-transcricao-${timestamp}.txt`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [buildTranscript])

  const handleClearTranscript = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(TRANSCRIPT_STORAGE_KEY)
    } catch {
      // Ignorar falhas de storage
    }
  }, [])

  // Auto-scroll para última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  const lastQuestion = useMemo(() => {
    for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
      const item = conversationHistory[i]
      if (item?.question) return item.question
    }
    return ''
  }, [conversationHistory])

  const lastAnswer = useMemo(() => {
    for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
      const item = conversationHistory[i]
      if (item?.answer) return item.answer
    }
    return ''
  }, [conversationHistory])

  return {
    conversationHistory,
    setConversationHistory,
    lastQuestion,
    lastAnswer,
    handleExportTranscript,
    handleClearTranscript,
    chatEndRef,
  }
}
