# P0 Simplificação do Assistente e Fix de Runtime

## 1. Resumo executivo

Esta rodada atacou dois problemas separados:

1. **UX excessivamente complexa** — o assistente exigia 3 cliques para chegar ao chat (widget → "Ativar assistente" → ConsentModal).
2. **Erro de runtime da IA** — "Nenhuma chave de IA foi configurada no servidor" sem tratamento claro na UI.

Após a correção:

- O assistente abre com **1 clique** ("Falar com Davi" → chat pronto).
- Sem etapa "Ativar assistente", sem ConsentModal obrigatório.
- "Selecionar item" aparece apenas uma vez (no input area, como ação secundária).
- "Guia rápido" removido (competia com ação principal).
- Mensagens de onboarding/intro não poluem mais o chat.
- Histórico não persiste entre páginas (apenas memória da sessão atual).
- Erro de chave IA tem mensagem clara na UI e log de diagnóstico no servidor.
- Health endpoint expõe `llm.status` para monitoramento.

## 2. Causa raiz — Runtime da IA

**Caminho do erro:** `route.ts` → `callLLM()` → `llmAdapter.ts:220-240` → `process.env.GROQ_API_KEY` / `OPENROUTER_API_KEY`.

**Diagnóstico:** O erro era legítimo — as variáveis de ambiente não estavam configuradas. Não havia bug de código. O que faltava era tratamento claro na UI e log de diagnóstico.

**Correção:**
- `llmAdapter.ts`: adicionado `console.warn` para log de cold start.
- `health/route.ts`: adicionado campo `llm.status: 'ok' | 'degraded' | 'unconfigured'`.
- `useAssistantAPI.ts`: adicionado caso `missing_api_key` no `mapAssistantError`.
- Novo teste unitário: `llmAdapter.test.ts` com cenário sem chave e cenário com chave mockada.

## 3. Causa raiz — UX complicada

**Fluxo anterior:** Widget → "Ativar assistente" → ConsentModal (3 modos) → chat ativado.

**Problemas:** "Selecionar item" duplicado (header + input), "Guia rápido" competindo, onboarding injetado no chat, sessionStorage persistindo histórico entre páginas.

**Correção:**
- `Assistente.tsx`: auto-ativação no mount com defaults por dispositivo. Removidos `activate()`, ConsentModal, Guia Rápido (`steps`/`runStep`).
- `AssistenteWidget.tsx`: removido header redundante ("Davi ao vivo"), passado `onClose`.
- `AssistantHeader.tsx`: removido botão "Selecionar item" duplicado.
- `InputArea.tsx`: removidos "Guia rápido", bloco de hints; placeholder simplificado.
- `ChatArea.tsx`: removido bloco "Como usar"; placeholder mínimo.
- `useConversationHistory.ts`: removida persistência em sessionStorage.
- `useAssistantSession.ts`: session ID gerado fresco a cada mount (cookie mantido para server).

## 4. Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `biblioteca/assistente/llmAdapter.ts` | `console.warn` no bloco missing key |
| `app/api/health/route.ts` | Campo `llm.status` adicionado |
| `componentes/Assistente/hooks/useAssistantAPI.ts` | Caso `missing_api_key` |
| `componentes/Assistente/Assistente.tsx` | Auto-ativação, remoção ConsentModal/activate/Guia Rápido |
| `componentes/Assistente/AssistenteWidget.tsx` | Removido header redundante, passado onClose |
| `componentes/Assistente/AssistantHeader.tsx` | Removido botão duplicado "Selecionar item" |
| `componentes/Assistente/InputArea.tsx` | Removido "Guia rápido", hints, placeholder simplificado |
| `componentes/Assistente/ChatArea.tsx` | Removido onboarding, placeholder mínimo |
| `componentes/Assistente/hooks/useConversationHistory.ts` | Removida persistência sessionStorage |
| `componentes/Assistente/hooks/useAssistantSession.ts` | Session ID fresco por mount |
| `.env.example` | Comentários mais claros sobre cenários sem chave |
| `docs/OPERACAO_PRODUCAO.md` | Checklist com validação LLM |

## 5. Arquivos criados

| Arquivo | Propósito |
|---------|-----------|
| `biblioteca/assistente/__tests__/llmAdapter.test.ts` | Testes de runtime (missing key + configured key) |
| `tests/e2e/assistente-ux.spec.ts` | E2E da UX simplificada |
| `scripts/check_assistant.ts` | Diagnóstico rápido do assistente |

## 6. O que ainda falta

- Deletar `ConsentModal.tsx` (dead code — import já removido, pode ser deletado em cleanup).
- E2E não roda em CI hoje (precisa de servidor). Considerar setup com `webServer` no Playwright config.
- Smoke test mais sofisticado de voz/TTS requer browser real (limitação do Playwright).

## 7. Como validar

### Local
```bash
npm run lint
npm run test:unit        # 81 testes, incluindo 2 novos do llmAdapter
npm run build
npm run test:e2e         # Requer servidor rodando ou build prévio
npx tsx scripts/check_assistant.ts
```

### Na Vercel
1. Configurar `GROQ_API_KEY` em Environment Variables.
2. Deploy e verificar `/api/health` — esperar `llm.configured: true`, `llm.status: ok`.
3. Abrir o site e clicar "Falar com Davi" — chat abre em 1 clique.

### Variáveis de ambiente obrigatórias
| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `GROQ_API_KEY` | Sim* | Provider primário (llama-3.3-70b) |
| `OPENROUTER_API_KEY` | Não | Fallback (mistral-7b-free) |

*Pelo menos uma das duas. Sem nenhuma, apenas KB responde.

### Comando de diagnóstico
```bash
npx tsx scripts/check_assistant.ts              # local
npx tsx scripts/check_assistant.ts https://seu-dominio.vercel.app  # produção
```
