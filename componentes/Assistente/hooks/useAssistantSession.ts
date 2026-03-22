'use client'

import { useEffect, useRef } from 'react'

/**
 * Gera um session ID fresco a cada mount.
 * O cookie é mantido para logs/observabilidade no servidor.
 * Não persiste em sessionStorage — o histórico é page-scoped.
 */
export function useAssistantSession() {
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || sessionIdRef.current) return
    const sessionId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    sessionIdRef.current = sessionId
    document.cookie = `assistente_session=${sessionId}; path=/; max-age=86400`
  }, [])

  return sessionIdRef
}
