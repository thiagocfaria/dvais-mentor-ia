'use client'

import type { ReactNode } from 'react'
import { ThinkingIndicator, TypingIndicator } from './StatusIndicators'
import type { ClickedContext } from './hooks/useClickContext'
import { CLICK_CONTEXT_TTL_MS } from './types'

export type ChatAreaProps = {
  showTextDebug: boolean
  memoizedMessages: ReactNode
  isThinking: boolean
  isStreaming: boolean
  isListening: boolean
  chatEndRef: React.Ref<HTMLDivElement>
  lastQuestion: string
  lastAnswer: string
  qaAnswer: string
  caption: string
  hintMessage: string
  liveHintFallback: string
  clickedContext: ClickedContext | null
  setClickedContext: (ctx: ClickedContext | null) => void
  setHintMessage: (msg: string) => void
}

export function ChatArea({
  showTextDebug,
  memoizedMessages,
  isThinking,
  isStreaming,
  isListening,
  chatEndRef,
  lastQuestion,
  lastAnswer,
  qaAnswer,
  caption,
  hintMessage,
  liveHintFallback,
  clickedContext,
  setClickedContext,
  setHintMessage,
}: ChatAreaProps) {
  const activeSelection =
    clickedContext && Date.now() - clickedContext.timestamp < CLICK_CONTEXT_TTL_MS
      ? clickedContext
      : null

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: '300px' }}>
      {showTextDebug ? (
        <>
          {memoizedMessages}
          {isThinking && !isListening && <ThinkingIndicator />}
          {isStreaming && <TypingIndicator />}
          <div ref={chatEndRef} />
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-blue-200 font-semibold">Resumo ao vivo</p>
            <span className="text-[10px] text-gray-400">Live</span>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-400">Última pergunta</p>
            <p className="text-sm text-gray-100">
              {lastQuestion || 'Ainda não recebi perguntas.'}
            </p>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-400">Resposta atual</p>
            <p className="text-sm text-gray-100">
              {lastAnswer || qaAnswer || caption || hintMessage || liveHintFallback}
            </p>
          </div>
          {activeSelection && (
            <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase text-cyan-200 font-semibold">
                  Assunto selecionado
                </p>
                <button
                  className="text-[10px] text-cyan-100/70 hover:text-cyan-100 transition-colors"
                  onClick={() => {
                    setClickedContext(null)
                    setHintMessage(
                      'Seleção limpa. Dê um duplo clique no item e pergunte novamente.'
                    )
                  }}
                >
                  Limpar
                </button>
              </div>
              <p className="text-sm text-cyan-50 mt-1">
                {activeSelection.text || activeSelection.targetId || 'Item selecionado'}
              </p>
            </div>
          )}
          {isThinking && !isListening && (
            <div className="mt-3"><ThinkingIndicator /></div>
          )}
          {isStreaming && (
            <div className="mt-2"><TypingIndicator /></div>
          )}
        </div>
      )}
    </div>
  )
}
