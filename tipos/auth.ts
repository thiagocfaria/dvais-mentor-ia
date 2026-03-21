/**
 * Tipos TypeScript para Sistema de Autenticação
 *
 * IMPORTANTE: Estes tipos são usados tanto no frontend quanto no backend.
 * Mantenha sincronizado com o schema do Prisma.
 */

// ============================================
// USER TYPES
// ============================================

/**
 * Papel/função do usuário
 */
export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'

/**
 * Interface completa do usuário
 */
export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  role: UserRole

  // Campos adicionais
  cpf: string | null
  cnpj: string | null
  phone: string | null
  phoneVerified: boolean

  // Auditoria
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  lastLoginIp: string | null

  // MFA
  mfaEnabled: boolean

  // Status
  isActive: boolean
  isLocked: boolean
  lockReason: string | null
  lockedUntil: Date | null
}

/**
 * Usuário público (sem dados sensíveis)
 */
export interface PublicUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
  mfaEnabled: boolean
  createdAt: Date
}

/**
 * Usuário para sessão (dados mínimos)
 */
export interface SessionUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
}

// ============================================
// AUTH TYPES
// ============================================

/**
 * Credenciais de login
 */
export interface LoginCredentials {
  email: string
  password: string
  mfaToken?: string
  deviceId?: string
  rememberMe?: boolean
}

/**
 * Dados de registro
 */
export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
  cpf?: string
  cnpj?: string
  phone?: string
  acceptTerms: boolean
  marketingConsent?: boolean
}

/**
 * Dados de reset de senha
 */
export interface PasswordResetRequest {
  email: string
}

/**
 * Dados de nova senha
 */
export interface NewPasswordData {
  token: string
  password: string
  confirmPassword: string
}

/**
 * Resultado de autenticação
 */
export interface AuthResult {
  success: boolean
  user?: SessionUser
  token?: string
  error?: string
  requiresMFA?: boolean
}

/**
 * Resultado de registro
 */
export interface RegisterResult {
  success: boolean
  user?: PublicUser
  error?: string
  errors?: Record<string, string>
}

// ============================================
// SESSION TYPES
// ============================================

/**
 * Interface de sessão
 */
export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: Date
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user?: SessionUser
}

/**
 * Payload do JWT
 */
export interface JWTPayload {
  sub: string // user ID
  email: string
  role: UserRole
  iat: number // issued at
  exp: number // expires at
  jti?: string // JWT ID
}

// ============================================
// OAUTH TYPES
// ============================================

/**
 * Provedores OAuth suportados
 */
export type OAuthProvider = 'google' | 'facebook' | 'apple' | 'microsoft'

/**
 * Conta OAuth
 */
export interface OAuthAccount {
  id: string
  userId: string
  provider: OAuthProvider
  providerAccountId: string
  refreshToken: string | null
  accessToken: string | null
  expiresAt: number | null
  tokenType: string | null
  scope: string | null
}

/**
 * Perfil OAuth do Google
 */
export interface GoogleProfile {
  sub: string
  name: string
  email: string
  email_verified: boolean
  picture: string
  given_name: string
  family_name: string
  locale: string
}

/**
 * Perfil OAuth do GitHub
 */
export interface GitHubProfile {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  bio: string | null
}

// ============================================
// MFA TYPES
// ============================================

/**
 * Configuração de MFA
 */
export interface MFASetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

/**
 * Verificação de MFA
 */
export interface MFAVerification {
  userId: string
  token: string
}

/**
 * Status de MFA
 */
export interface MFAStatus {
  enabled: boolean
  verified: boolean
  backupCodesRemaining: number
}

// ============================================
// VALIDATION TYPES
// ============================================

/**
 * Resultado de validação genérico
 */
export interface ValidationResult<T = any> {
  isValid: boolean
  error?: string
  errors?: Record<string, string>
  data?: T
}

/**
 * Força da senha
 */
export interface PasswordStrength {
  score: number // 0-100
  level: 'weak' | 'medium' | 'strong' | 'very-strong'
  feedback: string[]
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Resposta de API genérica
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string>
  message?: string
}

