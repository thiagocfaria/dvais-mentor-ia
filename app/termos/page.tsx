import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos',
  description: 'Resumo de termos de uso da versão pública demonstrativa do projeto.',
}

export default function TermosPage() {
  return (
    <main className="min-h-screen px-4 py-20 lg:px-8" style={{ paddingTop: '140px' }}>
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-extrabold text-white">Termos de uso</h1>
        <div className="mt-8 space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white">Natureza do projeto</h2>
            <p className="mt-2">
              Este repositório é um protótipo técnico para fins de portfólio e avaliação de
              engenharia. Ele não representa uma plataforma de investimento pronta para produção.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">Limites da demonstração</h2>
            <p className="mt-2">
              O conteúdo e os fluxos apresentados possuem caráter ilustrativo. Não há promessa de
              retorno financeiro, autenticação completa ou integração pública com corretoras nesta
              versão.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">Uso responsável</h2>
            <p className="mt-2">
              A demonstração deve ser usada para avaliar UX, código e decisões técnicas. Qualquer
              decisão financeira real deve ser tomada com validação própria e contexto adequado.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
