/**
 * Sanitização de perguntas do usuário
 * Remove caracteres de controle e normaliza entrada para segurança
 */

export function sanitizeQuestion(q: string): string {
  if (!q || typeof q !== 'string') return ''

  return q
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars exceto \n, \r, \t
    .replace(/\r\n/g, '\n') // Normaliza line breaks
    .replace(/\r/g, '\n') // Normaliza \r restantes
    .trim()
    .slice(0, 300) // Limite de tamanho
}
