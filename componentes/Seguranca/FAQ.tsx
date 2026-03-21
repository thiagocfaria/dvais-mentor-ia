import Icon from '@/componentes/Icon'

/**
 * FAQ - Proteção Inteligente
 *
 * Server Component usando <details>/<summary> (acessível e sem JS).
 */
export default function FAQ() {
  const faqs = [
    {
      q: 'Vocês são corretora ou fazem custódia?',
      a: 'Não. O DVAi$ - Mentor IA não é corretora, não faz custódia e não movimenta fundos. Você opera diretamente na sua plataforma/corretora.',
    },
    {
      q: 'Vocês pedem senha da corretora ou guardam credenciais?',
      a: 'Não. Nesta página pública não coletamos nenhum dado e, no produto, não solicitamos senha de corretora nem orientamos saque/depósito pela plataforma.',
    },
    {
      q: 'O que são “Alertas Inteligentes”?',
      a: 'São avisos com contexto e checklist para reduzir erro operacional e melhorar disciplina. Eles não garantem retorno e não substituem sua decisão.',
    },
    {
      q: 'O Guia Financeiro é opcional?',
      a: 'Sim, é um add-on opcional que ajuda a alinhar exposição e risco à sua realidade (receitas, despesas, objetivos). Importante: para que os alertas de segurança funcionem com precisão, recomendamos ativar este pacote, pois precisamos conhecer sua realidade econômica para sugerir quando avançar ou quando pausar investimentos, garantindo decisões mais seguras e alinhadas ao seu momento financeiro.',
    },
    {
      q: 'Quais dados o Guia Financeiro usa?',
      a: 'Apenas o que o usuário informa (ex.: receitas, despesas, metas, lucros/prejuízos). A ideia é sugerir limites e relatórios mensais de forma educacional.',
    },
    {
      q: 'Como funciona privacidade e consentimento no Guia Financeiro?',
      a: 'A proposta é operar com minimização de dados e consentimento explícito. Você controla o que informa e pode revisar/remover quando quiser. Nesta página pública, nada é coletado.',
    },
    {
      q: 'Isso é consultoria financeira regulada?',
      a: 'Não. É uma ferramenta educacional e automatizada. A decisão final é sempre do usuário, sem promessas de retorno.',
    },
  ]

  return (
    <section className="py-20 px-4 lg:px-8" aria-labelledby="faq">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 id="faq" className="text-3xl lg:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Perguntas Frequentes
            </span>
          </h2>
          <p className="text-xl text-gray-400">
            Respostas curtas e transparentes para as dúvidas mais comuns.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map(item => (
            <details
              key={item.q}
              className="group glass-intense border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-blue-400/30"
            >
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Icon name="fas fa-star" className="text-cyan-300 mt-1" aria-hidden="true" />
                  <span className="text-white font-semibold leading-relaxed">{item.q}</span>
                </div>
                <Icon
                  name="fas fa-arrow-right"
                  className="text-blue-300 mt-1 transition-transform duration-300 group-open:rotate-90"
                  aria-hidden="true"
                />
              </summary>
              <div className="pt-4 pl-8 text-gray-300 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
