/**
 * Validações Completas (Re-exportação dos módulos)
 *
 * Este arquivo re-exporta todas as validações dos módulos separados
 * para manter compatibilidade com código existente.
 *
 * Para reduzir bundle size, importe diretamente dos módulos específicos:
 * - validation-auth.ts (email, senha básica, login)
 * - validation-br.ts (CPF, CNPJ, telefone - pesado com libphonenumber-js)
 * - validation-password.ts (força de senha)
 */

// Re-exportar validações de autenticação
export {
  emailSchema,
  passwordBasicSchema,
  nameSchema,
  loginSchema,
  passwordResetSchema,
  validateEmail,
  validateLoginForm,
  validateName,
  sanitizeString,
  sanitizeEmail,
  sanitizeName,
  VALIDATION_RULES as AUTH_VALIDATION_RULES,
  ERROR_MESSAGES as AUTH_ERROR_MESSAGES,
  type LoginFormData,
  type PasswordResetData,
} from './validation-auth'

// Re-exportar validações brasileiras
export {
  cpfSchema,
  cnpjSchema,
  phoneSchema,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidBrazilianPhone,
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatBrazilianPhone,
  validateCPF,
  validateCNPJ,
  validatePhone,
  maskCPF,
  maskCNPJ,
  maskPhone,
  VALIDATION_RULES as BR_VALIDATION_RULES,
  ERROR_MESSAGES as BR_ERROR_MESSAGES,
} from './validation-br'

// Re-exportar validações de senha
export {
  passwordSchema,
  newPasswordSchema,
  calculatePasswordStrength,
  validatePassword,
  VALIDATION_RULES as PASSWORD_VALIDATION_RULES,
  ERROR_MESSAGES as PASSWORD_ERROR_MESSAGES,
  type NewPasswordData,
} from './validation-password'

// ============================================
// SCHEMAS COMPOSTOS (requerem múltiplos módulos)
// ============================================

import { z } from 'zod'
import { emailSchema, nameSchema } from './validation-auth'
import { passwordSchema } from './validation-password'
import { cpfSchema, phoneSchema } from './validation-br'

/**
 * Schema completo de registro (combina todos os módulos)
 */
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    cpf: cpfSchema,
    phone: phoneSchema,
    acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos de uso'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

/**
 * Validar formulário completo de registro
 */
export function validateRegisterForm(data: unknown): {
  isValid: boolean
  errors: Record<string, string>
  data?: z.infer<typeof registerSchema>
} {
  const result = registerSchema.safeParse(data)

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

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type RegisterFormData = z.infer<typeof registerSchema>

// ============================================
// CONSTANTES COMPLETAS
// ============================================

export const VALIDATION_RULES = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 12,
    MAX_LENGTH: 128,
    REQUIRES_LOWERCASE: true,
    REQUIRES_UPPERCASE: true,
    REQUIRES_NUMBER: true,
    REQUIRES_SPECIAL: true,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PHONE: {
    LENGTH: [10, 11],
  },
  CPF: {
    LENGTH: 11,
  },
  CNPJ: {
    LENGTH: 14,
  },
} as const

export const ERROR_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PASSWORD: 'Senha não atende aos requisitos de segurança',
  PASSWORDS_DONT_MATCH: 'As senhas não coincidem',
  INVALID_CPF: 'CPF inválido',
  INVALID_CNPJ: 'CNPJ inválido',
  INVALID_PHONE: 'Telefone inválido',
  TERMS_NOT_ACCEPTED: 'Você deve aceitar os termos de uso',
  PASSWORD_TOO_WEAK: 'Senha muito fraca. Use uma senha mais forte.',
  EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado',
} as const

// ============================================
// DEBOUNCE PARA VALIDAÇÃO
// ============================================

/**
 * Debounce function para evitar validações excessivas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
