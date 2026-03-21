/**
 * Gate de duração de fala: limita texto para caber em ~15s de locução.
 * Aproximação: 180 wpm ≈ 3 palavras/s; 15s ≈ 45 palavras ≈ 250-300 caracteres.
 */
export function enforceSpeechDuration(text: string, maxMs = 15000) {
  const maxChars = Math.max(120, Math.min(400, Math.floor((maxMs / 1000) * 20))) // limite seguro
  if (text.length <= maxChars) return text
  const sliced = text.slice(0, maxChars)
  return `${sliced.trim()}...`
}
