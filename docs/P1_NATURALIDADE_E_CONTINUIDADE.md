# P1 de Naturalidade, Continuidade e Memória Útil

## 1. Escopo desta rodada

Esta rodada atacou apenas o que ainda fazia o assistente soar como protótipo:

- respostas abertas curtas demais ou com tom de sistema;
- follow-up com continuidade semântica fraca;
- memória conversacional existente, mas pouco útil na prática;
- perguntas abertas/práticas ainda vulneráveis a aproximação indevida da KB.

Não houve mudança de provider, de modelo nem da UX mobile/seleção contextual já estabilizada no P1 anterior.

Observação de fonte de verdade: `docs/VALIDACAO_COMPORTAMENTAL_IA.md` não estava presente no working tree deste estado do repositório. Para esta rodada foram usados:

- `docs/P0_FOLLOWUP_KB_MOBILE_V2.md`
- `docs/P1_MOBILE_ERGONOMIA_E_RESPOSTAS.md`
- a bateria real da rota `/api/assistente/perguntar`
- os testes unitários e de rota ajustados nesta implementação

## 2. Causa raiz por problema

### 2.1 Respostas abertas ainda soavam mecânicas

Causa raiz:

- o cliente mandava histórico achatado, sem priorização clara do último tópico;
- o prompt do LLM ainda puxava a resposta para algo curto demais e burocrático;
- o contexto de clique tinha pouco significado semântico além do texto visível.

Impacto:

- respostas como `me explica melhor o produto` e `me explica isso` ainda saíam corretas, mas pouco ricas;
- o assistente parecia “responder certo” sem realmente conversar.

### 2.2 Continuidade ainda dependia mais do roteamento do que da semântica

Causa raiz:

- o servidor já aceitava follow-up em alguns casos, mas o bloco de contexto ainda era raso;
- o último turno forte não era reconstruído de forma suficientemente útil;
- follow-up de fluxo, especialmente cadastro, ainda podia repetir FAQ ou inventar continuação vaga.

Impacto:

- `e depois disso?` e `e depois do cadastro?` já saíam do `out_of_scope`, mas nem sempre avançavam a conversa com naturalidade;
- `e no celular?` vinha sem aproveitar bem o assunto anterior.

### 2.3 A memória existia, mas ajudava pouco

Causa raiz:

- o cliente enviava histórico com truncamento uniforme;
- não havia resumo explícito do último tópico forte, última resposta útil e sinal de mudança de assunto;
- perguntas novas podiam herdar contexto demais, enquanto follow-up útil ainda recebia contexto de menos.

Impacto:

- com e sem histórico, a qualidade semântica ficava mais parecida do que deveria;
- a conversa melhorava pouco quando o usuário fazia follow-up curto.

### 2.4 A KB ainda podia sequestrar perguntas práticas abertas

Causa raiz:

- a KB já tinha filtros contra perguntas meta e abertas, mas faltava uma camada específica para perguntas práticas/demonstrativas como `como isso funciona na prática?`;
- o gate de escopo ainda exigia `topicHint` até para perguntas abertas que o analisador conversacional já considerava seguras.

Impacto:

- perguntas práticas abertas podiam cair em `cadastro` ou morrer cedo demais no pipeline.

## 3. Correções aplicadas

### 3.1 Montagem de memória conversacional mais útil no cliente

Arquivo: `componentes/Assistente/hooks/useAssistantAPI.ts`

Foi criada a função `buildConversationPayload()` para enviar:

- as últimas 3 trocas completas;
- mais texto nos turnos recentes e menos nos antigos;
- `conversationSummary`;
- `lastQuestion`;
- `lastAnswer`;
- `lastTopicHint`;
- `questionLooksIndependent`.

Também foi removido o append automático de:

- `Quer saber mais sobre esse assunto?`

Isso eliminou uma artificialidade que mascarava a naturalidade real da resposta.

### 3.2 Nova camada compartilhada de sinais conversacionais

Arquivo novo: `biblioteca/assistente/conversationSignals.ts`

Foram centralizadas as heurísticas de:

- inferência de tópico forte;
- pergunta prática aberta;
- pergunta de continuação;
- mudança explícita de assunto;
- independência em relação ao último tópico.

Isso reduziu divergência entre cliente e servidor.

### 3.3 Continuidade semântica mais forte no servidor

Arquivo: `biblioteca/assistente/followUpContext.ts`

O analisador conversacional passou a:

- aceitar mais padrões reais de continuidade;
- usar `lastQuestion`, `lastAnswer`, `lastTopicHint` e `conversationSummary` vindos do cliente;
- construir `effectiveQuestion` mais específico;
- gerar `conversationContextBlock` mais rico;
- tratar continuidade de cadastro com instruções explícitas para não inventar backend ou acesso privado;
- tratar `e no celular?` como continuação do produto, recomendando `Texto + toque` antes de voz manual.

### 3.4 Ligação do contexto conversacional ao pipeline real

Arquivo: `app/api/assistente/perguntar/route.ts`

O `route` agora extrai do `context`:

