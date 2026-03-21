'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { validateRegisterForm } from '@/biblioteca/auth/validation'
import { maskCPF } from '@/biblioteca/auth/validation-br'
import type { RegisterFormProps, RegisterData } from '@/tipos/auth'
import PasswordStrength from './PasswordStrength'
import OAuthButtons from './OAuthButtons'
import Icon from '../Icon'

// Lazy load PhoneInput (pesado: ~350KB com libphonenumber-js + country-flag-icons)
const PhoneInput = dynamic(() => import('./PhoneInput'), {
  ssr: false,
  loading: () => null,
})

export default function RegisterForm({
  showOAuth = true,
  showLoginLink = true,
  requireCPF = false,
  requirePhone = false,
}: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    phone: '',
    acceptTerms: false,
    marketingConsent: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [demoFeedback, setDemoFeedback] = useState<string | null>(null)

  const handleChange = (field: keyof RegisterData, value: string | boolean) => {
    // Aplicar máscaras (telefone agora é gerenciado pelo PhoneInput)
    if (field === 'cpf' && typeof value === 'string') {
      value = maskCPF(value)
    }
    // PhoneInput já formata automaticamente, não precisa de máscara manual

    setFormData(prev => ({ ...prev, [field]: value }))
    setDemoFeedback(null)

    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handlePhoneChange = (value: string | undefined) => {
    handleChange('phone', value || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar formulário
    const validation = validateRegisterForm(formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Preparado para integração com API
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(validation.data)
      // })

      // Simulação (remover quando integrar backend)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setDemoFeedback(
        'Cadastro validado em modo demonstrativo. Esta versão pública não grava dados nem cria conta real.'
      )

      // Redirecionar (quando tiver backend)
      // router.push(redirectTo)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta'
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome Completo */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            className={`
              w-full px-4 py-3 rounded-lg
              bg-white/5 border ${errors.name ? 'border-red-500/50' : 'border-white/10'}
              text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-300
            `}
            placeholder="João Silva"
            disabled={isSubmitting}
            autoComplete="name"
            required
          />
          {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={e => handleChange('email', e.target.value)}
            className={`
              w-full px-4 py-3 rounded-lg
              bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10'}
              text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-300
            `}
            placeholder="seu@email.com"
            disabled={isSubmitting}
            autoComplete="email"
            required
          />
          {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
        </div>

        {/* Grid para CPF e Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-2">
              CPF {requireCPF && '*'}
            </label>
            <input
              id="cpf"
              type="text"
              value={formData.cpf}
              onChange={e => handleChange('cpf', e.target.value)}
              className={`
                w-full px-4 py-3 rounded-lg
                bg-white/5 border ${errors.cpf ? 'border-red-500/50' : 'border-white/10'}
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-300
              `}
              placeholder="000.000.000-00"
              disabled={isSubmitting}
              autoComplete="off"
              maxLength={14}
              required={requireCPF}
            />
            {errors.cpf && <p className="mt-2 text-sm text-red-400">{errors.cpf}</p>}
          </div>

          {/* Telefone com Seletor de País */}
          <div style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
              Telefone {requirePhone && '*'}
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={handlePhoneChange}
              error={errors.phone}
              disabled={isSubmitting}
              required={requirePhone}
              defaultCountry="BR"
              placeholder="Selecione o país e digite o número"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Senha *
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={e => handleChange('password', e.target.value)}
              className={`
                w-full px-4 py-3 rounded-lg
                bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-white/10'}
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-300
                pr-12
              `}
              placeholder="Mínimo 12 caracteres"
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              <Icon name={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
            </button>
          </div>
          {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}

          {/* Indicador de força */}
          <PasswordStrength
            password={formData.password}
            showFeedback={true}
            showScore={true}
            minScore={60}
          />
        </div>

        {/* Confirmar Senha */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Confirmar Senha *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={e => handleChange('confirmPassword', e.target.value)}
              className={`
                w-full px-4 py-3 rounded-lg
                bg-white/5 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'}
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-300
                pr-12
              `}
              placeholder="Digite a senha novamente"
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              <Icon
                name={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                aria-hidden="true"
              />
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Termos de uso */}
        <div className="space-y-3">
          <div className="flex items-start">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={e => handleChange('acceptTerms', e.target.checked)}
              className="w-4 h-4 mt-1 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-300">
              Aceito os{' '}
              <a href="/termos" target="_blank" className="text-blue-400 hover:text-blue-300">
                Termos de Uso
              </a>{' '}
              e a{' '}
              <a href="/privacidade" target="_blank" className="text-blue-400 hover:text-blue-300">
                Política de Privacidade
              </a>{' '}
              *
            </label>
          </div>
          {errors.acceptTerms && <p className="ml-7 text-sm text-red-400">{errors.acceptTerms}</p>}

          <div className="flex items-start">
            <input
              id="marketingConsent"
              type="checkbox"
              checked={formData.marketingConsent}
              onChange={e => handleChange('marketingConsent', e.target.checked)}
              className="w-4 h-4 mt-1 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="marketingConsent" className="ml-3 text-sm text-gray-400">
              Quero receber novidades e ofertas por email (opcional)
            </label>
          </div>
        </div>

        {/* Erro geral */}
        {errors.submit && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{errors.submit}</p>
          </div>
        )}

        {demoFeedback && (
          <div className="p-4 rounded-lg border border-cyan-400/30 bg-cyan-400/10">
            <p className="text-sm text-cyan-100">{demoFeedback}</p>
          </div>
        )}

        {/* Botão de submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full px-6 py-3 rounded-lg
            bg-gradient-to-r from-blue-600 to-cyan-500
            text-white font-semibold
            hover:from-blue-500 hover:to-cyan-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {isSubmitting ? (
            <>
              <Icon name="fas fa-spinner" spin aria-hidden="true" />
              <span>Criando conta...</span>
            </>
          ) : (
            <>
              <Icon name="fas fa-user-plus" aria-hidden="true" />
              <span>Criar Conta</span>
            </>
          )}
        </button>
      </form>

      {/* OAuth Buttons */}
      {showOAuth && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-400">Ou cadastre-se com</span>
            </div>
          </div>

          <div className="mt-6">
            <OAuthButtons mode="register" />
          </div>
        </div>
      )}

      {/* Link para login */}
      {showLoginLink && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Já tem uma conta?{' '}
            <a
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Fazer login
            </a>
          </p>
        </div>
      )}
    </>
  )
}
