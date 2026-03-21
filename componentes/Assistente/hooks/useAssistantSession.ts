'use client'

import { useEffect, useRef } from 'react'

export function useAssistantSession() {
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || sessionIdRef.current) return
    const storageKey = 'assistente_session_id'
    let sessionId = sessionStorage.getItem(storageKey)
    if (!sessionId) {
      sessionId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      sessionStorage.setItem(storageKey, sessionId)
    }
    sessionIdRef.current = sessionId
    document.cookie = `assistente_session=${sessionId}; path=/; max-age=86400`
  }, [])

  return sessionIdRef
}
