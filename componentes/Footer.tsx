import Link from 'next/link'
import Icon from './Icon'

/**
 * Footer Component
 *
 * Rodapé da aplicação com informações e links
 * - Logo e descrição da marca
 * - Links sociais (preparado para integração)
 * - Links de navegação (Produto, Empresa, Legal)
 * - Copyright e créditos
 *
 * Estrutura:
 * - 4 colunas em desktop (Brand, Produto, Empresa, Legal)
 * - 1 coluna em mobile (stack vertical)
 * - Links de navegação com smooth scroll (via CSS global)
 * - Links sociais preparados para integração
 *
 * Performance:
 * - Server Component (compatível com App Router)
 * - Scroll suave via CSS (scroll-behavior: smooth no globals.css)
 * - Lazy loaded na página principal (app/page.tsx)
 * - Não crítico para FCP (abaixo da dobra)
 *
 * @returns {JSX.Element} Rodapé completo com links e informações
 */
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Icon name="fas fa-brain" className="text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                DVAi$ - Mentor IA
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Portfólio técnico em Next.js com assistente contextual, validação de fluxos e camada
              de resiliência para integrações de IA.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4 pt-2">
              <Link
                href="/contato"
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-500/10 transition-all duration-300"
                aria-label="Ir para contato"
              >
                <Icon name="fas fa-envelope" />
              </Link>
              <a
                href="https://github.com/thiagocfaria/dvais-mentor-ia"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-500/10 transition-all duration-300"
                aria-label="Abrir repositório no GitHub"
              >
                <Icon name="fab fa-github" />
              </a>
              <Link
                href="/aprendizado-continuo"
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-500/10 transition-all duration-300"
                aria-label="Ir para página de aprendizado contínuo"
              >
                <Icon name="fas fa-compass" />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#features"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Funcionalidades
                </a>
              </li>
              <li>
                <Link
                  href="/cadastro"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Demo de cadastro
                </Link>
              </li>
              <li>
                <Link
                  href="/seguranca"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Segurança e limites
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/analise-tempo-real"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Contexto e operação
                </Link>
              </li>
              <li>
                <Link
                  href="/aprendizado-continuo"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Aprendizado guiado
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacidade"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Termos
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade#cookies"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-left text-gray-400 text-sm">
            <div>
              © {currentYear} DVAi$ - Mentor IA. Protótipo técnico para portfólio e entrevista.
              <span className="mt-2 block text-xs text-gray-500 md:ml-3 md:mt-0 md:inline">
                Desenvolvido por Thiago Caetano Faria
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end space-x-6 text-sm text-gray-400">
            <span className="flex items-center text-center md:text-left">
              <Icon name="fas fa-code" className="text-cyan-300 mr-2" />
              Foco em UX guiada, validação de dados e confiabilidade operacional
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
