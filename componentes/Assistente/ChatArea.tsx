'use client'

import type { ReactNode } from 'react'
import { ThinkingIndicator } from './StatusIndicators'
import type { ClickedContext } from './hooks/useClickContext'
import { CLICK_CONTEXT_TTL_MS } from './types'

export type ChatAreaProps = {
  memoizedMessages: ReactNode
  isThinking: boolean
  chatEndRef: React.Ref<HTMLDivElement>
  caption: string
  hintMessage: string
  liveHintFallback: string
  clickedContext: ClickedContext | null
  setClickedContext: (ctx: ClickedContext | null) => void
  setHintMessage: (msg: string) => void
  selectionMode: boolean
  hasMessages: boolean
}

export function ChatArea({
  memoizedMessages,
  isThinking,
  chatEndRef,
  caption,
  hintMessage,
  liveHintFallback,
  clickedContext,
  setClickedContext,
  setHintMessage,
  selectionMode,
  hasMessages,
}: ChatAreaProps) {
  const activeSelection =
    clickedContext && Date.now() - clickedContext.timestamp < CLICK_CONTEXT_TTL_MS
      ? clickedContext
      : null

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950/10 to-slate-950/40 p-4" style={{ minHeight: '320px' }}>
      <div className="space-y-3">
        {!hasMessages && (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-sm text-slate-400">Pergunte algo sobre o produto.</p>
          </div>
        )}

        {activeSelection && (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Contexto selecionado
                </p>
                <p className="mt-1 text-sm text-cyan-50">
                  {activeSelection.text || activeSelection.targetId || 'Item selecionado'}
                </p>
              </div>
              <button
                className="rounded-lg border border-cyan-300/20 bg-cyan-950/30 px-2.5 py-1.5 text-xs text-cyan-50 hover:bg-cyan-950/50 transition-colors"
                onClick={() => {
                  setClickedContext(null)
                  setHintMessage('Seleção limpa. Você pode escolher outro item ou continuar perguntando.')
                }}
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {memoizedMessages}

        {isThinking && <ThinkingIndicator />}
        <div ref={chatEndRef} />
      </div>
    </div>
  )
}
