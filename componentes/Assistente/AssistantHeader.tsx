'use client'

import { ThinkingIndicator, ListeningWave } from './StatusIndicators'

export type AssistantHeaderProps = {
  continuousMode: boolean
  isListening: boolean
  isThinking: boolean
  isTTSSpeaking: boolean
  useVoice: boolean
  ttsAvailable: boolean
  showTextDebug: boolean
  onDeactivate: () => void
}

export function AssistantHeader({
  continuousMode,
  isListening,
  isThinking,
  isTTSSpeaking,
  useVoice,
  ttsAvailable,
  showTextDebug,
  onDeactivate,
}: AssistantHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <div>
        <p className="text-xs uppercase text-blue-200 font-semibold">
          {continuousMode ? '🎤 Conversa Contínua' : 'Assistente ativo'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {isListening ? (
            <ListeningWave />
          ) : isThinking ? (
            <ThinkingIndicator />
          ) : isTTSSpeaking ? (
            <div className="flex items-center gap-2">
              <div className="text-cyan-400 text-xs animate-pulse">🔊 Assistente falando...</div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              {continuousMode
                ? 'Aguardando sua fala...'
                : useVoice && ttsAvailable
                  ? 'Voz ativa'
                  : showTextDebug
                    ? 'Modo texto'
                    : 'Voz indisponível'}
            </p>
          )}
        </div>
      </div>
      <button
        className="rounded-lg bg-gray-800 px-3 py-2 text-xs text-white hover:bg-gray-700 transition-colors"
        onClick={onDeactivate}
      >
        Desativar
      </button>
    </div>
  )
}
