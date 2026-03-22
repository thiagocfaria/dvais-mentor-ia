# P0 Voz Pipeline Final

## 1. Resumo executivo

Esta rodada focou apenas no pipeline de voz do assistente.

O problema principal não estava na IA textual nem no provider de resposta. O texto continuava chegando ao chat. O gargalo real estava na camada local de voz:

- a pergunta por voz manual era transcrita, mas não era enviada automaticamente;
- o TTS tinha concorrência frágil e podia devolver falha mesmo quando havia fala pendente ou quando outra fala de baixa prioridade entrava no meio;
- havia pouca diferença entre falha de autoplay, ausência de TTS, microfone negado e erro genérico;
- o usuário recebia a resposta em texto, mas sem saber por que o áudio não saiu.

Após a correção:

- `push-to-talk` virou fluxo útil de verdade;
- a resposta principal ganhou prioridade explícita sobre intro, guia e navegação;
- `Ouvir resposta` ficou confiável como replay manual;
- autoplay bloqueado, falta de suporte e bloqueio de microfone passaram a ter mensagens específicas;
- desktop e mobile ficaram mais previsíveis sem abandonar o fallback textual.

## 2. Causa raiz do problema atual de voz

### 2.1 STT manual quebrado como experiência

No estado anterior, o reconhecimento manual preenchia o `textarea`, mas não disparava o envio da pergunta. Isso obrigava o usuário a:

1. falar;
2. esperar a transcrição;
3. clicar em `Enviar`.

Na prática, isso fazia a voz parecer “não funcional”.

### 2.2 TTS com fila falsa e cancelamento agressivo

O TTS anterior tinha duas fragilidades:

- devolvia falha quando já havia fala em andamento, mesmo deixando mensagem “na fila”;
- toda nova fala fazia `speechSynthesis.cancel()`, cortando a anterior sem política clara de prioridade.

Isso afetava:

- resposta principal do assistente;
- replay manual;
- fala de introdução;
- fala de navegação;
- guia rápido.

### 2.3 Diagnóstico insuficiente

Antes, o usuário via um diagnóstico muito genérico. O produto não separava claramente:

- autoplay bloqueado;
- TTS indisponível;
- microfone negado;
- navegador sem STT;
- timeout de silêncio;
- erro de síntese.

## 3. Onde o pipeline quebrava

### Captura de voz do usuário

Quebrava na transição:

- `capturou transcript final` -> `enviar pergunta`

porque o fluxo manual não autoenviava.

### Fala da resposta

Quebrava na transição:

- `resposta textual chegou` -> `speakText()`

porque o TTS podia:

- falhar cedo por concorrência;
- ser interrompido por fala de menor prioridade;
- reportar erro genérico sem explicar a causa real.

### Replay

Quebrava na confiabilidade:

- o botão existia, mas o pipeline interno não tinha política clara de prioridade e reexecução da fala.

## 4. Correções aplicadas

### 4.1 Reescrita do controlador de TTS

Arquivo:

- [textToSpeech.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/textToSpeech.ts)

Correções:

- remoção da fila falsa;
- introdução de `kind` e prioridade explícita:
  - `assistant-answer`
  - `replay`
  - `navigation`
  - `guide`
  - `intro`
- `assistant-answer` e `replay` podem interromper; `guide` e `navigation` não cortam a resposta principal;
- novo `TTSResult` estruturado com:
  - `autoplay_blocked`
  - `tts_unavailable`
  - `external_tts_failed`
  - `speech_synthesis_error`
  - `interrupted`
  - `empty_text`
- correção de race real: sem endpoint externo configurado, a fala principal agora marca playback sem `await` intermediário, fechando a janela de concorrência descoberta no TDD.

### 4.2 STT manual com autoenvio

Arquivo:

- [useLiveVoice.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/hooks/useLiveVoice.ts)

Correções:

- `push-to-talk` agora autoenvia transcript final útil;
- helpers explícitos para:
  - decidir autoenvio manual;
  - decidir restart seguro da escuta contínua;
- a captura contínua só reinicia quando o encerramento não veio de pergunta já enviada;
- isso eliminou o restart duplo entre captura e resposta.

### 4.3 STT com erro estruturado

Arquivo:

- [speechRecognition.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/speechRecognition.ts)

Correções:

- `onError` passou a trabalhar com código estruturado;
- cobertura explícita para:
  - `speech_not_supported`
  - `mic_permission_denied`
  - `no_speech`
  - `audio_capture_failed`
  - `stt_timeout`
  - `stt_error`
- `onEnd` agora diferencia `manual_stop`.

### 4.4 Diagnóstico claro na UI

Arquivos:

- [useAssistantAPI.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/hooks/useAssistantAPI.ts)
- [AssistantHeader.tsx](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/AssistantHeader.tsx)
- [InputArea.tsx](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/InputArea.tsx)
- [Assistente.tsx](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/Assistente.tsx)

Correções:

- novo estado leve de issue de voz;
- mapeamento explícito de falha de TTS para mensagem acionável;
- `Ouvir resposta` ficou conectado ao novo pipeline de replay;
- quando a voz falha, a resposta textual permanece visível;
- o header e a área de input agora mostram estados como:
  - `Áudio bloqueado`
  - `Sem suporte`
  - `Microfone bloqueado`

### 4.5 Concorrência de fala fora da resposta principal

Arquivos:

- [Assistente.tsx](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/Assistente.tsx)
- [useNavigationActions.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/hooks/useNavigationActions.ts)

Correções:

- `intro`, `guia rápido` e `navegação` passaram a chamar TTS com prioridade baixa;
- isso evita cortar a resposta principal do assistente.

## 5. Arquivos alterados

