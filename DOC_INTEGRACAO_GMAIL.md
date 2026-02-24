# Guia de Integração: Gmail SMTP + Supabase

Para que o sistema envie e-mails automaticamente mesmo com o site fechado, seguimos o padrão de **Edge Functions** do Supabase trabalhando como um "Cron Job".

## 1. Configuração do Gmail
1.  Acesse sua conta Google e vá em **Segurança**.
2.  Ative a **Verificação em duas etapas**.
3.  Pesquise por **Senhas de App**.
4.  Crie uma nova senha chamada "Sistema Obras" e guarde o código de 16 dígitos.

## 2. Código da Função (Supabase Edge Function)
Crie uma função no seu projeto Supabase (ex: `supabase/functions/send-gmail/index.ts`).

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const SMTP_USER = Deno.env.get("GMAIL_USER"); // seuemail@gmail.com
const SMTP_PASS = Deno.env.get("GMAIL_APP_PASS"); // a senha de 16 dígitos

serve(async (req) => {
  const { to, subject, html } = await req.json();

  const client = new SmtpClient();
  
  await client.connectTLS({
    hostname: "smtp.gmail.com",
    port: 465,
    username: SMTP_USER,
    password: SMTP_PASS,
  });

  await client.send({
    from: SMTP_USER,
    to: to, // Pode ser um array de e-mails
    subject: subject,
    content: html,
    type: "text/html",
  });

  await client.close();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
})
```

## 3. Automação (O "Cron Job")
Para o envio ocorrer todo dia às 08:00 sem intervenção humana, você deve agendar a execução no painel do Supabase SQL Editor:

```sql
-- Habilita a extensão de agendamento
create extension if not exists pg_cron;

-- Agenda a consulta para rodar todo dia às 08:00
select cron.schedule(
  'enviar-lembretes-diarios',
  '0 8 * * *', -- Cron syntax: Minuto Hora Dia Mês Dia_da_Semana
  $$
    select
      net.http_post(
        url:='https://SEU_PROJETO.supabase.co/functions/v1/process-rentals-logic',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SUA_ANON_KEY"}'::jsonb
      );
  $$
);
```

## 4. Lógica de Verificação
A função `process-rentals-logic` deve:
1.  Buscar todos os aluguéis `ACTIVE`.
2.  Calcular a diferença de dias entre `endDate` e HOJE.
3.  Se `diff == 1`: Disparar template **Aviso Prévio**.
4.  Se `diff == 0`: Disparar template **Vencimento Hoje**.
5.  Se `diff < 0`: Disparar template **Atrasado** (com stakeholder em cópia).
