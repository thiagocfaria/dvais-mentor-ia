import type { AssistantResponse } from '@/app/api/assistente/state'

export type SupportSubtype = 'mobile_general' | 'microphone_input' | 'voice_output'

type ProductSupportResponse = {
  subtype: SupportSubtype
  response: AssistantResponse
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()[\]{}'"`~@#$%^&*+=|\\/<>]/g, ' ')
    .replace(/\$/g, 's')
    .replace(/ç/g, 'c')
    .replace(/[ãáàâ]/g, 'a')
    .replace(/[éê]/g, 'e')
    .replace(/[í]/g, 'i')
    .replace(/[õóô]/g, 'o')
    .replace(/[ú]/g, 'u')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectSupportSubtype(normalizedQuestion: string): SupportSubtype | null {
  const hasFailureSignal =
    /\b(nao funciona|nao consigo|travou|falhou|erro|quebrou|instavel|instavel|sem som|nao fala|nao capta|nao ouve)\b/.test(
      normalizedQuestion
    )

  if (
    /\b(microfone|minha voz|capta minha voz|nao capta|nao ouve|nao escuta)\b/.test(
      normalizedQuestion
    ) &&
    hasFailureSignal
  ) {
    return 'microphone_input'
  }

  if (
    /\b(voz|audio|som|ouvir resposta|fala)\b/.test(normalizedQuestion) &&
    /\b(nao fala|sem som|nao sai audio|nao sai som|nao consigo ouvir|nao ouco)\b/.test(
      normalizedQuestion
    )
  ) {
    return 'voice_output'
  }

  if (/\b(celular|mobile|iphone|android)\b/.test(normalizedQuestion) && hasFailureSignal) {
    return 'mobile_general'
  }

  return null
}

export function buildProductSupportResponse(question: string): ProductSupportResponse | null {
  const normalizedQuestion = normalizeText(question)
  const subtype = detectSupportSubtype(normalizedQuestion)

  if (!subtype) return null

  if (subtype === 'microphone_input') {
    return {
      subtype,
      response: {
        spokenText:
          'Se o microfone não capta, libere a permissão no cadeado do navegador e recarregue a página. Quando o browser não sustenta a sessão por voz, o Davi entra em modo degradado em texto.',
        actions: [],
        requiresUserClick: false,
        confidence: 0.96,
        mode: 'normal',
      },
    }
  }

  if (subtype === 'voice_output') {
    return {
      subtype,
      response: {
        spokenText:
          'Se a voz não sair, o navegador pode ter bloqueado o áudio automático. Nessa situação, o Davi mantém a resposta no chat e entra em modo degradado em texto para você continuar.',
        actions: [],
        requiresUserClick: false,
        confidence: 0.95,
        mode: 'normal',
      },
    }
  }

  return {
    subtype,
    response: {
      spokenText:
        'No celular, o Davi tenta funcionar em voz contínua na própria página, sem app. Se o navegador limitar microfone ou autoplay, o assistente explica o motivo e continua em modo degradado em texto.',
      actions: [],
      requiresUserClick: false,
      confidence: 0.94,
      mode: 'normal',
    },
  }
}
