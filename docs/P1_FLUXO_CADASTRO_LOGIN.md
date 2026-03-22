# P1 de Fluxo Conversacional para Cadastro e Login

## 1. Resumo executivo

Esta rodada atacou apenas a continuidade conversacional de `cadastro` e `login`.

O problema real não era mais de mobile, KB geral ou follow-up aberto. O gargalo remanescente estava concentrado em dois pontos:

- `login` ainda era absorvido semanticamente por `cadastro` em parte da heurística de tópico;
- a continuação de fluxo de auth ainda dependia demais do wording do LLM ou caía em respostas mecânicas da KB.

O resultado desta rodada foi:

- `cadastro` continua forte como FAQ direta;
- `login` passou a ser tópico separado;
- follow-ups de `cadastro` e `login` ficaram determinísticos quando há âncora suficiente;
- perguntas como `e se eu esquecer a senha?` e `o que eu faço se não entrar?` deixaram de depender do LLM e pararam de colidir com proteções genéricas;
- a resposta agora guia a jornada sem prometer backend real, reset de senha real ou autenticação de verdade.

## 2. Causa raiz por problema

### 2.1 `login` absorvido por `cadastro`

Antes desta rodada, a inferência de tópico não separava bem `login` de `cadastro`. Isso fazia perguntas como `como funciona o login?` ou follow-ups de `login` herdarem contexto de `cadastro` ou caírem em respostas mais genéricas do que deveriam.

### 2.2 Follow-up de auth dependente demais de KB/LLM

Casos como:

- `e depois disso?`
- `e depois do cadastro?`
- `e se eu errar meus dados?`
- `e se eu esquecer a senha?`
- `o que eu faço se não entrar?`

ou repetiam a mesma FAQ inicial, ou dependiam do LLM para formular algo útil, ou ainda esbarravam em regras defensivas genéricas.

### 2.3 Fluxo de login com “senha” colidindo com defesas globais

Perguntas sobre senha e acesso precisavam continuar conservadoras, mas sem morrer por proteção ampla demais. A correção precisava ser localizada no fluxo de auth, não um afrouxamento global da KB.

## 3. Correção aplicada

### 3.1 Separação explícita de `cadastro` e `login`

Foi adicionada a distinção de `login` como tópico próprio na heurística conversacional, além de um `flowHint` específico para auth.

Arquivos principais:

- [conversationSignals.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/conversationSignals.ts)
- [followUpContext.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/followUpContext.ts)

### 3.2 Camada determinística curta para continuação de auth

Foi criada uma camada pequena e isolada para responder apenas continuidade de `cadastro` e `login`, antes da KB e do LLM.

Arquivo novo:

- [authFlowGuidance.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/authFlowGuidance.ts)

Ela cobre de forma explícita:

- próximo passo após cadastro;
- correção de dados no cadastro;
- continuação após confirmação de email;
- próximo passo do login;
- esqueci a senha;
- login não entra;
- login no celular.

### 3.3 KB ajustada só onde melhora o fluxo

As entradas `cadastro` e `login` foram melhoradas para soar mais como guia de jornada e menos como definição estática.

Arquivo:

- [knowledgeBase.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/knowledgeBase.ts)

### 3.4 Roteamento atualizado

O pipeline da rota passou a priorizar a camada determinística de auth antes da KB e do LLM quando há âncora suficiente.

Arquivo:

- [route.ts](/home/u/Documentos/DVAi$- Mentor IA/app/api/assistente/perguntar/route.ts)

## 4. Arquivos alterados

- [conversationSignals.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/conversationSignals.ts)
- [followUpContext.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/followUpContext.ts)
- [authFlowGuidance.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/authFlowGuidance.ts)
- [route.ts](/home/u/Documentos/DVAi$- Mentor IA/app/api/assistente/perguntar/route.ts)
- [knowledgeBase.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/knowledgeBase.ts)
- [llmAdapter.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/llmAdapter.ts)
- [route.test.ts](/home/u/Documentos/DVAi$- Mentor IA/app/api/assistente/perguntar/__tests__/route.test.ts)
- [conversationSignals.test.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/__tests__/conversationSignals.test.ts)

## 5. Testes adicionados e ajustados

### 5.1 Testes novos

- [conversationSignals.test.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/__tests__/conversationSignals.test.ts)

Cobre:

- `login` separado de `cadastro`;
- continuação curta mantendo o último tópico forte;
- troca explícita de assunto marcando nova pergunta independente.

### 5.2 Testes ampliados na rota

- [route.test.ts](/home/u/Documentos/DVAi$- Mentor IA/app/api/assistente/perguntar/__tests__/route.test.ts)

Cobre explicitamente:

- `como funciona o cadastro?` preservado;
- `como funciona o login?` preservado e melhor guiado;
- `e depois disso?` com histórico de cadastro;
- `e depois do cadastro?` com histórico;
- `e se eu errar meus dados?` após cadastro;
- `e depois que eu confirmar o email?` após cadastro;
- `e depois disso?` com histórico de login;
- `e se eu esquecer a senha?` com e sem histórico;
- `o que eu faço se não entrar?` com e sem histórico;
- não repetição mecânica da FAQ inicial;
- não prometer reset/recuperação inexistente.

## 6. Validação de comandos

### `npm run lint`

Resultado: `ok`

Observação:

- warning não bloqueante de `baseline-browser-mapping` desatualizado.

### `npm run test:unit`

Resultado: `ok`

Resumo:

- `9` arquivos de teste
- `68/68` testes passando

### `npm run build`

Resultado: `ok`

Resumo:

