'use client'

import { memo } from 'react'

// Indicador de "pensando" - 3 pontos animados
export const ThinkingIndicator = memo(() => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      <div className="flex gap-1.5">
        <div
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-xs text-gray-400 ml-2">Pensando...</span>
    </div>
  )
})

ThinkingIndicator.displayName = 'ThinkingIndicator'

// Indicador de "ouvindo" - ondas sonoras animadas
export const ListeningWave = memo(() => {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-end gap-1 h-6">
        <div
          className="w-1 bg-red-500 rounded-full animate-wave"
          style={{ height: '8px', animationDelay: '0ms' }}
        />
        <div
          className="w-1 bg-red-500 rounded-full animate-wave"
          style={{ height: '12px', animationDelay: '100ms' }}
        />
        <div
          className="w-1 bg-red-500 rounded-full animate-wave"
          style={{ height: '16px', animationDelay: '200ms' }}
        />
        <div
          className="w-1 bg-red-500 rounded-full animate-wave"
          style={{ height: '12px', animationDelay: '300ms' }}
        />
        <div
          className="w-1 bg-red-500 rounded-full animate-wave"
          style={{ height: '8px', animationDelay: '400ms' }}
        />
      </div>
      <span className="text-xs text-red-400 font-medium">Ouvindo...</span>
    </div>
  )
})

ListeningWave.displayName = 'ListeningWave'

// Barra de progresso durante TTS
interface AudioProgressProps {
  progress: number // 0-100
  duration?: number // duração total em segundos
}

export const AudioProgress = memo(({ progress, duration }: AudioProgressProps) => {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        {duration && (
          <span className="text-xs text-gray-400 min-w-[40px] text-right">
            {Math.round((duration * (100 - progress)) / 100)}s
          </span>
        )}
      </div>
    </div>
  )
})

AudioProgress.displayName = 'AudioProgress'

// Indicador de digitação (para streaming)
export const TypingIndicator = memo(() => {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <div
          className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"
          style={{ animationDelay: '200ms' }}
        />
        <div
          className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"
          style={{ animationDelay: '400ms' }}
        />
      </div>
      <span className="text-xs text-gray-400">Digitando...</span>
    </div>
  )
})

TypingIndicator.displayName = 'TypingIndicator'
