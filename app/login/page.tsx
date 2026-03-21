import LoginForm from '@/componentes/auth/LoginForm'
import Icon from '@/componentes/Icon'

/**
 * Página pública de login usada como demonstração de interface.
 *
 * O objetivo aqui é expor UX, validação local e componentes reutilizáveis
 * sem sugerir autenticação real nesta versão do projeto.
 */
export default function LoginPage() {
  return (
    <>
      <main
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ paddingTop: '140px' }}
      >
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Bem-vindo de volta
            </h1>
            <p className="text-lg text-gray-400">
              Demonstração de interface de login com validação local
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-semibold text-white">Demo de interface</p>
            <p className="mt-1">
              Esta tela demonstra UX, validação e componentes reutilizáveis. Não existe backend de
              autenticação conectado nesta versão pública.
            </p>
          </div>

          {/* Card do formulário */}
          <div
            id="login-card"
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }}
          >
            <LoginForm />
          </div>

          {/* Informações de segurança */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
              <Icon name="fas fa-lock" aria-hidden="true" />
              <span>Ambiente preparado para HTTPS/TLS em deploy</span>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
