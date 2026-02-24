# Guia de Integração: Make (Antigo Integromat) + Supabase

Para utilizar o **Make.com** em vez de código manual (Edge Functions), o processo é muito mais visual e simples. Abaixo estão os dois cenários principais que você pode configurar.

---

## Cenário 1: Notificação de Novo Aluguel (Gatilho Instantâneo)
Sempre que um novo aluguel for cadastrado, o Make envia um e-mail.

### No Make.com:
1.  Crie um novo **Scenario**.
2.  Adicione o módulo **Webhooks** -> **Custom Webhook**.
3.  Clique em "Add" e dê um nome (ex: "Novo Aluguel Obras").
4.  **Copie a URL** gerada pelo Make.
5.  Mantenha o Make em modo "Listening" (esperando dados).

### No Supabase (Dashboard):
1.  Vá em **Database** -> **Webhooks**.
2.  Clique em **Create a new Hook**.
3.  **Name:** `enviar_email_novo_aluguel`.
4.  **Table:** `rentals`.
5.  **Events:** Marque apenas **Insert**.
6.  **Type:** HTTP Request.
7.  **Method:** POST.
8.  **URL:** Cole a URL que você copiou do Make.
9.  Clique em **Save**.

### Finalizando no Make:
1.  Cadastre um aluguel de teste no seu sistema para o Make receber a estrutura de dados.
2.  No Make, adicione o módulo **Gmail** -> **Send an Email**.
3.  Conecte sua conta Google.
4.  No campo **To**, use o e-mail do engenheiro (que virá do webhook).
5.  No campo **Subject** e **Content**, monte seu texto usando os campos do Supabase (ex: `equipmentName`, `constructionSiteName`).

---

## Cenário 2: Verificação Diária de Vencimentos (Cron Job no Make)
O Make rodará todo dia às 08:00, consultará o banco e avisará quem está vencendo.

### No Make.com:
1.  Crie um novo **Scenario**.
2.  Adicione o módulo **Supabase** -> **Select Rows**.
3.  **Connection:** Conecte seu projeto Supabase (precisará da API Key e URL do projeto).
4.  **Table:** `rentals`.
5.  **Filter:** `status = 'ACTIVE'` (ou Use Query para filtrar datas próximas).
6.  Adicione um módulo **Tools** -> **Filter** ou um **Router** para verificar as datas:
    -   Se `endDate` é amanhã -> Enviar e-mail de **Aviso**.
    -   Se `endDate` é hoje -> Enviar e-mail de **Vencimento**.
    -   Se `endDate` passou -> Enviar e-mail de **Atraso**.
7.  Adicione o módulo **Gmail** -> **Send an Email** após os filtros.
8.  **Agendamento:** Clique no ícone do relógio no gatilho inicial e configure para "Every day" às 08:00.

---

## Vantagens dessa abordagem:
-   **Sem código:** Você monta o corpo do e-mail visualmente no Make.
-   **Fácil manutenção:** Se quiser mudar o texto do e-mail, basta editar no Make, sem mexer no sistema.
-   **Histórico:** O Make guarda logs de todos os e-mails enviados e erros que ocorreram.

> **Dica:** Se você tiver dificuldades em conectar o Supabase diretamente no Make, você pode usar o **Cenário 1** (Webhooks) para quase tudo, pois o Supabase "avisa" o Make quando algo muda.