- `conversationSummary`
- `lastQuestion`
- `lastAnswer`
- `lastTopicHint`
- `questionLooksIndependent`

e passa esses sinais para `analyzeConversationContext()`.

Isso fechou o gap entre o que o cliente sabe da conversa e o que o servidor realmente usa para decidir escopo, bypass da KB e prompt efetivo.

### 3.5 Anti-sequestro da KB para perguntas práticas abertas

Arquivo: `biblioteca/assistente/knowledgeBase.ts`

Foi adicionada uma regra explícita para devolver `null` na KB quando a pergunta for:

- prática/demonstrativa;
- dependente de `isso`, `na prática`, `depois`, `próximo passo`;
- sem âncora concreta de FAQ.

Ao mesmo tempo, casos fortes como:

- `como funciona o cadastro?`

continuam na KB.

### 3.6 Gate de escopo alinhado ao analisador conversacional

Arquivo: `biblioteca/assistente/scopeValidator.ts`

`isInScope()` deixou de exigir `topicHint` para liberar um caso já marcado pelo analisador conversacional como contextual e seguro.

Isso eliminou o falso negativo em perguntas práticas abertas que já deveriam seguir para o LLM.

### 3.7 Contexto de clique semanticamente mais rico

Arquivo: `biblioteca/assistente/scopeValidator.ts`

Foi adicionado um mapa curto de descrição por `targetId`, por exemplo:

- `features-section`
- `hero-content`
- `analise-hero`
- `seguranca-hero`
- `cadastro-card`
- `login-card`

O `clickContextBlock` agora leva não só texto/tag, mas também uma descrição prática do papel daquela área na página.

### 3.8 Estilo de prompt menos robótico

Arquivo: `biblioteca/assistente/llmAdapter.ts`

O prompt base foi ajustado para:

- evitar tom de sistema;
- separar estilos para FAQ direta, pergunta aberta/contextual e follow-up;
- continuar conversa sem reapresentar o produto do zero;
- explicar melhor o valor prático do item clicado;
- não inventar backend/conta criada em follow-up de cadastro/login;
- priorizar `Texto + toque` em continuidade sobre celular.

## 4. Arquivos alterados

- `app/api/assistente/perguntar/__tests__/route.test.ts`
- `app/api/assistente/perguntar/route.ts`
- `biblioteca/assistente/conversationSignals.ts`
- `biblioteca/assistente/followUpContext.ts`
- `biblioteca/assistente/knowledgeBase.ts`
- `biblioteca/assistente/llmAdapter.ts`
- `biblioteca/assistente/scopeValidator.ts`
- `componentes/Assistente/hooks/__tests__/useAssistantAPI.test.ts`
- `componentes/Assistente/hooks/useAssistantAPI.ts`
- `docs/P1_NATURALIDADE_E_CONTINUIDADE.md`

## 5. Testes adicionados ou ajustados

### `componentes/Assistente/hooks/__tests__/useAssistantAPI.test.ts`

Cobertura nova:

- priorização das últimas 3 trocas completas;
- extração de `lastQuestion`, `lastAnswer` e `lastTopicHint`;
- sinalização de mudança explícita de assunto.

### `app/api/assistente/perguntar/__tests__/route.test.ts`

Cobertura nova ou fortalecida:

- `como isso funciona na prática?` bypassa KB e usa LLM;
- `me explica melhor o produto` não volta `out_of_scope`;
- `e depois disso?` sem histórico continua fora de escopo;
- `e depois disso?` com histórico de cadastro continua a conversa;
- `e depois do cadastro?` com histórico não repete a FAQ;
- `e como isso funciona?` com 3 turnos usa contexto real;
- `e no celular?` herda o tópico anterior e carrega instrução de continuidade;
- `me explica isso` com clique usa contexto de clique mais rico.

## 6. Resultado dos comandos

### `npm run lint`

Status:

- `ok`

Saída relevante:

- `✔ No ESLint warnings or errors`

Warning não bloqueante:

- `baseline-browser-mapping` desatualizado

### `npm run test:unit`

Status:

- `ok`

Resultado:

- `8 files`
- `58 tests passed`

### `npm run build`

Status:

- `ok`

Resultado:

- build de produção concluído;
- `app/api/assistente/perguntar` buildando normalmente;
- sem quebra de tipos.

### `npm run test:e2e`

Status:

- `ok`

Resultado:

- `9 passed`

## 7. Mini bateria comportamental real

Bateria executada contra `http://127.0.0.1:3012/api/assistente/perguntar`.

### 7.1 `me explica melhor o produto`

Antes:

- a resposta ainda saía correta, mas curta e com cara de apresentação técnica.

Depois:

- `200`
- resposta observada:
  - `O Davi é uma plataforma que oferece navegação guiada e explicação de interface. Aqui, você pode aprender sobre análise em tempo real, segurança e aprendizado contínuo. Para começar, você pode explorar as seções de análise ou segurança.`

Leitura:

