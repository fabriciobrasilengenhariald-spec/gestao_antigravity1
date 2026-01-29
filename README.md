<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gestão de Aluguel de Materiais

Sistema de controle de estoque e aluguel de materiais com processamento automático de notas via IA.

## Executando Localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   `npm install`

2. Configure o arquivo `.env.local` usando o exemplo em [.env.example](.env.example):
   ```env
   VITE_SUPABASE_URL=sua_url
   VITE_SUPABASE_ANON_KEY=sua_chave_publica
   VITE_GEMINI_API_KEY=sua_chave_gemini
   ```

3. Inicie o servidor:
   `npm run dev`

## Deploy na Vercel

Este projeto está pronto para deploy na Vercel. Siga os passos:

1. Suba este projeto para um repositório no GitHub.

2. Acesse a [Vercel](https://vercel.com) e importe o projeto.

3. Nas configurações de **Environment Variables**, adicione as seguintes variáveis (copie os valores do seu arquivo `.env.local`):

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

4. Clique em **Deploy**.

> **Nota de Segurança:** Nunca exponha sua chave `service_role` (chave mestra) no frontend ou nas variáveis de ambiente deste projeto. Use apenas a chave `anon` (pública).