- [biblioteca/assistente/textToSpeech.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/textToSpeech.ts)
- [biblioteca/assistente/speechRecognition.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/speechRecognition.ts)
- [componentes/Assistente/hooks/useLiveVoice.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/hooks/useLiveVoice.ts)
- [componentes/Assistente/hooks/useAssistantAPI.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/hooks/useAssistantAPI.ts)
- [componentes/Assistente/hooks/useNavigationActions.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/hooks/useNavigationActions.ts)
- [componentes/Assistente/Assistente.tsx](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/Assistente.tsx)
- [componentes/Assistente/AssistantHeader.tsx](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/AssistantHeader.tsx)
- [componentes/Assistente/InputArea.tsx](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/InputArea.tsx)
- [componentes/Assistente/types.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/types.ts)
- [biblioteca/assistente/__tests__/textToSpeech.test.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/__tests__/textToSpeech.test.ts)
- [biblioteca/assistente/__tests__/speechRecognition.test.ts](/home/u/Documentos/DVAi$- Mentor IA/biblioteca/assistente/__tests__/speechRecognition.test.ts)
- [componentes/Assistente/hooks/__tests__/useAssistantAPI.test.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/hooks/__tests__/useAssistantAPI.test.ts)
- [componentes/Assistente/hooks/__tests__/useLiveVoice.test.ts](/home/u/Documentos/DVAi$- Mentor IA/componentes/Assistente/hooks/__tests__/useLiveVoice.test.ts)
- [tests/e2e/voice.spec.ts](/home/u/Documentos/DVAi$- Mentor IA/tests/e2e/voice.spec.ts)
- [docs/ASSISTENTE_LIVE.md](/home/u/Documentos/DVAi$- Mentor IA/docs/ASSISTENTE_LIVE.md)
- [docs/P0_VOZ_PIPELINE_FINAL.md](/home/u/Documentos/DVAi$- Mentor IA/docs/P0_VOZ_PIPELINE_FINAL.md)

## 6. O que melhorou no desktop

- voz manual agora envia a pergunta sem clique extra em `Enviar`;
- a resposta principal fala com prioridade adequada;
- replay manual funciona no mesmo pipeline, sem gambiarra paralela;
- autoplay bloqueado gera banner claro e orienta uso de `Ouvir resposta`;
- a UI diferencia melhor “falando” de “erro”.

## 7. O que melhorou no mobile

- o caminho previsível continua sendo `Texto + toque`, mas `Tocar para falar` agora é operacional;
- o mobile não depende de conversa contínua;
- quando o áudio falha, o produto explica o que tentar sem perder a resposta textual;
- a validação E2E cobre mobile com `push-to-talk` e fallback textual.

## 8. Limitações que continuam sendo do navegador

- STT continua dependente da Web Speech API e varia por navegador;
- autoplay/gesto do usuário continua podendo bloquear áudio;
- `speechSynthesis` pode existir e ainda assim se comportar de forma diferente em WebView, iPhone e Android;
- isso não foi “eliminado”, mas agora está tratado e comunicado de forma explícita.

## 9. Before/after comportamental

### Antes

- a voz manual exigia falar e depois clicar em `Enviar`;
- a resposta podia chegar em texto, mas o áudio falhava sem motivo claro;
- replay não era um caminho confiável;
- fala de guia/navegação podia competir com a fala principal;
- a cobertura de testes praticamente não provava o pipeline de voz ponta a ponta.

### Depois

- `push-to-talk` virou voz utilizável;
- resposta em texto + voz funciona em desktop e mobile sob stub controlado;
- autoplay bloqueado mantém a resposta no chat e orienta `Ouvir resposta`;
- replay manual é testado e funciona;
- o pipeline ganhou cobertura unitária e E2E real de voz.

## 10. Resultado dos comandos

### `npm run lint`

- status: `ok`
- saída relevante: `No ESLint warnings or errors`

### `npm run test:unit`

- status: `ok`
- resultado: `11` arquivos de teste, `79/79` testes passando

### `npm run build`

- status: `ok`
- build de produção concluído sem erro de tipo

### `npm run test:e2e`

- status: `ok`
- resultado: `13/13` testes passando

Observação geral:

- permanece o warning não bloqueante de `baseline-browser-mapping` desatualizado.

## 11. Checklist manual para validar voz

### Desktop

1. Abrir `/`.
2. Clicar em `Falar com Davi`.
3. Clicar em `Ativar assistente`.
4. Escolher `Voz manual (push-to-talk)`.
5. Falar uma pergunta curta.
6. Confirmar que:
   - a transcrição aparece;
   - a pergunta é enviada automaticamente;
   - a resposta aparece no chat;
   - a UI entra em `Falando` quando o navegador permitir.
7. Forçar bloqueio/autoplay se possível e confirmar:
   - resposta textual continua no chat;
   - aparece mensagem explicando o bloqueio;
   - `Ouvir resposta` fica disponível.
8. Clicar em `Ouvir resposta` e confirmar replay manual.

### Mobile

1. Abrir a home em viewport de celular.
2. Abrir o widget.
3. Ativar `Voz manual`.
4. Usar `Tocar para falar`.
5. Confirmar que:
   - a fala é capturada;
   - a pergunta é enviada sem clique extra;
   - a resposta textual aparece;
   - se o áudio falhar, a UI explica por quê;
   - o chat continua funcional em texto.

## 12. Veredito

O assistente voltou a ter um pipeline de voz tecnicamente coerente e testado.

O que ainda pode falhar agora tende a ser limitação real do navegador, não mais um pipeline local improvisado. O produto ainda não é equivalente a um app nativo de voz, mas já está muito mais próximo de um chat por voz sério na web:

- captura previsível;
- resposta com prioridade correta;
- replay funcional;
- fallback claro;
- diagnóstico explícito.
