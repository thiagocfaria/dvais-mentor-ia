# Assistente Live

## Objetivo

Apresentar o produto como um assistente contextual voz-first, com um único controle principal e um fallback claro:

- `Falar com Davi` para iniciar a sessão;
- `Desativar Davi` para encerrar a sessão;
- modo degradado em texto apenas quando o navegador bloquear a experiência por voz.

O assistente responde sobre a plataforma, fala a resposta quando o navegador permite e tenta manter a sessão viva na própria página sem exigir um clique por turno.

## Fluxo atual

1. **Ativação**
   - o usuário clica em `Falar com Davi`;
   - o widget abre já em sessão de voz, sem etapa extra de ativação;
   - o launcher vira `Desativar Davi`.

2. **Escuta**
   - o Davi pede/usa o microfone e começa a ouvir automaticamente;
   - quando uma fala final útil é detectada, a pergunta é enviada sem botão intermediário;
   - ao terminar a resposta, a sessão tenta voltar a ouvir sozinha.

3. **Resposta**
   - a resposta sempre aparece no histórico;
   - se TTS estiver disponível, o Davi fala a resposta;
   - ao ocultar a interface, a sessão continua ativa na mesma página.

4. **Fallback**
   - se o navegador bloquear microfone, STT ou autoplay, o assistente entra em `modo degradado em texto`;
   - nesse estado, o usuário ganha textarea e `Enviar` como fallback mínimo;
   - o modo degradado aparece só quando a voz não é sustentada pelo browser.

## Estados de voz

- `Ouvindo`
- `Conectando`
- `Pensando`
- `Falando`
- `Oculto`
- `Modo degradado`
- `Áudio bloqueado`
- `Sem suporte`
- `Microfone bloqueado`

## Regras de UX

- a UX pública expõe um único CTA principal para voz: `Falar com Davi`;
- `Ocultar` recolhe a interface, mas não desliga a sessão;
- controles manuais antigos (`Tocar para falar`, `Ouvir resposta`, `Selecionar item`) não fazem parte do fluxo principal;
- `intro`, `guia rápido` e `navegação` não devem cortar a resposta principal do assistente;
- a experiência tenta ser contínua na página, mas degrada para texto quando o navegador não sustenta esse fluxo.

## Limitações reais da plataforma

- STT depende da Web Speech API e varia por navegador;
- TTS pode ser bloqueado por política de gesto/autoplay;
- iPhone, Android e WebViews podem se comportar de forma diferente mesmo com o mesmo código;
- aba em background, tela bloqueada ou permissão negada podem pausar a sessão e forçar modo degradado.

## Debug

- o transcript local continua exportável em debug;
- smoke checks devem validar `funciona no celular?` e `como usar a voz?` com o contrato voz-first;
- o relatório consolidado desta rodada está em `docs/P0_VOZ_PIPELINE_FINAL.md`.
