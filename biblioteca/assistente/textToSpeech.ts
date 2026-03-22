'use client'

export type TTSKind = 'assistant-answer' | 'replay' | 'navigation' | 'guide' | 'intro'

export type SpeakTextOptions = {
  kind?: TTSKind
  interrupt?: boolean
}

export type TTSResult =
  | { ok: true; via: 'speechSynthesis' | 'external_audio' }
  | {
      ok: false
      reason:
        | 'tts_unavailable'
        | 'autoplay_blocked'
        | 'external_tts_failed'
        | 'speech_synthesis_error'
        | 'interrupted'
        | 'empty_text'
    }

type PlaybackState = {
  id: number
  kind: TTSKind
  text: string
  audio?: HTMLAudioElement
  utterance?: SpeechSynthesisUtterance
}

const PRIORITY: Record<TTSKind, number> = {
  intro: 0,
  guide: 1,
  navigation: 1,
  'assistant-answer': 3,
  replay: 4,
}

let playbackSequence = 0
let currentPlayback: PlaybackState | null = null
let lastReplayableText = ''
const isSpeakingRef = { current: false }

function isAutoplayBlocked(message: unknown) {
  const normalized =
    typeof message === 'string'
      ? message.toLowerCase()
      : typeof message === 'object' && message && 'error' in message
        ? String((message as { error?: unknown }).error ?? '').toLowerCase()
        : ''

  return normalized.includes('notallowed') || normalized.includes('not-allowed')
}

function shouldInterruptCurrent(nextKind: TTSKind, interrupt?: boolean) {
  if (!currentPlayback) return true
  if (interrupt) return true
  return PRIORITY[nextKind] >= PRIORITY[currentPlayback.kind]
}

function clearPlayback(id?: number) {
  if (id === undefined || currentPlayback?.id === id) {
    currentPlayback = null
    isSpeakingRef.current = false
  }
}

function cancelAudioElement(audio?: HTMLAudioElement | null) {
  if (!audio) return
  try {
    audio.pause()
  } catch {
    // noop
  }
  try {
    audio.currentTime = 0
  } catch {
    // noop
  }
}

function cancelCurrentPlayback() {
  if (!currentPlayback) return

  cancelAudioElement(currentPlayback.audio)

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // noop
    }
  }

  clearPlayback()
}

async function tryExternalTTS(text: string, playbackId: number, kind: TTSKind): Promise<TTSResult | null> {
  const endpoint = process.env.NEXT_PUBLIC_TTS_URL
  if (!endpoint || typeof Audio === 'undefined') return null

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: process.env.NEXT_PUBLIC_TTS_TOKEN ?? '',
      },
      body: JSON.stringify({
        text,
        voice: process.env.NEXT_PUBLIC_TTS_VOICE ?? 'default',
      }),
    })

    const data = await resp.json().catch(() => ({}))
    if (!data?.audioUrl) {
      return { ok: false, reason: 'external_tts_failed' }
    }

    const audio = new Audio(data.audioUrl)
    currentPlayback = {
      id: playbackId,
      kind,
      text,
      audio,
    }
    isSpeakingRef.current = true

    return await new Promise<TTSResult>(resolve => {
      audio.onended = () => {
        clearPlayback(playbackId)
        resolve({ ok: true, via: 'external_audio' })
      }
      audio.onerror = () => {
        clearPlayback(playbackId)
        resolve({ ok: false, reason: 'external_tts_failed' })
      }
      audio
        .play()
        .catch(error => {
          clearPlayback(playbackId)
          resolve({
            ok: false,
            reason: isAutoplayBlocked(error) ? 'autoplay_blocked' : 'external_tts_failed',
          })
        })
    })
  } catch {
    return { ok: false, reason: 'external_tts_failed' }
  }
}

async function trySpeechSynthesis(text: string, playbackId: number, kind: TTSKind): Promise<TTSResult> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { ok: false, reason: 'tts_unavailable' }
  }

  return await new Promise<TTSResult>(resolve => {
    try {
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'pt-BR'
      utter.rate = 1.08
      utter.pitch = 1

      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => voice.lang.toLowerCase().startsWith('pt'))
      if (preferredVoice) {
        utter.voice = preferredVoice
      }

      currentPlayback = { id: playbackId, kind, text, utterance: utter }
      isSpeakingRef.current = true

      utter.onend = () => {
        clearPlayback(playbackId)
        resolve({ ok: true, via: 'speechSynthesis' })
      }

      utter.onerror = event => {
        clearPlayback(playbackId)
        resolve({
          ok: false,
          reason: isAutoplayBlocked(event) ? 'autoplay_blocked' : 'speech_synthesis_error',
        })
      }

      window.speechSynthesis.speak(utter)
    } catch (error) {
      clearPlayback(playbackId)
      resolve({
        ok: false,
        reason: isAutoplayBlocked(error) ? 'autoplay_blocked' : 'speech_synthesis_error',
      })
    }
  })
}

export async function speakText(text: string, options: SpeakTextOptions = {}): Promise<TTSResult> {
  const trimmed = text.replace(/\s+/g, ' ').trim().slice(0, 400)
  if (!trimmed) {
    return { ok: false, reason: 'empty_text' }
  }

  const kind = options.kind ?? 'assistant-answer'

  if (currentPlayback && !shouldInterruptCurrent(kind, options.interrupt)) {
    return { ok: false, reason: 'interrupted' }
  }

  if (currentPlayback) {
    cancelCurrentPlayback()
  }

  const playbackId = ++playbackSequence
  if (kind === 'assistant-answer' || kind === 'replay') {
    lastReplayableText = trimmed
  }

  let externalResult: TTSResult | null = null
  const hasExternalEndpoint =
    !!process.env.NEXT_PUBLIC_TTS_URL && typeof Audio !== 'undefined'

  if (hasExternalEndpoint) {
    externalResult = await tryExternalTTS(trimmed, playbackId, kind)
    if (externalResult?.ok) {
      return externalResult
    }
  }

  const speechResult = await trySpeechSynthesis(trimmed, playbackId, kind)
  if (speechResult.ok) {
    return speechResult
  }

  if (externalResult && externalResult.reason === 'autoplay_blocked' && speechResult.reason !== 'autoplay_blocked') {
    return externalResult
  }

  if (externalResult && externalResult.reason === 'external_tts_failed' && speechResult.reason === 'tts_unavailable') {
    return externalResult
  }

  return speechResult
}

export function cancelSpeech() {
  cancelCurrentPlayback()
}

export function isSpeaking(): boolean {
  return isSpeakingRef.current
}

export function getLastReplayableSpeech() {
  return lastReplayableText
}

export function resetTTSStateForTests() {
  cancelCurrentPlayback()
  playbackSequence = 0
  lastReplayableText = ''
}
