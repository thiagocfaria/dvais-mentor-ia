import RegisterForm from '@/componentes/auth/RegisterForm'
import Icon from '@/componentes/Icon'

/**
 * Página pública de cadastro usada como demonstração de formulário.
 *
 * O foco é mostrar validação forte, experiência responsiva e componentes
 * reutilizáveis sem fingir persistência ou autenticação real.
 */
export default function RegisterPage() {
  return (
    <>
      <main
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ paddingTop: '140px', paddingBottom: '60px' }}
      >
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Crie sua conta
            </h1>
            <p className="text-lg text-gray-400">
              Demonstração de formulário com validação forte e UX responsiva
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-semibold text-white">Demo de interface</p>
            <p className="mt-1">
              O cadastro abaixo não persiste dados. Ele existe para demonstrar regras de validação,
              experiência mobile e componentes reutilizáveis.
            </p>
          </div>

          {/* Card do formulário */}
          <div
            id="cadastro-card"
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }}
          >
            <RegisterForm />
          </div>

          {/* Informações de segurança */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
              <Icon name="fas fa-lock" aria-hidden="true" />
              <span>Seus dados estão protegidos com HTTPS/TLS</span>
            </p>
            <p className="text-xs text-gray-600">
              Ao criar uma conta, você visualiza uma jornada demonstrativa com Termos de Uso e
              Política de Privacidade
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
