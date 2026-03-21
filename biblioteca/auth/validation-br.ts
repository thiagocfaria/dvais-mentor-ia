/**
 * Validações Brasileiras (CPF, CNPJ, Telefone)
 *
 * IMPORTANTE: Estas validações são APENAS para UX (feedback rápido).
 * SEMPRE validar novamente no server-side.
 *
 * Este módulo importa libphonenumber-js (~200KB), então só deve ser usado
 * quando necessário (ex: página de cadastro com telefone).
 */

import { z } from 'zod'
import {
  isValidPhoneNumber,
  parsePhoneNumber,
  formatIncompletePhoneNumber,
} from 'libphonenumber-js'

// ============================================
// SCHEMAS ZOD
// ============================================

/**
 * Schema de validação para CPF
 */
export const cpfSchema = z
  .string()
  .optional()
  .refine(cpf => !cpf || isValidCPF(cpf), 'CPF inválido')

/**
 * Schema de validação para CNPJ
 */
export const cnpjSchema = z
  .string()
  .optional()
  .refine(cnpj => !cnpj || isValidCNPJ(cnpj), 'CNPJ inválido')

/**
 * Schema de validação para telefone internacional
 * Suporta números de qualquer país
 */
export const phoneSchema = z
  .string()
  .optional()
  .refine(phone => {
    if (!phone) return true // Opcional
    try {
      // Usar libphonenumber-js para validação internacional
      return isValidPhoneNumber(phone)
    } catch {
      // Fallback para validação básica se a biblioteca não estiver disponível
      return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))
    }
  }, 'Telefone inválido. Verifique o número e o código do país.')

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Validar CPF
 */
export function isValidCPF(cpf: string): boolean {
  // Remover caracteres não numéricos
  const cleanCPF = cpf.replace(/[^\d]/g, '')

  // Verificar se tem 11 dígitos
  if (cleanCPF.length !== 11) return false

  // Verificar se todos os dígitos são iguais (inválido)
  if (/^(\d)\1+$/.test(cleanCPF)) return false

  // Validar dígitos verificadores
  let sum = 0
  let remainder

  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false

  // Segundo dígito verificador
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false

  return true
}

/**
 * Validar CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  // Remover caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')

  // Verificar se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false

  // Verificar se todos os dígitos são iguais (inválido)
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false

  // Validar dígitos verificadores
  let size = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, size)
  const digits = cleanCNPJ.substring(size)
  let sum = 0
  let pos = size - 7

  // Primeiro dígito verificador
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  // Segundo dígito verificador
  size = size + 1
  numbers = cleanCNPJ.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

/**
 * Validar telefone (internacional ou brasileiro)
 * Suporta números de qualquer país
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false

  try {
    // Usar libphonenumber-js para validação internacional
    return isValidPhoneNumber(phone)
  } catch {
    // Fallback para validação básica
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    // Deve começar com + e ter pelo menos 10 dígitos
    return /^\+[1-9]\d{9,14}$/.test(cleanPhone)
  }
}

/**
 * Validar telefone brasileiro (mantido para compatibilidade)
 */
export function isValidBrazilianPhone(phone: string): boolean {
  // Remover caracteres não numéricos
  const cleanPhone = phone.replace(/[^\d]/g, '')

  // Verificar se tem 10 ou 11 dígitos (com ou sem 9 no celular)
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false

  // Verificar DDD válido (11-99, exceto alguns)
  const ddd = parseInt(cleanPhone.substring(0, 2))
  if (ddd < 11 || ddd > 99) return false

  // Verificar se não é tudo igual
  if (/^(\d)\1+$/.test(cleanPhone)) return false

  return true
}

/**
 * Formatar CPF
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/[^\d]/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formatar CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/[^\d]/g, '')
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formatar telefone (internacional ou brasileiro)
 * Usa libphonenumber-js para formatação automática baseada no país
 */
