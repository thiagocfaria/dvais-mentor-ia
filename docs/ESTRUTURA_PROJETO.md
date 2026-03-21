# Estrutura do Projeto

```
app/                    # Rotas e paginas (Next.js App Router)
biblioteca/             # Modulos core (assistente, cache, rate limit)
componentes/            # Componentes visuais e UI
data/                   # Mapeamento de elementos da pagina
public/                 # Assets estaticos e workers
tests/                  # Testes E2E (Playwright)
tipos/                  # Tipos TypeScript compartilhados

docs/                   # Documentacao e screenshots da vitrine
scripts/                # Scripts operacionais
storage/                # Logs e dados locais (nao expostos na vitrine)
```

## Pastas chave
- `componentes/Assistente`: UI e hooks do assistente live.
- `biblioteca/assistente`: KB, TTS/STT, intents, validadores e helpers.
- `app/api/assistente`: endpoint principal do assistente.
- `docs/screenshots`: imagens usadas no README e na vitrine do repositório.
- `docs/assets`: imagens de apoio e demonstração.
