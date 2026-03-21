# Execucao Local

## Requisitos
- Node.js 18+
- npm

## Passo a passo
```bash
npm install
npm run dev
```
A aplicacao inicia em `http://localhost:3000`.

## Variaveis de ambiente
Crie um `.env.local` na raiz do repositório se necessário.

Obrigatorias (LLM):
- `GROQ_API_KEY` ou `OPENROUTER_API_KEY`

Opcionais:
- `NEXT_PUBLIC_ASSISTENTE_TEXT_DEBUG=true` (libera modo texto)
- `NEXT_PUBLIC_VITALS_DEBUG=true` (envia Web Vitals em dev)
- `NEXT_PUBLIC_SITE_URL=https://seu-dominio-ou-url-vercel` (metadata/OG em produção)
