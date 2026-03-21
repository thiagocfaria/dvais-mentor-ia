/**
 * Validações de Senha (Força e Requisitos)
 *
 * IMPORTANTE: Estas validações são APENAS para UX (feedback rápido).
 * SEMPRE validar novamente no server-side.
 */

import { z } from 'zod'

// ============================================
// SCHEMAS ZOD
// ============================================

/**
 * Schema de validação para senha (completo com requisitos de força)
 *
 * Requisitos:
 * - Mínimo 12 caracteres
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
export const passwordSchema = z
  .string()
  .min(12, 'Senha deve ter no mínimo 12 caracteres')
  .max(128, 'Senha muito longa')
  .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'Deve conter pelo menos uma letra MAIÚSCULA')
  .regex(/[0-9]/, 'Deve conter pelo menos um número')
  .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial (!@#$%^&*)')
  .refine(
    password => !/(.)\1{2,}/.test(password),
    'Senha não pode ter 3 ou mais caracteres repetidos seguidos'
  )
  .refine(password => {
    const weakPasswords = [
      'password',
      'senha',
      '123456',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
    ]
    return !weakPasswords.some(weak => password.toLowerCase().includes(weak))
  }, 'Senha muito comum. Escolha uma senha mais forte.')

/**
 * Schema de nova senha (com confirmação)
 */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
    token: z.string().min(1, 'Token é obrigatório'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Calcular força da senha
 *
 * @returns Pontuação de 0 a 100
 */
export function calculatePasswordStrength(password: string): {
  score: number
  level: 'weak' | 'medium' | 'strong' | 'very-strong'
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []

  // Comprimento (máximo 40 pontos)
  const lengthScore = Math.min(password.length * 2, 40)
  score += lengthScore

  if (password.length < 12) {
    feedback.push('Use no mínimo 12 caracteres')
  }

  // Complexidade
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)

  if (hasLowercase) score += 10
  else feedback.push('Adicione letras minúsculas')

  if (hasUppercase) score += 15
  else feedback.push('Adicione letras MAIÚSCULAS')

  if (hasNumbers) score += 15
  else feedback.push('Adicione números')

  if (hasSpecial) score += 20
  else feedback.push('Adicione caracteres especiais (!@#$%)')

  // Penalidades
  if (/(.)\1{2,}/.test(password)) {
    score -= 10
    feedback.push('Evite caracteres repetidos')
  }

  if (/^[0-9]+$/.test(password)) {
    score -= 20
    feedback.push('Não use apenas números')
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 10
    feedback.push('Não use apenas letras')
  }

  // Verificar senhas comuns
  const commonPasswords = [
    'password',
    'senha',
    '123456',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    '12345678',
  ]

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score -= 30
    feedback.push('Senha muito comum. Escolha algo único.')
  }

  // Normalizar score (0-100)
  score = Math.max(0, Math.min(100, score))

  // Determinar nível
  let level: 'weak' | 'medium' | 'strong' | 'very-strong'
  if (score < 40) level = 'weak'
  else if (score < 60) level = 'medium'
  else if (score < 80) level = 'strong'
  else level = 'very-strong'

  return { score, level, feedback }
}

/**
 * Validar senha (retorna feedback detalhado)
 */
export function validatePassword(password: string): {
  isValid: boolean
  strength: ReturnType<typeof calculatePasswordStrength>
  errors: string[]
} {
  const result = passwordSchema.safeParse(password)
  const strength = calculatePasswordStrength(password)

  if (!result.success) {
    return {
      isValid: false,
      strength,
      errors: result.error.issues.map(err => err.message),
    }
  }

  return {
    isValid: true,
    strength,
    errors: [],
  }
}

// ============================================
// CONSTANTES
// ============================================

export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 12,
    MAX_LENGTH: 128,
    REQUIRES_LOWERCASE: true,
    REQUIRES_UPPERCASE: true,
    REQUIRES_NUMBER: true,
    REQUIRES_SPECIAL: true,
  },
} as const

export const ERROR_MESSAGES = {
  INVALID_PASSWORD: 'Senha não atende aos requisitos de segurança',
  PASSWORDS_DONT_MATCH: 'As senhas não coincidem',
  PASSWORD_TOO_WEAK: 'Senha muito fraca. Use uma senha mais forte.',
} as const

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type NewPasswordData = z.infer<typeof newPasswordSchema>
