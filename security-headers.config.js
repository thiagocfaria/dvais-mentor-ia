/**
 * Security Headers Configuration
 * 
 * Headers de segurança recomendados para autenticação ultra-segura.
 * Importar este arquivo no next.config.js
 */

const securityHeaders = [
  // DNS Prefetch Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  
  // Strict Transport Security (HSTS)
  // Força HTTPS por 2 anos, incluindo subdomínios
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  
  // X-Frame-Options
  // Previne clickjacking
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN' // Apenas permite iframe do mesmo domínio
  },
  
  // X-Content-Type-Options
  // Previne MIME sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  
  // X-XSS-Protection
  // Proteção contra XSS (legacy, mas ainda útil)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  
  // Referrer-Policy
  // Controla informações de referrer enviadas
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  
  // Permissions-Policy
  // Controla features do navegador
  // microphone=(self) permite microfone no mesmo domínio (necessário para speech recognition)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()'
  },
  
  // Content-Security-Policy (CSP)
  // Proteção robusta contra XSS e code injection
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.upstash.io",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  }
]

module.exports = securityHeaders

