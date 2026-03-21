---
name: Cache Persistente Vercel KV
overview: Implementar cache persistente com Vercel KV (Redis) para resolver problemas de cache perdido em deploys, cache não compartilhado entre instâncias serverless e cold starts sem cache. Implementação com fallback seguro para cache em memória, garantindo que o sistema nunca quebre mesmo se KV falhar.
todos:
  - id: "1"
    content: Instalar @vercel/kv e atualizar package.json
    status: completed
  - id: "2"
    content: Criar biblioteca/cache/kvCache.ts com funções getFromCache, setInCache, invalidateCache e fallback automático
    status: completed
    dependencies:
      - "1"
  - id: "3"
    content: Atualizar route.ts para usar KV cache com fallback, substituindo cache.get() e cache.set()
    status: completed
    dependencies:
      - "2"
  - id: "4"
    content: Manter compatibilidade com state.ts, adicionando comentários sobre cache duplo
    status: completed
    dependencies:
      - "2"
  - id: "5"
    content: Criar documentação completa em docs/CACHE_PERSISTENTE_SETUP.md
    status: completed
    dependencies:
      - "2"
      - "3"
  - id: "6"
    content: "Testar funcionamento: com KV, sem KV, KV falhando, cache persistente após deploy"
    status: completed
    dependencies:
      - "3"
      - "4"
  - id: "7"
    content: "Validar métricas: cache hit rate, latência, fallback funcionando"
    status: in_progress
    dependencies:
      - "6"
  - id: "8"
    content: Gerar relatório final com feedback do que foi alcançado e melhorias futuras
    status: completed
    dependencies:
      - "7"
---

# P

lano: Cache Persistente com Vercel KV

## Objetivo

Implementar cache persistente usando Vercel KV (Redis) para resolver:

- Cache perdido em cada deploy/restart
- Cache não compartilhado entre instâncias serverless
- Cold starts sem cache disponível

## Arquitetura

```javascript
Request → Verificar KV Cache → Hit? → Retornar resposta
                ↓ Miss
         Verificar Memory Cache → Hit? → Retornar + Salvar KV
                ↓ Miss
         Processar (KB/LLM) → Salvar Memory + KV → Retornar
```



## Implementação

### Fase 1: Configuração e Dependências

**Arquivo:** `apps/painel-web/package.json`

- Adicionar `@vercel/kv` nas dependencies
- Versão: `^1.0.0` ou mais recente

**Arquivo:** `.env.local` (exemplo)

- Documentar variável `KV_REST_API_URL` (Vercel KV REST URL)
- Documentar variável `KV_REST_API_TOKEN` (Vercel KV REST Token)
- Nota: Variáveis serão configuradas no Vercel Dashboard

### Fase 2: Criar Módulo de Cache com Fallback

**Arquivo:** `apps/painel-web/biblioteca/cache/kvCache.ts` (NOVO)**Funcionalidades:**

1. **Função `getFromCache(key: string)`**

- Tentar buscar no Vercel KV primeiro
- Se KV falhar ou não configurado, fallback para cache em memória
- Retornar `CacheEntry | null`
- Log de erros silencioso (não bloquear resposta)

2. **Função `setInCache(key: string, value: CacheEntry)`**

- Tentar salvar no Vercel KV primeiro
- Se KV falhar, salvar apenas em memória (fallback)
- Operação assíncrona não bloqueante
- Log de erros silencioso

3. **Função `invalidateCache(pattern: string)`**

- Invalidar cache por padrão (opcional, para futuras melhorias)
- Fallback para limpeza de cache em memória

4. **Detecção Automática de Ambiente**

- Verificar se variáveis KV estão configuradas
- Se não configurado, usar apenas cache em memória
- Sistema funciona mesmo sem KV configurado

**Proteções:**

- Try-catch em todas as operações KV
- Timeout de 2 segundos para operações KV (evitar bloqueio)
- Fallback automático para cache em memória
- Logs estruturados para debugging (sem bloquear resposta)

### Fase 3: Integrar no Route Handler

**Arquivo:** `apps/painel-web/app/api/assistente/perguntar/route.ts`**Mudanças:**

