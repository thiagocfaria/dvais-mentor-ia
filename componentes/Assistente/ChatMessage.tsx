'use client'

import { memo, useState } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
}

export const ChatMessage = memo(({ role, content, timestamp, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false)

  const formatTime = (ts: number) => {
    const date = new Date(ts)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isUser = role === 'user'

  return (
    <div
      className={`flex w-full mb-4 animate-message-enter ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] lg:max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white'
            : 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-gray-100 border border-white/10'
        }`}
      >
        {/* Conteúdo da mensagem */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
          {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
        </div>

        {/* Footer com timestamp e botão de copiar */}
        <div
          className={`flex items-center justify-between mt-2 gap-2 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}
        >
          <span className="text-xs opacity-70">{formatTime(timestamp)}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded"
              title={copied ? 'Copiado!' : 'Copiar resposta'}
            >
              {copied ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

ChatMessage.displayName = 'ChatMessage'
