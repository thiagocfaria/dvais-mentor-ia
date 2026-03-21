import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacidade',
  description:
    'Resumo de privacidade da versão pública demonstrativa do projeto DVAi$ - Mentor IA.',
}

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen px-4 py-20 lg:px-8" style={{ paddingTop: '140px' }}>
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-extrabold text-white">Privacidade</h1>
        <div className="mt-8 space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white">Escopo desta versão</h2>
            <p className="mt-2">
              Esta publicação é uma demonstração técnica. Os formulários de login e cadastro não
              criam conta real nem persistem dados em backend público.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">Dados de interação</h2>
            <p className="mt-2">
              O projeto inclui métricas técnicas e logs locais para desenvolvimento, mas a vitrine
              pública foi ajustada para não expor artefatos operacionais no repositório.
            </p>
          </section>
          <section id="cookies">
            <h2 className="text-xl font-semibold text-white">Cookies e armazenamento local</h2>
            <p className="mt-2">
              A aplicação pode usar armazenamento local do navegador para preferências da interface
              e estado do assistente. Nesta versão demonstrativa, isso é utilizado apenas para
              experiência local do usuário.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
