'use client'

import type { GuidedStep, AssistantMode } from './types'

export type InputAreaProps = {
  showTextDebug: boolean
  enableTranscriptDebug: boolean
  continuousMode: boolean
  isListening: boolean
  isThinking: boolean
  isTTSSpeaking: boolean
  isStreaming: boolean
  useVoice: boolean
  speechAvailable: boolean
  ttsAvailable: boolean
  mode: AssistantMode
  question: string
  caption: string
  qaAnswer: string
  liveHintMessage: string
  steps: GuidedStep[]
  currentIndex: number
  setQuestion: (q: string) => void
  handleAsk: (speechAvailable: boolean, ttsAvailable: boolean) => void
  toggleListening: () => void
  runStep: (index: number) => void
  handleExportTranscript: () => void
  handleClearTranscript: () => void
}

export function InputArea({
  showTextDebug,
  enableTranscriptDebug,
  continuousMode,
  isListening,
  isThinking,
  isTTSSpeaking,
  useVoice,
  speechAvailable,
  ttsAvailable,
  mode,
  question,
  caption,
  qaAnswer,
  liveHintMessage,
  steps,
  currentIndex,
  setQuestion,
  handleAsk,
  toggleListening,
  runStep,
  handleExportTranscript,
  handleClearTranscript,
}: InputAreaProps) {
  return (
    <div className="p-4 border-t border-white/10 space-y-2">
      {caption && !qaAnswer && !continuousMode && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 mb-2">
          <p className="text-xs text-blue-300 mb-1">Agora: {steps[currentIndex]?.title}</p>
          <p className="text-sm text-gray-100">
            {caption || steps[currentIndex]?.description}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 transition-colors"
              onClick={() => runStep(currentIndex)}
            >
              Repetir
            </button>
            <button
              className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              onClick={() => runStep(Math.min(currentIndex + 1, steps.length - 1))}
              disabled={currentIndex >= steps.length - 1}
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {showTextDebug ? (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              className="w-full rounded-lg bg-gray-900/70 px-3 py-2 pr-10 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder={
                isListening
                  ? 'Ouvindo... fale sua pergunta'
                  : 'Perguntar (KB primeiro, LLM se necessário)'
              }
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && question.trim() && !isListening) {
                  e.preventDefault()
                  handleAsk(speechAvailable, ttsAvailable)
                }
              }}
              maxLength={320}
              disabled={isListening || isThinking}
            />
            {useVoice && speechAvailable && (
              <button
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={toggleListening}
                title={isListening ? 'Parar captura de voz' : 'Iniciar captura de voz'}
                disabled={isThinking}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            onClick={() => handleAsk(speechAvailable, ttsAvailable)}
            disabled={!question.trim() || isListening || isThinking}
          >
            {isThinking ? 'Pensando...' : 'Perguntar'}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white">
          <p className="text-xs text-blue-300 mb-1">Modo Live ativo</p>
          <p className="text-sm text-gray-100">{liveHintMessage}</p>
          {!speechAvailable && (
            <p className="text-xs text-amber-200 mt-2">
              ⚠️ Captura de voz indisponível. Use um navegador compatível.
            </p>
          )}
        </div>
      )}

      <div className="text-xs text-gray-400 space-y-1">
        {isTTSSpeaking && (
          <div className="text-cyan-400 animate-pulse flex items-center gap-1">
            <span>🔊</span>
            <span>Assistente falando... Aguarde para falar.</span>
          </div>
        )}
        {mode === 'economico' && (
          <div className="text-amber-200">Modo econômico/seguro ativo.</div>
        )}
        {mode === 'erro' && (
          <div className="text-red-300">Assistente indisponível agora.</div>
        )}
      </div>

      {enableTranscriptDebug && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-300">
          <span className="text-gray-400">Transcricao (debug)</span>
          <button
            className="rounded-md bg-gray-800 px-2 py-1 text-xs text-white hover:bg-gray-700 transition-colors"
            onClick={handleExportTranscript}
          >
            Exportar .txt
          </button>
          <button
            className="rounded-md bg-gray-800 px-2 py-1 text-xs text-white hover:bg-gray-700 transition-colors"
            onClick={handleClearTranscript}
          >
            Limpar log
          </button>
          <span className="text-gray-500">Salvo em localStorage.</span>
        </div>
      )}
    </div>
  )
}