- build de produção concluído com sucesso;
- rotas e páginas geradas normalmente;
- sem regressão de tipos ou lint durante build.

### `npm run test:e2e`

Resultado: `ok`

Resumo:

- `9/9` testes passando.

## 7. Comparação antes/depois

### 7.1 `como funciona o cadastro?`

Antes:

- já estava bom.

Depois:

- continua na KB;
- resposta segue curta, objetiva e agora já aponta o próximo passo.

Resposta observada:

> Para se cadastrar, abra "Começar Agora", preencha o formulário e confirme seu email. Depois disso, se quiser, eu te guio para o login.

### 7.2 `e depois disso?` após cadastro

Antes:

- podia depender do LLM ou repetir a FAQ base.

Depois:

- resposta determinística;
- avança a jornada;
- leva o usuário ao login.

Resposta observada:

> Depois do cadastro, o próximo passo é revisar o formulário, confirmar o email e seguir para o Login. A partir daí, você continua a jornada demonstrativa sem recomeçar a explicação.

### 7.3 `e depois do cadastro?`

Antes:

- repetia a mesma explicação inicial.

Depois:

- responde com continuação curta e guiada;
- não reapresenta a definição do cadastro.

Resposta observada:

> Depois do cadastro, o próximo passo é abrir o Login e continuar a jornada demonstrativa. Se quiser, eu te guio até a tela de login agora.

### 7.4 `e se eu errar meus dados?`

Antes:

- sem tratamento específico útil.

Depois:

- resposta determinística de fluxo;
- orienta revisão do formulário e menciona validações locais reais.

Resposta observada:

> Se algum dado sair errado, corrija o campo no formulário e envie de novo. A própria tela valida email, CPF, telefone e senha antes de você seguir.

### 7.5 `e depois que eu confirmar o email?`

Antes:

- sem continuação guiada clara.

Depois:

- encaminha corretamente para login;
- sem prometer conta autenticada.

Resposta observada:

> Depois de confirmar o email nesta demo, o próximo passo é abrir o Login e continuar a jornada. Se quiser, eu te guio até a tela de login agora.

### 7.6 `como funciona o login?`

Antes:

- podia cair semanticamente em `cadastro` ou ficar genérico demais.

Depois:

- mapeia corretamente para a FAQ de `login`;
- texto mais guiado e menos seco.

Resposta observada:

> Para fazer login, abra "Login" no topo, preencha email e senha e confira as validações da tela antes de enviar.

### 7.7 `e depois disso?` após login

Antes:

- sem continuidade confiável;
- dependente de formulação do LLM.

Depois:

- resposta determinística;
- mantém o usuário no fluxo correto do login.

Resposta observada:

> Depois de abrir o Login, preencha email e senha e confira as validações locais antes de enviar. Se algo travar nesta demo, revise os campos ou siga para contato.

### 7.8 `e se eu esquecer a senha?`

Antes:

- podia colidir com proteções genéricas;
- não deixava claro o limite real do produto.

Depois:

- resposta determinística;
- não promete reset real;
- aponta o caminho real disponível hoje.

Resposta observada:

> Nesta versão pública não existe recuperação automática de senha conectada. Se você esqueceu a senha, o caminho real disponível hoje é falar com o responsável do projeto na página de contato.

### 7.9 `o que eu faço se não entrar?`

Antes:

- orientação fraca ou excessivamente dependente do LLM.

Depois:

- resposta curta, prática e segura;
- combina revisão de campos com limitação real da demo.

Resposta observada:

> Se o login não entrar, revise email e senha e veja as mensagens de validação da tela. Como esta demo não autentica em backend, o caminho real para suporte é a página de contato.

### 7.10 `e no celular?` após login

Antes:

- podia cair num suporte mais genérico.

Depois:

- mantém o contexto de login;
- orienta para fluxo manual real do produto.

Resposta observada:

> No celular, faça o login pelo formulário normal, em texto e toque. Vale revisar email e senha com calma na tela; se a voz estiver instável, mantenha o fluxo manual.

## 8. O que ficou mais natural

- continuação de `cadastro` e `login` agora avança o fluxo em vez de reapresentar a FAQ;
- a orientação usa linguagem de guia de jornada, não só definição;
- os próximos passos ficaram mais claros;
- o sistema responde melhor a dúvidas práticas sobre erro de dados, senha e acesso.

## 9. O que passou a ser determinístico

- follow-up de `cadastro`;
- follow-up de `login`;
- `esqueci a senha`;
- `não entra`;
- `login no celular` quando a conversa já está nesse tópico.

Isso reduz a variabilidade e a dependência do wording do LLM nesses cenários.

## 10. O que ainda depende do LLM

- variações menos diretas de fluxo fora das frases cobertas pela camada curta;
- follow-ups ambíguos de auth sem âncora suficiente;
- perguntas abertas sobre o produto que tangenciam cadastro/login mas não são claramente continuação de jornada.

## 11. Limitações que continuam existindo

- o produto continua sendo uma demo pública de interface;
- cadastro não cria conta real;
- login não autentica em backend;
- não existe recuperação automática de senha conectada;
- follow-up totalmente elíptico e sem histórico suficiente continua podendo ser recusado por desenho conservador.

## 12. Veredito final

Esta rodada fechou bem o ponto remanescente de auth conversacional.

O assistente agora:

- diferencia melhor `cadastro` e `login`;
- continua a conversa com mais utilidade;
- evita repetir mecanicamente a FAQ inicial;
- responde com mais segurança prática nos limites reais da demo.

O que ainda sobra não é mais um problema de rigidez do fluxo de auth em si, e sim limitações estruturais naturais de uma demo pública sem backend real de autenticação.