/**
 * Resposta de login
 */
export interface LoginResponse extends APIResponse {
  user?: SessionUser
  requiresMFA?: boolean
  token?: string
}

/**
 * Resposta de registro
 */
export interface RegisterResponse extends APIResponse {
  user?: PublicUser
  verificationEmailSent?: boolean
}

/**
 * Resposta de reset de senha
 */
export interface PasswordResetResponse extends APIResponse {
  emailSent?: boolean
}

// ============================================
// AUDIT LOG TYPES
// ============================================

/**
 * Tipo de ação para audit log
 */
export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTERED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'EMAIL_VERIFIED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'DATA_EXPORTED'
  | 'DATA_DELETED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'SECURITY_ALERT_NEW_DEVICE'
  | 'SECURITY_ALERT_UNUSUAL_LOCATION'
  | 'SECURITY_ALERT_MULTIPLE_FAILURES'

/**
 * Entrada de audit log
 */
export interface AuditLog {
  id: string
  userId: string | null
  action: AuditAction
  ipAddress: string
  userAgent: string | null
  metadata: Record<string, any> | null
  createdAt: Date
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Erro de autenticação
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Códigos de erro de autenticação
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_NOT_FOUND'
  | 'EMAIL_NOT_VERIFIED'
  | 'MFA_REQUIRED'
  | 'INVALID_MFA_TOKEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SESSION_EXPIRED'
  | 'INVALID_TOKEN'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_PWNED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'TERMS_NOT_ACCEPTED'

// ============================================
// FORM STATE TYPES
// ============================================

/**
 * Estado do formulário
 */
export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isValid: boolean
}

/**
 * Estado de validação de campo
 */
export interface FieldValidation {
  isDirty: boolean
  isTouched: boolean
  error: string | null
  isValidating: boolean
}

// ============================================
// SECURITY TYPES
// ============================================

/**
 * Informações de segurança da conta
 */
export interface AccountSecurity {
  mfaEnabled: boolean
  emailVerified: boolean
  phoneVerified: boolean
  lastPasswordChange: Date | null
  trustedDevices: number
  recentLogins: LoginAttempt[]
}

/**
 * Tentativa de login
 */
export interface LoginAttempt {
  id: string
  email: string
  ipAddress: string
  userAgent: string | null
  success: boolean
  createdAt: Date
  location?: {
    country: string
    city: string
  }
}

/**
 * Dispositivo confiável
 */
export interface TrustedDevice {
  id: string
  userId: string
  deviceId: string
  deviceName: string
  ipAddress: string
  userAgent: string
  lastUsed: Date
  createdAt: Date
}

/**
 * Token de reset de senha
 */
export interface PasswordResetToken {
  id: string
  email: string
  token: string
  expires: Date
  used: boolean
  usedAt: Date | null
  createdAt: Date
}

// ============================================
// RATE LIMITING TYPES
// ============================================

/**
 * Resultado de rate limiting
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // timestamp
}

/**
 * Configuração de rate limiting
 */
export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  message?: string
}

// ============================================
// NOTIFICATION TYPES
// ============================================

/**
 * Tipo de notificação de segurança
 */
export type SecurityNotificationType =
  | 'NEW_DEVICE'
  | 'UNUSUAL_LOCATION'
  | 'PASSWORD_CHANGED'
  | 'MFA_ENABLED'
  | 'MULTIPLE_FAILURES'
  | 'ACCOUNT_LOCKED'

/**
 * Notificação de segurança
 */
export interface SecurityNotification {
  type: SecurityNotificationType
  userId: string
  email: string
  subject: string
  message: string
  metadata?: Record<string, any>
  sentAt: Date
}

// ============================================
// GEOLOCATION TYPES
// ============================================

/**
 * Dados de geolocalização
 */
export interface Geolocation {
  country: string
  countryCode: string
  region: string
  city: string
  latitude: number
  longitude: number
  timezone: string
  isp?: string
}

// ============================================
// CONSENT TYPES (LGPD)
// ============================================

/**
 * Tipo de consentimento
 */
export type ConsentType = 'terms' | 'privacy' | 'marketing' | 'dataProcessing'

