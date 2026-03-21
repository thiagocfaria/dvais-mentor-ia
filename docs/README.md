# Documentacao - DVAi$ Mentor IA

Este diretório reúne a documentação técnica da versão pública do projeto.

## Visao geral
O DVAi$ - Mentor IA é apresentado aqui como um protótipo técnico em Next.js com assistente contextual por voz e clique, navegação guiada e uma camada de resiliência para integração com LLM. A documentação deve refletir esse escopo, sem vender backend de autenticação real ou operação de mercado comprovada.

## Mapa rapido
- `docs/ARQUITETURA.md` - visão geral e fluxos principais do sistema.
- `docs/ASSISTENTE_LIVE.md` - funcionamento do assistente contextual.
- `docs/API.md` - endpoints e contratos da API.
- `docs/EXECUCAO_LOCAL.md` - como rodar localmente.
- `docs/TESTES.md` - como executar verificações locais.
- `docs/SEGURANCA_PERFORMANCE.md` - controles de segurança e performance.
- `docs/ESTRUTURA_PROJETO.md` - estrutura atual do repositório.
- `docs/OPERACAO_PRODUCAO.md` - deploy, rollback e checklist de operação.
- `docs/OBSERVABILIDADE.md` - Web Vitals, logs e indicadores recomendados.
- `docs/PERFORMANCE_BUDGET.md` - orçamento de performance e metas.

## Atalhos
- Iniciar ambiente local: `npm run dev`
- Rodar testes unitarios: `npm run test:unit`
- Rodar testes E2E: `npm run test:e2e`

## Observacoes
- O modo texto do assistente fica oculto por padrão e só aparece com `NEXT_PUBLIC_ASSISTENTE_TEXT_DEBUG=true`.
- O assistente funciona nas páginas públicas antes do login.
