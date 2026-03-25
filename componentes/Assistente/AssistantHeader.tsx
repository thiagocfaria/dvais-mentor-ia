'use client'

import type { VoiceIssue, VoiceRuntimeState } from './types'
import { ThinkingIndicator, ListeningWave } from './StatusIndicators'

export type AssistantHeaderProps = {
  runtimeState: VoiceRuntimeState
  voiceIssue: VoiceIssue
  continuousMode: boolean
  selectionMode: boolean
  speechAvailable: boolean
  onDeactivate: () => void
}

function statusLabel(
  runtimeState: VoiceRuntimeState,
  voiceIssue: VoiceIssue,
  _continuousMode: boolean,
  selectionMode: boolean
) {
  if (voiceIssue === 'autoplay_blocked') return 'Áudio bloqueado'
  if (voiceIssue === 'tts_unavailable' || voiceIssue === 'speech_not_supported') return 'Sem suporte'
  if (voiceIssue === 'mic_denied') return 'Microfone bloqueado'
  if (runtimeState === 'hidden') return 'Oculto'
  if (runtimeState === 'degraded_text') return 'Modo degradado'
  if (runtimeState === 'starting') return 'Preparando microfone'
  if (runtimeState === 'listening') return 'Pode falar'
  if (runtimeState === 'thinking') return 'Entendi, processando'
  if (runtimeState === 'speaking') return 'Falando'
  if (runtimeState === 'error') return 'Erro'
  if (selectionMode) return 'Selecionando'
  return 'Ligado'
}

export function AssistantHeader({
  runtimeState,
  voiceIssue,
  continuousMode,
  selectionMode: selectionEnabled,
  speechAvailable,
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
              Guia por voz da plataforma, com fallback em texto só quando o navegador exigir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-100">
              {statusLabel(runtimeState, voiceIssue, continuousMode, selectionEnabled)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
              {speechAvailable ? 'Sessão por voz' : 'Fallback em texto'}
            </span>
          </div>
        </div>

        <button
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors"
          onClick={onDeactivate}
        >
          Ocultar
        </button>
      </div>

      <div className="mt-3 min-h-[32px]">
        {voiceIssue === 'autoplay_blocked' ? (
          <div className="px-4 py-2 text-xs text-amber-200">O navegador bloqueou o áudio automático. O Davi entrou em modo degradado e mantém a resposta no chat.</div>
        ) : voiceIssue === 'tts_unavailable' || voiceIssue === 'speech_not_supported' ? (
          <div className="px-4 py-2 text-xs text-slate-300">Voz indisponível neste navegador. O Davi continua em modo texto nesta página.</div>
        ) : voiceIssue === 'mic_denied' ? (
          <div className="px-4 py-2 text-xs text-rose-200">Microfone bloqueado. Libere a permissão no navegador; enquanto isso, o Davi segue em modo texto.</div>
        ) : runtimeState === 'starting' ? (
          <div className="px-4 py-2 text-xs text-cyan-200">Preparando microfone e reconhecimento de voz.</div>
        ) : runtimeState === 'listening' ? (
          <ListeningWave />
        ) : runtimeState === 'thinking' ? (
          <div className="space-y-2 px-4 py-2">
            <div className="text-xs text-cyan-200">Entendi, processando sua pergunta.</div>
            <ThinkingIndicator />
          </div>
        ) : runtimeState === 'speaking' ? (
          <div className="px-4 py-2 text-xs text-cyan-300">🔊 O assistente está falando.</div>
        ) : runtimeState === 'degraded_text' ? (
          <div className="px-4 py-2 text-xs text-slate-300">O navegador limitou a voz contínua. Você ainda pode continuar no chat por texto.</div>
        ) : selectionEnabled ? (
          <div className="px-4 py-2 text-xs text-cyan-200">
            Toque em qualquer item da página para capturar o contexto dessa parte.
          </div>
        ) : (
          <div className="px-4 py-2 text-xs text-slate-400">
            O Davi continua ligado e volta a ouvir quando a resposta termina.
          </div>
        )}
      </div>
    </div>
  )
}
