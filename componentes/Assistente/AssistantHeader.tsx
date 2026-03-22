'use client'

import type { VoiceIssue, VoiceRuntimeState } from './types'
import { ThinkingIndicator, ListeningWave } from './StatusIndicators'

export type AssistantHeaderProps = {
  runtimeState: VoiceRuntimeState
  voiceIssue: VoiceIssue
  continuousMode: boolean
  selectionMode: boolean
  speechAvailable: boolean
  isCoarsePointer: boolean
  onToggleSelection: () => void
  onDeactivate: () => void
}

function statusLabel(
  runtimeState: VoiceRuntimeState,
  voiceIssue: VoiceIssue,
  continuousMode: boolean,
  selectionMode: boolean
) {
  if (voiceIssue === 'autoplay_blocked') return 'Áudio bloqueado'
  if (voiceIssue === 'tts_unavailable' || voiceIssue === 'speech_not_supported') return 'Sem suporte'
  if (voiceIssue === 'mic_denied') return 'Microfone bloqueado'
  if (runtimeState === 'listening') return 'Ouvindo'
  if (runtimeState === 'thinking') return 'Pensando'
  if (runtimeState === 'speaking') return 'Falando'
  if (runtimeState === 'error') return 'Erro'
  if (selectionMode) return 'Selecionando'
  return continuousMode ? 'Live pronto' : 'Pronto'
}

export function AssistantHeader({
  runtimeState,
  voiceIssue,
  continuousMode,
  selectionMode: selectionEnabled,
  speechAvailable,
  isCoarsePointer,
  onToggleSelection,
  onDeactivate,
}: AssistantHeaderProps) {
  return (
    <div className="border-b border-white/10 bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Davi Assistente
            </p>
            <p className="mt-1 text-sm text-white">
              Chat contextual com texto, voz opcional e seleção por toque.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-100">
              {statusLabel(runtimeState, voiceIssue, continuousMode, selectionEnabled)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
              {speechAvailable ? (isCoarsePointer ? 'Voz manual' : 'Voz disponível') : 'Somente texto'}
            </span>
            {continuousMode && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-100">
                Conversa contínua
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
              selectionEnabled
                ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
            onClick={onToggleSelection}
          >
            {selectionEnabled ? 'Cancelar seleção' : 'Selecionar item'}
          </button>
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            onClick={onDeactivate}
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-[32px]">
        {voiceIssue === 'autoplay_blocked' ? (
          <div className="px-4 py-2 text-xs text-amber-200">Áudio bloqueado. Toque em "Ouvir resposta" para reproduzir manualmente.</div>
        ) : voiceIssue === 'tts_unavailable' || voiceIssue === 'speech_not_supported' ? (
          <div className="px-4 py-2 text-xs text-slate-300">Voz indisponível neste navegador. O chat continua funcionando em texto.</div>
        ) : voiceIssue === 'mic_denied' ? (
          <div className="px-4 py-2 text-xs text-rose-200">Microfone bloqueado. Libere a permissão no navegador ou siga em texto.</div>
        ) : runtimeState === 'listening' ? (
          <ListeningWave />
        ) : runtimeState === 'thinking' ? (
          <ThinkingIndicator />
        ) : runtimeState === 'speaking' ? (
          <div className="px-4 py-2 text-xs text-cyan-300">🔊 O assistente está falando.</div>
        ) : selectionEnabled ? (
          <div className="px-4 py-2 text-xs text-cyan-200">
            Toque em qualquer item da página para capturar o contexto dessa parte.
          </div>
        ) : (
          <div className="px-4 py-2 text-xs text-slate-400">
            Pergunte em texto ou use o microfone quando o navegador suportar bem a captura.
          </div>
        )}
      </div>
    </div>
  )
}
