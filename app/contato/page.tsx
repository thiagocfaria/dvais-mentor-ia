import type { Metadata } from 'next'
import Icon from '@/componentes/Icon'

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Informações de contato e contexto sobre o repositório DVAi$ - Mentor IA.',
}

export default function ContatoPage() {
  return (
    <main className="min-h-screen px-4 py-20 lg:px-8" style={{ paddingTop: '140px' }}>
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-cyan-500/20">
          <Icon name="fas fa-envelope" className="text-xl text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-extrabold text-white">Contato</h1>
        <p className="mt-4 text-lg text-gray-300">
          Esta página existe para dar contexto à vitrine pública do projeto. O canal principal para
          análise do código e histórico é o repositório no GitHub.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-6">
          <a
            href="https://github.com/thiagocfaria/dvais-mentor-ia"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-cyan-200 transition-colors hover:text-cyan-100"
          >
            <Icon name="fab fa-github" aria-hidden="true" />
            <span>github.com/thiagocfaria/dvais-mentor-ia</span>
          </a>
          <p className="text-sm text-gray-400">
            Para entrevista técnica, use este projeto como demonstração de UX guiada, validação de
            entrada, resiliência de integração e documentação de engenharia.
          </p>
        </div>
      </div>
    </main>
  )
}