1. **Importar funções de cache:**
   ```typescript
            import { getFromCache, setInCache } from '@/biblioteca/cache/kvCache'
   ```




2. **Substituir `cache.get()` por `await getFromCache()`:**

- Linha ~376: Verificar cache KV primeiro
- Se cache hit, retornar resposta imediatamente
- Se cache miss, continuar processamento

3. **Substituir `cache.set()` por `await setInCache()`:**

- Linha ~404: Após resposta KB
- Linha ~700: Após resposta LLM
- Salvar em KV e memória (fallback)

4. **Manter cache em memória como fallback:**

- Não remover `cache` de `state.ts`
- Usar como fallback quando KV não disponível
- Garantir compatibilidade retroativa

**Estratégia de Cache Duplo:**

- KV Cache: Persistente, compartilhado, rápido
- Memory Cache: Fallback, local, instantâneo
- Ambos atualizados simultaneamente quando possível

### Fase 4: Manter Compatibilidade com State.ts

**Arquivo:** `apps/painel-web/app/api/assistente/state.ts`**Mudanças:**

- Manter `cache` Map para fallback
- Adicionar comentário explicando uso duplo (KV + Memory)
- Não remover código existente (compatibilidade)

### Fase 5: Configuração e Documentação

**Arquivo:** `docs/CACHE_PERSISTENTE_SETUP.md` (NOVO)**Conteúdo:**

1. Como criar Vercel KV no dashboard
2. Como configurar variáveis de ambiente
3. Como testar funcionamento
4. Troubleshooting comum
5. Métricas e monitoramento

**Arquivo:** `.env.example` (atualizar se existir)

- Adicionar variáveis KV (comentadas)

### Fase 6: Testes e Validação

**Testes Manuais:**

1. Testar com KV configurado (cache persistente funciona)
2. Testar sem KV configurado (fallback para memória funciona)
3. Testar com KV falhando (timeout, erro de conexão)
4. Testar cache hit após deploy (persistência funciona)
5. Testar cache compartilhado (múltiplas instâncias)

**Validações:**

- Cache hit rate aumenta significativamente
- Latência reduzida em cold starts
- Sistema nunca quebra mesmo se KV falhar
- Fallback funciona corretamente

## Proteções Implementadas

1. **Fallback Automático:**

- Se KV não configurado → usa memória
- Se KV falhar → usa memória
- Se KV timeout → usa memória
- Sistema sempre funciona

2. **Timeout de Segurança:**

- Operações KV têm timeout de 2s
- Evita bloqueio de requisições
- Fallback automático após timeout

3. **Error Handling:**

- Try-catch em todas as operações
- Logs estruturados (não bloqueiam resposta)
- Erros silenciosos (não afetam UX)

4. **Compatibilidade Retroativa:**

- Cache em memória mantido
- Código existente continua funcionando
- Migração gradual possível

## Performance

**Otimizações:**

- Cache KV verificado primeiro (mais rápido que LLM)
- Operações assíncronas não bloqueantes
- Timeout curto (2s) para evitar espera
- Fallback instantâneo (memória local)

**Impacto Esperado:**

- Cache hit rate: 40-60% → 80-90%
- Latência média: 800-1200ms → 200-500ms
- Latência cold start: 2000-5000ms → 200-500ms
- Redução chamadas LLM: 40-60%

## Métricas e Monitoramento

**Logs Estruturados:**

- `cache_kv_hit`: Cache hit do KV
- `cache_kv_miss`: Cache miss do KV
- `cache_memory_hit`: Cache hit da memória (fallback)
- `cache_kv_error`: Erro ao acessar KV (para debugging)

**Métricas Importantes:**

- Taxa de cache hit (KV vs Memory)
- Latência de operações KV
- Taxa de erros KV
- Taxa de fallback para memória

## Rollback Plan

Se houver problemas:

1. Remover variáveis KV do Vercel Dashboard
2. Sistema automaticamente usa apenas memória
3. Código continua funcionando normalmente
4. Zero downtime

## Próximos Passos (Opcional)

Após implementação bem-sucedida:

1. Cache warming em cold starts