export function formatPhone(phone: string): string {
  if (!phone) return ''

  try {
    const phoneNumber = parsePhoneNumber(phone)
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational()
    }
    // Se não conseguir parsear, tentar formatar como incompleto
    return formatIncompletePhoneNumber(phone)
  } catch {
    // Fallback para formatação brasileira
    return formatBrazilianPhone(phone)
  }
}

/**
 * Formatar telefone brasileiro (mantido para compatibilidade)
 */
export function formatBrazilianPhone(phone: string): string {
  const clean = phone.replace(/[^\d]/g, '')

  if (clean.length === 11) {
    // Celular: (11) 98765-4321
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (clean.length === 10) {
    // Fixo: (11) 3456-7890
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return phone
}

/**
 * Validar CPF com feedback
 */
export function validateCPF(cpf: string): {
  isValid: boolean
  error?: string
  formatted?: string
} {
  if (!cpf || cpf.trim() === '') {
    return { isValid: true } // CPF é opcional
  }

  const isValid = isValidCPF(cpf)

  if (!isValid) {
    return {
      isValid: false,
      error: 'CPF inválido',
    }
  }

  return {
    isValid: true,
    formatted: formatCPF(cpf),
  }
}

/**
 * Validar CNPJ com feedback
 */
export function validateCNPJ(cnpj: string): {
  isValid: boolean
  error?: string
  formatted?: string
} {
  if (!cnpj || cnpj.trim() === '') {
    return { isValid: true } // CNPJ é opcional
  }

  const isValid = isValidCNPJ(cnpj)

  if (!isValid) {
    return {
      isValid: false,
      error: 'CNPJ inválido',
    }
  }

  return {
    isValid: true,
    formatted: formatCNPJ(cnpj),
  }
}

/**
 * Validar telefone com feedback
 */
export function validatePhone(phone: string): {
  isValid: boolean
  error?: string
  formatted?: string
} {
  if (!phone || phone.trim() === '') {
    return { isValid: true } // Telefone é opcional
  }

  const isValid = isValidPhone(phone)

  if (!isValid) {
    return {
      isValid: false,
      error: 'Telefone inválido. Use o formato: (11) 98765-4321',
    }
  }

  return {
    isValid: true,
    formatted: formatPhone(phone),
  }
}

// ============================================
// MÁSCARAS DE INPUT
// ============================================

/**
 * Máscara para CPF enquanto digita
 */
export function maskCPF(value: string): string {
  const clean = value.replace(/\D/g, '')
  const limited = clean.slice(0, 11)

  if (limited.length <= 3) return limited
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`
  if (limited.length <= 9)
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`

  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
}

/**
 * Máscara para CNPJ enquanto digita
 */
export function maskCNPJ(value: string): string {
  const clean = value.replace(/\D/g, '')
  const limited = clean.slice(0, 14)

  if (limited.length <= 2) return limited
  if (limited.length <= 5) return `${limited.slice(0, 2)}.${limited.slice(2)}`
  if (limited.length <= 8)
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`
  if (limited.length <= 12)
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`

  return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`
}

/**
 * Máscara para telefone enquanto digita (internacional)
 * A formatação é feita automaticamente pelo react-phone-number-input
 * Esta função é mantida apenas para compatibilidade
 */
export function maskPhone(value: string): string {
  // Se já começar com +, é um número internacional - retornar como está
  if (value.startsWith('+')) {
    return value
  }

  // Caso contrário, aplicar máscara brasileira
  const clean = value.replace(/\D/g, '')
  const limited = clean.slice(0, 11)

  if (limited.length <= 2) return limited
  if (limited.length <= 6) {
    // (11) 3456
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  }
  if (limited.length <= 10) {
    // (11) 3456-7890
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
  }

  // (11) 98765-4321
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
}

// ============================================
// CONSTANTES
// ============================================

export const VALIDATION_RULES = {
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
  INVALID_CPF: 'CPF inválido',
  INVALID_CNPJ: 'CNPJ inválido',
  INVALID_PHONE: 'Telefone inválido',
} as const