- melhorou de forma real;
- agora há `o que é`, `o que o usuário consegue fazer` e `próximo passo`;
- ainda usa a palavra `plataforma`, mas já não cai numa resposta seca de sistema.

### 7.2 `como isso funciona na prática?`

Antes:

- podia cair em `cadastro` por aproximação da KB.

Depois:

- `200`
- resposta observada:
  - `Aqui, você pode explorar recursos como análise em tempo real e aprendizado contínuo. O assistente ajuda a navegar e entender cada seção. Próximo, você pode clicar em 'Análise em Tempo Real' para saber mais.`

Leitura:

- o anti-KB ficou efetivo;
- a resposta agora é prática e guiada;
- esse caso deixou de parecer FAQ mecânica.

### 7.3 `e depois disso?` sem histórico

Antes:

- fora de escopo.

Depois:

- `400`
- resposta observada:
  - `Fora de escopo. Pergunte sobre cadastro, análise, proteção, aprendizado ou resultados.`

Leitura:

- isso continua deliberadamente conservador;
- não é regressão;
- é limitação estrutural assumida: follow-up elíptico sem base continua sendo rejeitado.

### 7.4 `e depois disso?` com histórico de cadastro

Antes:

- já saía do `out_of_scope`, mas a continuidade ainda podia soar mecânica.

Depois:

- `200`
- resposta observada:
  - `Depois de confirmar seu email, você pode prosseguir para o login.`

Leitura:

- melhorou em continuidade;
- a resposta agora avança o fluxo em vez de repetir a FAQ;
- ainda soa um pouco curta e herda a formulação `confirmar seu email` do histórico anterior.

### 7.5 `e depois do cadastro?`

Antes:

- repetia a FAQ ou podia exagerar o que acontecia depois.

Depois:

- `200`
- resposta observada:
  - `Depois do cadastro, você pode prosseguir para o login e acessar as funcionalidades da plataforma Davi.`

Leitura:

- a conversa continua;
- a repetição mecânica da FAQ foi reduzida;
- ainda existe exagero leve em `acessar as funcionalidades`, então este ponto melhorou, mas não está perfeito.

### 7.6 `e no celular?` com histórico de produto

Antes:

- resposta genérica sobre uso no celular.

Depois:

- `200`
- resposta observada:
  - `No celular, o caminho mais estável é usar Texto + toque. Você pode navegar pelas seções de análise, segurança e aprendizado facilmente.`

Leitura:

- melhora objetiva e útil;
- agora a resposta conversa com o produto real e com o fluxo mobile atual;
- esse foi um dos ganhos mais claros desta rodada.

### 7.7 `me explica isso` com contexto de clique

Antes:

- contextualizava, mas ainda soava vago.

Depois:

- `200`
- resposta observada:
  - `A seção de recursos do Davi explica como o assistente pode ajudar por voz ou clique. Você gostaria de saber mais sobre como funciona?`

Leitura:

- ficou mais conectada ao papel da seção clicada;
- ainda tende a fechar com uma pergunta genérica de volta;
- melhorou, mas segue como área com mais espaço para refinamento semântico.

## 8. O que ficou realmente melhor

- perguntas práticas abertas deixaram de cair na KB por aproximação fraca;
- o histórico recente passou a influenciar a resposta de forma mais útil;
- perguntas abertas sobre o produto agora saem com estrutura mais natural e com próximo passo;
- follow-up com histórico avança a conversa em vez de apenas rotear;
- `e no celular?` passou a responder de forma aderente ao produto real;
- o contexto de clique ficou semanticamente mais rico.

## 9. O que ainda soa robótico

- follow-up de cadastro ainda pode herdar linguagem um pouco rígida do turno anterior;
- algumas respostas ainda usam termos genéricos como `plataforma` quando poderiam ser mais concretas;
- a explicação contextual por clique ainda pode terminar com pergunta de retorno genérica;
- sem histórico suficiente, o sistema ainda cai cedo em `out_of_scope`.

## 10. Limitações estruturais que continuam

- o LLM ainda é a principal camada de naturalidade, então existe variabilidade real de wording;
- a proteção de escopo continua conservadora por escolha de produto;
- follow-up sem histórico útil continua limitado;
- a continuidade de cadastro ainda não é totalmente determinística;
- não houve redesign do núcleo do assistente nesta rodada.

## 11. Veredito desta rodada

Esta rodada melhorou de forma real a naturalidade, a continuidade útil e o uso prático da memória conversacional.

O que ficou objetivamente melhor:

- perguntas abertas;
- perguntas práticas;
- continuidade curta com histórico;
- resposta contextual sobre uso no celular.

O que ainda impede o assistente de parecer totalmente maduro:

- follow-up de fluxo ainda pode soar mais rígido do que o ideal;
- algumas respostas contextuais ainda ficam um pouco genéricas;
- o modo conservador sem histórico continua produzindo `out_of_scope`.

Em resumo:

- o assistente ficou menos “FAQ com LLM em volta”;
- passou a parecer mais um assistente de produto;
- mas ainda não atingiu o nível de conversação refinada de um produto final de primeira linha.
