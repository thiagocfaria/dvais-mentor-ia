'use client'

import type { AssistantMode, VoiceIssue, VoiceRuntimeState } from './types'

export type InputAreaProps = {
  enableTranscriptDebug: boolean
  continuousMode: boolean
  isThinking: boolean
  speechAvailable: boolean
  ttsAvailable: boolean
  mode: AssistantMode
  runtimeState: VoiceRuntimeState
  question: string
  setQuestion: (q: string) => void
  handleAsk: (speechAvailable: boolean, ttsAvailable: boolean) => void
  handleExportTranscript: () => void
  handleClearTranscript: () => void
  diagnosticMessage: string
  voiceIssue: VoiceIssue
  showFallbackInput: boolean
}

function runtimeCopy(runtimeState: VoiceRuntimeState, continuousMode: boolean) {
  if (runtimeState === 'listening') return 'Ouvindo sua pergunta'
  if (runtimeState === 'starting') return 'Conectando a voz'
  if (runtimeState === 'thinking') return 'Consultando a IA'
  if (runtimeState === 'speaking') return 'Reproduzindo resposta'
  if (runtimeState === 'degraded_text') return 'Modo degradado em texto'
  if (runtimeState === 'error') return 'Falha temporária'
  return continuousMode ? 'Sessão de voz ativa' : 'Pronto'
}

export function InputArea({
  enableTranscriptDebug,
  continuousMode,
  isThinking,
  speechAvailable,
  ttsAvailable,
  mode,
  runtimeState,
  question,
  setQuestion,
  handleAsk,
  handleExportTranscript,
  handleClearTranscript,
  diagnosticMessage,
  voiceIssue,
  showFallbackInput,
}: InputAreaProps) {
  if (!showFallbackInput && !enableTranscriptDebug) {
    return null
  }

  return (
    <div className="border-t border-white/10 bg-slate-950/70 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
          {runtimeCopy(runtimeState, continuousMode)}
        </span>
        {mode === 'economico' && (
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-100">
            Modo econômico
          </span>
        )}
        {mode === 'erro' && (
          <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[11px] text-rose-100">
            Falha de integração
          </span>
        )}
        {voiceIssue === 'autoplay_blocked' && (
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-100">
            Áudio bloqueado
          </span>
        )}
      </div>

      {diagnosticMessage && (
        <div className="mb-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
          {diagnosticMessage}
        </div>
      )}

      {showFallbackInput && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              className="min-h-[96px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/40"
              placeholder="Digite sua pergunta sobre a plataforma..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={320}
              disabled={isThinking}
            />
          </div>

          <button
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition-colors hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handleAsk(speechAvailable, ttsAvailable)}
            disabled={!question.trim() || isThinking}
          >
            {isThinking ? 'Consultando...' : 'Enviar'}
          </button>
        </div>
      )}

      {!speechAvailable && (
        <p className="mt-3 text-xs text-slate-400">
          Voz indisponível neste navegador. O assistente continua funcionando em texto.
        </p>
      )}

      {enableTranscriptDebug && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
          <span className="text-slate-400">Transcrição local</span>
          <button
            className="rounded-md bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10 transition-colors"
            onClick={handleExportTranscript}
          >
            Exportar .txt
          </button>
          <button
            className="rounded-md bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10 transition-colors"
            onClick={handleClearTranscript}
          >
            Limpar log
          </button>
        </div>
      )}
    </div>
  )
}