/**
 * Registro de consentimento
 */
export interface ConsentRecord {
  userId: string
  type: ConsentType
  granted: boolean
  version: string
  grantedAt: Date
  ipAddress: string
  userAgent: string
}

// ============================================
// ADMIN TYPES
// ============================================

/**
 * Estatísticas de usuários (admin)
 */
export interface UserStats {
  totalUsers: number
  activeUsers: number
  lockedAccounts: number
  mfaEnabled: number
  verifiedEmails: number
  registrationsToday: number
  loginSuccessToday: number
  loginFailuresToday: number
}

/**
 * Atividade suspeita (admin)
 */
export interface SuspiciousActivity {
  type: 'BRUTE_FORCE' | 'UNUSUAL_LOCATION' | 'MULTIPLE_DEVICES' | 'RAPID_REQUESTS'
  userId: string | null
  email: string
  ipAddress: string
  count: number
  firstSeen: Date
  lastSeen: Date
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Omitir campos sensíveis do usuário
 */
export type SafeUser = Omit<User, 'password' | 'mfaSecret'>

/**
 * Dados do usuário para criação
 */
export type CreateUserData = Pick<User, 'name' | 'email'> & {
  password: string
  cpf?: string
  cnpj?: string
  phone?: string
}

/**
 * Dados do usuário para atualização
 */
export type UpdateUserData = Partial<Pick<User, 'name' | 'phone' | 'image'>>

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Headers de requisição de autenticação
 */
export interface AuthHeaders {
  'x-csrf-token'?: string
  'x-device-id'?: string
  'x-client-version'?: string
  'user-agent': string
}

/**
 * Contexto de autenticação
 */
export interface AuthContext {
  user: SessionUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ============================================
// HOOK TYPES
// ============================================

/**
 * Retorno do hook useAuth
 */
export interface UseAuthReturn {
  user: SessionUser | null
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  signIn: (credentials: LoginCredentials) => Promise<AuthResult>
  signOut: () => Promise<void>
  register: (data: RegisterData) => Promise<RegisterResult>
  updateUser: (data: UpdateUserData) => Promise<void>
}

/**
 * Retorno do hook usePasswordStrength
 */
export interface UsePasswordStrengthReturn {
  strength: PasswordStrength
  isWeak: boolean
  isMedium: boolean
  isStrong: boolean
  isVeryStrong: boolean
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

/**
 * Props do componente LoginForm
 */
export interface LoginFormProps {
  onSuccess?: (user: SessionUser) => void
  onError?: (error: string) => void
  redirectTo?: string
  showOAuth?: boolean
  showRegisterLink?: boolean
}

/**
 * Props do componente RegisterForm
 */
export interface RegisterFormProps {
  onSuccess?: (user: PublicUser) => void
  onError?: (error: string) => void
  redirectTo?: string
  showOAuth?: boolean
  showLoginLink?: boolean
  requireCPF?: boolean
  requirePhone?: boolean
}

/**
 * Props do componente OAuthButtons
 */
export interface OAuthButtonsProps {
  providers?: OAuthProvider[]
  mode?: 'login' | 'register'
  onSuccess?: () => void
  onError?: (error: string) => void
}

/**
 * Props do componente PasswordStrength
 */
export interface PasswordStrengthProps {
  password: string
  showFeedback?: boolean
  showScore?: boolean
  minScore?: number
}

// ============================================
// CONFIG TYPES
// ============================================

/**
 * Configuração de autenticação
 */
export interface AuthConfig {
  // URLs
  loginUrl: string
  registerUrl: string
  logoutUrl: string
  callbackUrl: string

  // OAuth
  oauthProviders: OAuthProvider[]

  // Segurança
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumber: boolean
  passwordRequireSpecial: boolean

  // MFA
  mfaRequired: boolean
  mfaBackupCodes: number

  // Rate limiting
  loginMaxAttempts: number
  loginWindowMs: number
  registerMaxAttempts: number
  registerWindowMs: number

  // Sessões
  sessionMaxAge: number
  sessionUpdateAge: number

