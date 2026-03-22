# P1 Mobile Ergonomia e Respostas

## 1. Resumo executivo

Esta rodada P1 fechou dois pontos remanescentes:

1. a ergonomia real de `Selecionar item` no mobile;
2. a qualidade das respostas para falhas de celular, microfone e voz.

O que ficou objetivamente melhor:

- a seleção contextual mobile agora entra em uma barra compacta fixa no topo, em vez de depender do painel principal no rodapé;
- o teste E2E passou a validar clique real no alvo da página, sem `dispatchEvent('click')`;
- perguntas como `nao funciona no celular`, `o microfone nao funciona` e `a voz nao fala` passaram a ter resposta determinística do próprio produto, sem depender do LLM.

O que foi preservado:

- FAQ forte e roteamento KB/LLM já corrigidos no P0;
- fluxo desktop;
- fallback `Texto + toque`.

## 2. Causa raiz por problema

### 2.1 Ergonomia mobile da seleção contextual

**Causa raiz**

- o modo de seleção ainda dependia da geometria do widget flutuante;
- mesmo com a lógica de captura funcionando, a UI continuava ancorada no rodapé e a prova final tinha ficado dependente de `dispatchEvent`;
- o hook de captura conhecia apenas o root interno do assistente, não toda a casca do widget.

### 2.2 Respostas de erro sobre voz/celular

**Causa raiz**

- os casos de suporte ainda dependiam do LLM para gerar resposta útil;
- o prompt já orientava melhor, mas isso ainda deixava espaço para resposta genérica;
- não existia uma camada determinística do próprio produto para microfone, áudio e uso mobile.

## 3. Correções aplicadas

### 3.1 Seleção contextual mobile

- o widget passou a usar uma barra compacta fixa no topo durante `mobileSelectionMode`;
- o painel principal do chat permanece montado, mas fica visualmente fora do caminho e escondido enquanto a seleção está ativa;
- a captura contextual passou a tratar qualquer clique vindo da casca do widget como superfície bloqueante e resolver o alvo real por coordenada;
- a UI da barra compacta ficou marcada como `selection UI`, para o hook ignorar toques em `Cancelar` e na própria barra.

### 3.2 Respostas determinísticas de suporte

- foi adicionada uma camada explícita de suporte em `biblioteca/assistente/supportResponses.ts`;
- a rota principal passou a responder diretamente, sem LLM, para:
  - celular geral;
  - microfone/captação;
  - voz/áudio sem saída;
- o prompt do LLM também foi refinado para manter coerência quando esse caminho não for o usado.

## 4. Before/after observado

### 4.1 Mobile selection

**Antes**

- o relatório do P0 ainda assumia uma limitação real: a prova automatizada final precisava de `dispatchEvent('click')`;
- o modo de seleção continuava visualmente acoplado ao widget flutuante.

**Depois**

- o E2E passou com clique real no elemento da página;
- a barra de seleção ficou no topo e com altura compacta;
- o `#assistente-live-widget` fica oculto enquanto a captura está ativa.

### 4.2 Suporte para celular, microfone e voz

**Antes**

- `nao funciona no celular` ainda soava como suporte genérico.

**Depois**

Respostas reais observadas na rota:

#### `nao funciona no celular`

```json
{
  "spokenText": "No celular, o caminho mais confiável aqui é Texto + toque. Se quiser voz, use Tocar para falar, confirme a permissão de microfone e teste em um navegador atualizado.",
  "actions": [],
  "requiresUserClick": false,
  "confidence": 0.94,
  "mode": "normal"
}
```

#### `o microfone nao funciona`

```json
{
  "spokenText": "Se o microfone não capta, libere a permissão no cadeado do navegador, recarregue a página e use Tocar para falar. Se continuar instável no celular, siga em Texto + toque.",
  "actions": [],
  "requiresUserClick": false,
  "confidence": 0.96,
  "mode": "normal"
}
```

#### `a voz nao fala`

```json
{
  "spokenText": "Se a voz não sair, toque na tela antes de pedir áudio e use Ouvir resposta. Alguns navegadores mobile bloqueiam autoplay; o chat em Texto + toque continua disponível.",
  "actions": [],
  "requiresUserClick": false,
  "confidence": 0.95,
  "mode": "normal"
}
```

## 5. Arquivos alterados nesta rodada

- `biblioteca/assistente/supportResponses.ts`
- `app/api/assistente/perguntar/route.ts`
- `biblioteca/assistente/llmAdapter.ts`
- `componentes/Assistente/Assistente.tsx`
- `componentes/Assistente/AssistenteWidget.tsx`
- `componentes/Assistente/hooks/useClickContext.ts`
- `app/api/assistente/perguntar/__tests__/route.test.ts`
- `tests/e2e/vitrine.spec.ts`

## 6. Testes adicionados ou ajustados

### Rota

`app/api/assistente/perguntar/__tests__/route.test.ts`

- suporte contextual para uso no iPhone sem depender do LLM;
- `nao funciona no celular`;
- `o microfone nao funciona`;
- `a voz nao fala`.

### E2E

`tests/e2e/vitrine.spec.ts`

- seleção mobile agora exige:
  - overlay real visível;
  - barra compacta no topo;
  - `#assistente-live-widget` oculto;
  - clique real no alvo da página;
  - contexto capturado sem evento sintético.

## 7. Resultado dos comandos

### `npm run lint`

- status: `ok`
- observação: warning não bloqueante de `baseline-browser-mapping`

### `npm run test:unit`

- status: `ok`
- resultado: `8 files`, `52 tests`

### `npm run build`

- status: `ok`

### `npm run test:e2e`

- status: `ok`
- resultado: `9/9`

## 8. O que ficou realmente melhor

- a ergonomia mobile não depende mais de um clique sintético para parecer correta;
- o fluxo de seleção contextual está mais honesto visualmente;
- as respostas de suporte agora falam como diagnóstico do próprio produto;
- os cenários críticos de celular/voz não dependem mais da variabilidade do LLM.

## 9. O que continua limitado por navegador

- reconhecimento de voz em mobile continua dependendo de suporte parcial da Web Speech API;
- áudio pode continuar sujeito a autoplay policy e gesto do usuário;
- iPhone e Android continuam variando por navegador/WebView.

Esses pontos agora estão refletidos melhor na resposta do assistente, mas não foram “eliminados” porque são limites reais da plataforma web.

## 10. Pendências futuras

### P2 útil

- refinar ainda mais as respostas para distinguir melhor iPhone vs Android quando isso ajudar;
- adicionar cobertura comportamental recorrente para suporte mobile/voz;
- revisar warning de `baseline-browser-mapping`.

## 11. Veredito

Esta rodada P1 gerou melhora real e verificável:

- mobile selection ficou mais utilizável na prática;
- respostas de erro de voz/celular deixaram de parecer FAQ vaga;
- a validação final passou com lint, unit, build e E2E.

O que ainda resta não é mais um gargalo claro de produto nesta área, e sim limites normais de navegador para voz na web.
