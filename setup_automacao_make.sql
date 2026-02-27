-- 1. Garante que a tabela de notificações tenha os campos necessários para o Make.com
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_aluguel UUID REFERENCES public.rentals(id) ON DELETE CASCADE,
    tipo_email TEXT, -- 'aviso_24h', 'vencido_hoje', 'atraso_3d', 'atraso_7d'
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    email_destino TEXT,
    status TEXT DEFAULT 'sent'
);

-- 2. Cria a VIEW inteligente que o Make.com vai consultar diariamente
-- Esta view filtra apenas os aluguéis que precisam de aviso HOJE
CREATE OR REPLACE VIEW public.vw_alugueis_para_notificar AS
WITH calculo_datas AS (
    SELECT 
        r.id AS id_aluguel,
        r.equipamento,
        r.data_fim_prevista,
        r.status AS rental_status,
        e.nome AS engenheiro_nome,
        e.email AS engenheiro_email,
        o.nome AS obra_nome,
        f.name AS fornecedor_nome,
        r.order_total,
        -- Calcula a diferença em dias (data prevista - hoje)
        (r.data_fim_prevista - CURRENT_DATE) as dias_para_vencimento
    FROM rentals r
    JOIN engineers e ON r.engineer_id = e.id
    LEFT JOIN obras o ON r.id_obra = o.id
    LEFT JOIN suppliers f ON r.id_fornecedor = f.id
    WHERE r.return_date IS NULL  -- Só notifica o que não foi devolvido
      AND r.status != 'RETURNED'
)
SELECT 
    *,
    CASE 
        WHEN dias_para_vencimento = 1 THEN 'aviso_24h'
        WHEN dias_para_vencimento = 0 THEN 'vencido_hoje'
        WHEN dias_para_vencimento = -3 THEN 'atraso_3d'
        WHEN dias_para_vencimento = -7 THEN 'atraso_7d'
        ELSE NULL
    END as tipo_notificacao
FROM calculo_datas
WHERE 
    dias_para_vencimento IN (1, 0, -3, -7); -- Filtra apenas as datas de gatilho
