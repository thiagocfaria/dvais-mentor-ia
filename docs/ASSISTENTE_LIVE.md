# Assistente Live

## Objetivo

Apresentar o produto como um assistente contextual com três caminhos compatíveis entre si:

- texto;
- voz manual (`push-to-talk`);
- conversa contínua apenas em desktop/navegadores mais estáveis.

O assistente usa contexto de clique, responde em texto, tenta falar a resposta quando a voz estiver ativa e mantém fallback claro quando o navegador bloquear áudio ou não suportar voz.

## Fluxo atual

1. **Ativação**
   - o usuário escolhe `Texto + toque`, `Voz manual` ou `Conversa contínua`;
   - no mobile, o caminho recomendado continua sendo `Texto + toque`.

2. **Captura de voz**
   - `Voz manual`: o usuário toca em `Microfone` ou `Tocar para falar`;
   - ao receber transcript final útil, a pergunta é enviada automaticamente;
   - `Conversa contínua`: a escuta reinicia apenas quando a captura terminou sem envio ou depois da resposta, sem restart duplo.

3. **Resposta**
   - a resposta sempre aparece no chat;
   - se voz estiver ativa e TTS estiver disponível, o assistente tenta falar a resposta;
   - se o navegador bloquear o áudio, a UI explica o motivo e mantém `Ouvir resposta`.

4. **Fallback**
   - se STT falhar, o usuário continua pelo texto;
   - se TTS falhar, a resposta continua no chat com diagnóstico explícito.

## Estados de voz

- `Ouvindo`
- `Pensando`
- `Falando`
- `Áudio bloqueado`
- `Sem suporte`
- `Microfone bloqueado`

## Regras de UX

- o chat em texto continua disponível mesmo quando a voz falha;
- `Ouvir resposta` tenta novamente a fala com gesto explícito do usuário;
- `intro`, `guia rápido` e `navegação` não devem cortar a resposta principal do assistente;
- o mobile continua com `push-to-talk` manual, nunca como conversa contínua padrão.

## Limitações reais da plataforma

- STT depende da Web Speech API e varia por navegador;
- TTS pode ser bloqueado por política de gesto/autoplay;
- iPhone, Android e WebViews podem se comportar de forma diferente mesmo com o mesmo código.

## Debug

- o transcript local continua exportável em debug;
- o relatório consolidado desta rodada está em `docs/P0_VOZ_PIPELINE_FINAL.md`.
