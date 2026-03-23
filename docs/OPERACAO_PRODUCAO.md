# Operacao em Producao

## Deploy
1. Rodar `npm run build` para garantir build limpo.
2. Validar `npm run lint`, `npm run test:unit` e `npm run test:e2e`.
3. Publicar no provedor (Vercel ou equivalente).
4. Validar o deploy publicado com `npx tsx scripts/check_assistant.ts https://seu-dominio.vercel.app`.

## Rollback
- Manter o ultimo build estavel como referencia.
- Se algo critico falhar, retornar ao ultimo deploy com status OK.

## Monitoramento minimo
- Em ambiente local/desenvolvimento, os logs operacionais podem ser inspecionados em `storage/logs/log_ops.jsonl`.
- Em producao, prefira um coletor externo ou a observabilidade do provedor; o arquivo local nao deve ser tratado como fonte principal.
- Acompanhar Web Vitals enviados para `/api/metrics`.
- Monitorar taxa de erros 4xx/5xx no endpoint do assistente.

## Checklist rapido
- [ ] Lint e testes OK (`npm run lint && npm run test:unit && npm run test:e2e`).
- [ ] Build OK (`npm run build`).
- [ ] Pelo menos uma chave LLM configurada (`GROQ_API_KEY` ou `OPENROUTER_API_KEY`).
- [ ] `/api/health` retorna `llm.configured: true`, `llm.status: ok` e `kbVersion` real.
- [ ] `/api/health` expõe `build.gitSha` ou `build.buildId` para comprovar o rollout.
- [ ] Rodar `npx tsx scripts/check_assistant.ts` localmente para validar IA, health e rota.
- [ ] Rodar `npx tsx scripts/check_assistant.ts https://seu-dominio.vercel.app` para validar a produção publicada.
- [ ] Variaveis de ambiente de KV configuradas (se aplicavel).
- [ ] Metricas recebendo dados em prod.
- [ ] Teste manual no celular para `Tocar para falar`, `Ouvir resposta` e `Funciona no celular?`.