  // Email
  requireEmailVerification: boolean
  emailVerificationExpiresIn: number

  // Password reset
  passwordResetExpiresIn: number
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Tipo para campos opcionais de formulário
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Tipo para campos obrigatórios de formulário
 */
export type Required<T, K extends keyof T> = Omit<T, K> & globalThis.Required<Pick<T, K>>

/**
 * Extrair tipo de array
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

// ============================================
// CONSTANTS
// ============================================

/**
 * Constantes de autenticação
 */
export const AUTH_CONSTANTS = {
  // Timeouts
  SESSION_MAX_AGE: 24 * 60 * 60, // 24 horas em segundos
  JWT_MAX_AGE: 24 * 60 * 60, // 24 horas em segundos
  REFRESH_TOKEN_MAX_AGE: 30 * 24 * 60 * 60, // 30 dias em segundos
  EMAIL_VERIFICATION_EXPIRES: 24 * 60 * 60 * 1000, // 24 horas em ms
  PASSWORD_RESET_EXPIRES: 60 * 60 * 1000, // 1 hora em ms

  // Rate limiting
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 60 * 1000, // 1 minuto
  REGISTER_MAX_ATTEMPTS: 3,
  REGISTER_WINDOW_MS: 60 * 60 * 1000, // 1 hora
  PASSWORD_RESET_MAX_ATTEMPTS: 3,
  PASSWORD_RESET_WINDOW_MS: 60 * 60 * 1000, // 1 hora

  // Account lockout
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutos

  // Senhas
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_MIN_STRENGTH: 60, // Score mínimo aceitável

  // MFA
  MFA_BACKUP_CODES_COUNT: 10,
  MFA_TOKEN_WINDOW: 2, // Períodos de 30s aceitos antes/depois

  // Cookies
  COOKIE_NAME: '__Secure-next-auth.session-token',
  CSRF_COOKIE_NAME: 'csrf-token',
} as const

/**
 * Mensagens de erro padrão
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou senha incorretos',
  ACCOUNT_LOCKED: 'Conta bloqueada. Tente novamente mais tarde.',
  ACCOUNT_NOT_FOUND: 'Conta não encontrada',
  EMAIL_NOT_VERIFIED: 'Verifique seu email antes de fazer login',
  MFA_REQUIRED: 'Autenticação de dois fatores obrigatória',
  INVALID_MFA_TOKEN: 'Código de verificação inválido',
  RATE_LIMIT_EXCEEDED: 'Muitas tentativas. Aguarde alguns minutos.',
  SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
  INVALID_TOKEN: 'Token inválido ou expirado',
  WEAK_PASSWORD: 'Senha muito fraca. Use uma senha mais forte.',
  PASSWORD_PWNED: 'Esta senha foi encontrada em vazamentos de dados. Escolha outra.',
  EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado',
  TERMS_NOT_ACCEPTED: 'Você deve aceitar os termos de uso',
  GENERIC_ERROR: 'Erro ao processar solicitação. Tente novamente.',
} as const

/**
 * Mensagens de sucesso padrão
 */
export const AUTH_SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  REGISTER_SUCCESS: 'Conta criada com sucesso! Verifique seu email.',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
  PASSWORD_RESET_SENT: 'Email de recuperação enviado. Verifique sua caixa de entrada.',
  PASSWORD_CHANGED: 'Senha alterada com sucesso!',
  EMAIL_VERIFIED: 'Email verificado com sucesso!',
  MFA_ENABLED: 'Autenticação de dois fatores ativada!',
} as const

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Verificar se é um erro de autenticação
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}

/**
 * Verificar se usuário tem papel específico
 */
export function hasRole(user: SessionUser | null, role: UserRole | UserRole[]): boolean {
  if (!user) return false

  if (Array.isArray(role)) {
    return role.includes(user.role)
  }

  return user.role === role
}

/**
 * Verificar se usuário é admin
 */
export function isAdmin(user: SessionUser | null): boolean {
  return hasRole(user, 'ADMIN')
}

/**
 * Verificar se sessão está válida
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false
  return new Date(session.expires) > new Date()
}
