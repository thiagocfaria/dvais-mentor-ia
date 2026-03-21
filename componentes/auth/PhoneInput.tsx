'use client'

import { useState, useRef } from 'react'
import Icon from '../Icon'
import PhoneInputWithCountry, {
  type Country,
  getCountries,
  getCountryCallingCode,
} from 'react-phone-number-input'
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js'
import 'react-phone-number-input/style.css'

interface CustomPhoneInputProps {
  value?: string
  onChange?: (value: string | undefined) => void
  error?: string
  disabled?: boolean
  required?: boolean
  defaultCountry?: Country
  className?: string
  placeholder?: string
}

export default function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  defaultCountry = 'BR',
  className = '',
  ...props
}: CustomPhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputRef = useRef<any>(null)

  return (
    <div className={`relative ${className}`} style={{ overflow: 'visible', zIndex: 1 }}>
      <div
        className={`
          relative flex items-center
          rounded-lg transition-all duration-300
          ${
            error
              ? 'border-red-500/50 bg-red-500/5'
              : isFocused
                ? 'border-blue-500 bg-white/10'
                : 'border-white/10 bg-white/5'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          border
          hover:border-white/20
        `}
        style={{ overflow: 'visible' }}
      >
        {/* Componente PhoneInputWithCountry */}
        <PhoneInputWithCountry
          ref={inputRef}
          international
          defaultCountry={defaultCountry}
          value={value}
          onChange={onChange ? val => onChange(val || undefined) : () => {}}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          required={required}
          numberInputProps={{
            className: `
              w-full px-4 py-3
              bg-transparent
              text-white placeholder-gray-500
              focus:outline-none
              transition-all duration-300
              ${disabled ? 'cursor-not-allowed' : ''}
            `,
            autoComplete: 'tel',
            'aria-label': 'Número de telefone',
            'aria-required': required,
            'aria-invalid': error ? 'true' : 'false',
          }}
          countrySelectProps={{
            className: 'phone-input-country-select',
            'aria-label': 'Selecionar país',
          }}
          {...props}
        />
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}

      {/* Dica de formato (opcional) */}
      {!error && value && isValidPhoneNumber(value) && (
        <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
          <Icon name="fas fa-check-circle" aria-hidden="true" />
          <span>Número válido</span>
        </p>
      )}
    </div>
  )
}

// Exportar utilitários úteis
export { getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumber }
export type { Country }
