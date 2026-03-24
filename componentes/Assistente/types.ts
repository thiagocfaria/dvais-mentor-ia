export type GuidedStep = { id: string; title: string; description: string; targetId: string }
export type TranscriptEntry = { question: string; answer: string; timestamp: number }
export type AssistantMode = 'normal' | 'economico' | 'erro'
export type VoiceRuntimeState =
  | 'off'
  | 'starting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'hidden'
  | 'degraded_text'
  | 'error'
export type VoiceIssue =
  | 'none'
  | 'autoplay_blocked'
  | 'tts_unavailable'
  | 'mic_denied'
  | 'speech_not_supported'
  | 'no_speech'
  | 'audio_capture_failed'
  | 'stt_timeout'
  | 'tts_failed'

export const HIGHLIGHT_MS = 3500
export const MAX_SPOKEN_LEN = 260
export const CLICK_CONTEXT_TTL_MS = 2 * 60 * 1000
export const TRANSCRIPT_STORAGE_KEY = 'assistente_transcript'
