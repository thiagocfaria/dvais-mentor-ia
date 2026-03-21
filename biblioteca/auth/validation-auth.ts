/**
 * Validações de Autenticação (Email, Senha Simples, Login)
 *
 * IMPORTANTE: Estas validações são APENAS para UX (feedback rápido).
 * SEMPRE validar novamente no server-side.
 */

import { z } from 'zod'

// ============================================
// SCHEMAS ZOD
// ============================================

/**
 * Schema de validação para email
 */
export const emailSchema = z
  .string()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .max(255, 'Email muito longo')
  .toLowerCase()
  .trim()

/**
 * Schema de validação para senha (básico - apenas comprimento)
 * Para validação completa de força, use validation-password.ts
 */
export const passwordBasicSchema = z
  .string()
  .min(1, 'Senha é obrigatória')
  .max(128, 'Senha muito longa')

/**
 * Schema de validação para nome completo
 */
export const nameSchema = z
  .string()
  .min(2, 'Nome muito curto')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos')
  .trim()
  .transform(name =>
    name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  )

/**
 * Schema de login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordBasicSchema,
})

/**
 * Schema de reset de senha
 */
export const passwordResetSchema = z.object({
  email: emailSchema,
})

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Validar email (mais rigoroso que Zod)
 */
export function validateEmail(email: string): {
  isValid: boolean
  error?: string
} {
  const result = emailSchema.safeParse(email)

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Email inválido',
    }
  }

  // Verificar domínio comum
  const domain = email.split('@')[1]
  const validDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'icloud.com',
    'protonmail.com',
    'live.com',
  ]

  // Apenas aviso, não bloqueia
  if (!validDomains.includes(domain)) {
    console.warn('Domínio de email incomum:', domain)
  }

  return { isValid: true }
}

/**
 * Validar formulário de login
 */
export function validateLoginForm(data: unknown): {
  isValid: boolean
  errors: Record<string, string>
  data?: z.infer<typeof loginSchema>
} {
  const result = loginSchema.safeParse(data)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(err => {
      const path = err.path.join('.')
      errors[path] = err.message
    })

    return {
      isValid: false,
      errors,
    }
  }

  return {
    isValid: true,
    errors: {},
    data: result.data,
  }
}

/**
 * Validar nome completo
 */
export function validateName(name: string): {
  isValid: boolean
  error?: string
  formatted?: string
} {
  const result = nameSchema.safeParse(name)

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Nome inválido',
    }
  }

  return {
    isValid: true,
    formatted: result.data,
  }
}

// ============================================
// SANITIZAÇÃO
// ============================================

/**
 * Sanitizar string (remover caracteres perigosos)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, etc)
    .trim()
}

/**
 * Sanitizar email
 */
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>'"]/g, '')
}

/**
 * Sanitizar nome
 */
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[<>'"]/g, '')
    .replace(/\s+/g, ' ') // Múltiplos espaços -> um espaço
}

// ============================================
// CONSTANTES
// ============================================

export const VALIDATION_RULES = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 128,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
} as const

export const ERROR_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  INVALID_EMAIL: 'Email inválido',
  EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado',
} as const

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>
export type PasswordResetData = z.infer<typeof passwordResetSchema>
