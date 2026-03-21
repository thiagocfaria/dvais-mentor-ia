# Operacao em Producao

## Deploy
1. Rodar `npm run build` para garantir build limpo.
2. Validar `npm run lint` e `npm run test:unit`.
3. Publicar no provedor (Vercel ou equivalente).

## Rollback
- Manter o ultimo build estavel como referencia.
- Se algo critico falhar, retornar ao ultimo deploy com status OK.

## Monitoramento minimo
- Em ambiente local/desenvolvimento, os logs operacionais podem ser inspecionados em `storage/logs/log_ops.jsonl`.
- Em producao, prefira um coletor externo ou a observabilidade do provedor; o arquivo local nao deve ser tratado como fonte principal.
- Acompanhar Web Vitals enviados para `/api/metrics`.
- Monitorar taxa de erros 4xx/5xx no endpoint do assistente.

## Checklist rapido
- [ ] Lint e testes OK.
- [ ] Build OK.
- [ ] Variaveis de ambiente configuradas (LLM e KV).
- [ ] Metricas recebendo dados em prod.
