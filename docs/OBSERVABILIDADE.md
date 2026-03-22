# Observabilidade e Metricas

## Web Vitals
O componente `WebVitals` coleta as metricas CLS, FCP, INP, LCP e TTFB.
Em producao, os dados sao enviados para `POST /api/metrics`.

## Endpoint de metricas
- **Rota**: `/api/metrics`
- **Metodo**: POST
- **Payload**:
```json
{ "name": "LCP", "value": 1500, "rating": "good", "path": "/" }
```

## Logs
- Em ambiente local/desenvolvimento, os logs operacionais sao salvos em `storage/logs/log_ops.jsonl`.
- Em producao, esse arquivo deve ser tratado apenas como fallback local; a referencia principal deve ser um coletor externo ou a observabilidade do provedor.
- Eventos de circuit breaker e rate limit tambem sao registrados.

## Indicadores recomendados
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- Taxa de erro do assistente < 1%
