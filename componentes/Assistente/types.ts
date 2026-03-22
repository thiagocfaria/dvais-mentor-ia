export type GuidedStep = { id: string; title: string; description: string; targetId: string }
export type TranscriptEntry = { question: string; answer: string; timestamp: number }
export type AssistantMode = 'normal' | 'economico' | 'erro'
export type VoiceRuntimeState = 'idle' | 'armed' | 'listening' | 'thinking' | 'speaking' | 'error'

export const HIGHLIGHT_MS = 3500
export const MAX_SPOKEN_LEN = 260
export const CLICK_CONTEXT_TTL_MS = 2 * 60 * 1000
export const TRANSCRIPT_STORAGE_KEY = 'assistente_transcript'
