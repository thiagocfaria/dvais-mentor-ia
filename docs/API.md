# API

## POST /api/assistente/perguntar
Endpoint principal do assistente. Valida entrada, consulta KB e aciona LLM apenas quando necessario.

### Headers
- `content-type: application/json`
- `x-user-id` (opcional): identificador da sessao do usuario.

### Body
```json
{
  "question": "texto da pergunta",
  "history": [{ "role": "user", "content": "..." }],
  "context": {
    "currentPage": "/",
    "visibleSections": ["hero-content"],
    "intent": "pergunta_sobre",
    "intentConfidence": 0.82,
    "clickedTargetId": "button-login",
    "clickedText": "Fazer login",
    "clickedTag": "a"
  }
}
```

### Response (sucesso)
```json
{
  "spokenText": "resposta curta aqui",
  "actions": [{
    "type": "navigateRoute",
    "route": "/login",
    "targetId": "login-card"
  }],
  "mode": "normal"
}
```

### Erros comuns
- `400`: pergunta fora de escopo.
- `429`: limite de uso excedido.
- `503`: assistente indisponivel (sem API key).

## GET /api/health
Retorna informacoes basicas de saude do backend e alguns indicadores internos.

### Campos relevantes
- `status`: saude geral do backend.
- `kbVersion`: versao real da base de conhecimento em uso no deploy.
- `build.gitSha` / `build.buildId`: identificadores do build atual para confirmar o rollout publicado.
- `llm.configured`, `llm.status`, `llm.provider`, `llm.model`: estado do provider LLM.
