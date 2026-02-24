import { Rental, Engineer } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// IDENTIDADE DO SISTEMA — altere aqui se mudar o nome da empresa
// ─────────────────────────────────────────────────────────────────────────────
const EMPRESA_NOME = 'LD Engenharia';
const SISTEMA_NOME = 'Sistema de Gestão de Locações';
const SISTEMA_SIGLA = 'LD ALUGUÉIS';
const ANO_ATUAL = new Date().getFullYear();

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de e-mail
// ─────────────────────────────────────────────────────────────────────────────
export type EmailType = 'aviso_24h' | 'vencido_hoje' | 'atraso_3d' | 'atraso_7d';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: formata data pt-BR
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (raw: string) =>
    new Date(raw + 'T12:00:00').toLocaleDateString('pt-BR');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: formata moeda
// ─────────────────────────────────────────────────────────────────────────────
const fmtBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─────────────────────────────────────────────────────────────────────────────
// HTML base do cabeçalho do e-mail
// ─────────────────────────────────────────────────────────────────────────────
const emailHeader = (accentColor: string) => `
    <div style="background:${accentColor};color:#fff;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;font-weight:900;letter-spacing:-0.5px;font-family:sans-serif;">
            ${SISTEMA_SIGLA}
        </h1>
        <p style="margin:4px 0 0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;opacity:0.85;font-family:sans-serif;">
            ${EMPRESA_NOME} — Gestão de Equipamentos Locados
        </p>
    </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML da tabela de detalhes do aluguel
// ─────────────────────────────────────────────────────────────────────────────
const detalhesTabela = (rental: Rental, diasAtraso?: number) => `
    <table style="width:100%;border-collapse:collapse;font-size:14px;font-family:sans-serif;margin-top:20px;">
        <tbody>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;width:45%;">📦 Equipamento</td>
                <td style="padding:10px 4px;font-weight:700;color:#1e293b;text-align:right;">${rental.equipmentName}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;">📅 Data Início</td>
                <td style="padding:10px 4px;font-weight:700;color:#1e293b;text-align:right;">${fmtDate(rental.startDate)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;">📅 Data Devolução</td>
                <td style="padding:10px 4px;font-weight:700;color:#dc2626;text-align:right;">${fmtDate(rental.endDate)}</td>
            </tr>
            ${diasAtraso !== undefined ? `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;">⏰ Dias em Atraso</td>
                <td style="padding:10px 4px;font-weight:900;color:#dc2626;text-align:right;">${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}</td>
            </tr>` : ''}
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;">🏗️ Obra</td>
                <td style="padding:10px 4px;font-weight:700;color:#1e293b;text-align:right;">${rental.constructionSiteName}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 4px;color:#64748b;">🏢 Fornecedor</td>
                <td style="padding:10px 4px;font-weight:700;color:#1e293b;text-align:right;">${rental.supplierName}</td>
            </tr>
            <tr>
                <td style="padding:12px 4px;font-weight:700;color:#1e293b;font-size:15px;">💰 Valor Total</td>
                <td style="padding:12px 4px;font-weight:900;color:#0067B4;text-align:right;font-size:16px;">${fmtBRL(rental.orderTotal)}</td>
            </tr>
        </tbody>
    </table>
`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML do rodapé
// ─────────────────────────────────────────────────────────────────────────────
const emailFooter = () => `
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;border-radius:0 0 12px 12px;">
        <p style="margin:0;font-weight:800;font-size:12px;color:#475569;font-family:sans-serif;">
            © ${ANO_ATUAL} ${EMPRESA_NOME} — ${SISTEMA_NOME}
        </p>
        <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;letter-spacing:0.5px;font-family:sans-serif;text-transform:uppercase;">
            Este e-mail é gerado automaticamente. Responda diretamente a este e-mail para comunicar sua decisão.
        </p>
    </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Monta o HTML completo do e-mail
// ─────────────────────────────────────────────────────────────────────────────
const montarHtml = (
    accentColor: string,
    nomeBadge: string,
    badgeColor: string,
    engNome: string,
    intro: string,
    corpo: string,
    rental: Rental,
    diasAtraso?: number
) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    ${emailHeader(accentColor)}
    <div style="padding:32px;color:#1e293b;line-height:1.7;background:#ffffff;">
        <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:10px;font-weight:900;letter-spacing:2px;padding:4px 12px;border-radius:100px;text-transform:uppercase;margin-bottom:16px;">
            ${nomeBadge}
        </span>
        <p style="margin:0 0 8px;font-size:15px;">Prezado(a) <strong>${engNome}</strong>,</p>
        <p style="margin:0 0 20px;color:#475569;">${intro}</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Detalhes da Locação</p>
            ${detalhesTabela(rental, diasAtraso)}
        </div>

        <div style="margin-top:24px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;color:#92400e;font-size:13px;">
            ${corpo}
        </div>

        <div style="margin-top:24px;padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
            <p style="margin:0;font-size:13px;color:#0369a1;font-weight:700;">📩 Como responder:</p>
            <p style="margin:8px 0 0;font-size:13px;color:#0369a1;line-height:1.6;">
                Responda a este e-mail informando ao comprador uma das opções abaixo:<br>
                <strong>1. DEVOLVER</strong> — Informe a data prevista de devolução.<br>
                <strong>2. RENOVAR</strong> — Informe o novo período desejado.<br>
                <strong>3. JÁ DEVOLVIDO</strong> — Informe que o material já foi entregue.
            </p>
        </div>
    </div>
    ${emailFooter()}
</div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL — Gera o e-mail de acordo com o tipo
// ─────────────────────────────────────────────────────────────────────────────
export const formatEmailReminder = (
    rental: Rental,
    engineer: Engineer,
    type: EmailType,
    adminEmail?: string
) => {
    const obraNome = rental.constructionSiteName;
    const engNome = engineer.name;
    const recipients: string[] = [engineer.email];

    let subject = '';
    let nomeBadge = '';
    let badgeColor = '';
    let accentColor = '';
    let intro = '';
    let corpo = '';
    let diasAtraso: number | undefined;

    switch (type) {

        // ── EMAIL 1: Aviso 24h antes ──────────────────────────────────────
        case 'aviso_24h':
            subject = `LOCAÇÃO - ${obraNome} — Vencimento em 24 horas`;
            nomeBadge = '⏰ Aviso de Vencimento';
            badgeColor = '#D97706';
            accentColor = '#0067B4';
            intro = `Este é um aviso automático do <strong>${SISTEMA_NOME}</strong> da <strong>${EMPRESA_NOME}</strong>. O contrato de locação a seguir vence <strong>AMANHÃ</strong>. Providencie a devolução ou a renovação junto ao fornecedor.`;
            corpo = `⚠️ <strong>Ação necessária:</strong> Confirme se o material será devolvido ou se precisa de renovação. Caso a devolução já tenha sido realizada, responda a este e-mail para evitar futuras notificações.`;
            break;

        // ── EMAIL 2: Venceu hoje ──────────────────────────────────────────
        case 'vencido_hoje':
            subject = `LOCAÇÃO - ${obraNome} — Locação VENCIDA hoje`;
            nomeBadge = '🚨 Locação Vencida';
            badgeColor = '#DC2626';
            accentColor = '#B91C1C';
            intro = `Este é um aviso automático do <strong>${SISTEMA_NOME}</strong> da <strong>${EMPRESA_NOME}</strong>. A locação abaixo <strong>VENCEU HOJE</strong> e o material ainda não foi registrado como devolvido no sistema.`;
            corpo = `🚨 <strong>Ação necessária:</strong> Devolva o material ao fornecedor ou solicite a renovação. A partir de agora podem incidir <strong>multas e custos adicionais</strong> de diária. Responda a este e-mail informando sua decisão ao comprador responsável.`;
            break;

        // ── EMAIL 3: 3 dias em atraso ─────────────────────────────────────
        case 'atraso_3d':
            subject = `⚠️ URGENTE - LOCAÇÃO - ${obraNome} — 3 dias em atraso`;
            nomeBadge = '⚠️ 3 dias em atraso';
            badgeColor = '#DC2626';
            accentColor = '#7C3AED';
            diasAtraso = 3;
            intro = `Este é um aviso urgente do <strong>${SISTEMA_NOME}</strong> da <strong>${EMPRESA_NOME}</strong>. A locação abaixo está <strong>3 DIAS EM ATRASO</strong> e o material não foi registrado como devolvido.`;
            corpo = `🚨 <strong>Este e-mail foi copiado para a administração da empresa.</strong><br><br>Regularize a situação <strong>URGENTEMENTE</strong> devolvendo o material ou solicitando o prolongamento do contrato junto ao fornecedor. Responda a este e-mail informando sua decisão.`;
            // Copia o admin
            if (adminEmail) recipients.push(adminEmail);
            break;

        // ── EMAIL 4: 7 dias em atraso ─────────────────────────────────────
        case 'atraso_7d':
            subject = `🚨 NOTIFICAÇÃO FORMAL - LOCAÇÃO - ${obraNome} — 7 DIAS EM ATRASO`;
            nomeBadge = '🚨 7 dias em atraso — Notificação Formal';
            badgeColor = '#991B1B';
            accentColor = '#1e293b';
            diasAtraso = 7;
            intro = `<strong>NOTIFICAÇÃO FORMAL</strong> do <strong>${SISTEMA_NOME}</strong> da <strong>${EMPRESA_NOME}</strong>. O equipamento abaixo está com <strong>7 DIAS DE ATRASO</strong> na devolução. Esta situação pode gerar consequências contratuais, cobrança de multas e danos à relação com o fornecedor.`;
            corpo = `🔴 <strong>Contate imediatamente o fornecedor ${rental.supplierName} e regularize a situação.</strong><br><br>Registre a devolução no sistema assim que realizada ou informe ao comprador a nova data prevista respondendo a este e-mail.`;
            // Copia o admin
            if (adminEmail) recipients.push(adminEmail);
            break;
    }

    const htmlContent = montarHtml(
        accentColor, nomeBadge, badgeColor, engNome, intro, corpo, rental, diasAtraso
    );

    return { subject, to: recipients, html: htmlContent };
};

// ─────────────────────────────────────────────────────────────────────────────
// Alias de compatibilidade para chamadas legadas no App.tsx
// Converte os tipos antigos ('pre-expire' | 'expiry' | 'overdue') → novos
// ─────────────────────────────────────────────────────────────────────────────
type LegacyType = 'pre-expire' | 'expiry' | 'overdue';
const legacyMap: Record<LegacyType, EmailType> = {
    'pre-expire': 'aviso_24h',
    'expiry': 'vencido_hoje',
    'overdue': 'atraso_3d',
};

export const formatEmailReminderLegacy = (
    rental: Rental,
    engineer: Engineer,
    type: LegacyType
) => formatEmailReminder(rental, engineer, legacyMap[type]);

// ─────────────────────────────────────────────────────────────────────────────
// Disparo simulado (será substituído pela Edge Function / Make.com)
// ─────────────────────────────────────────────────────────────────────────────
export const sendEmail = async (emailData: { subject: string; to: string[]; html: string }) => {
    console.log(`[${SISTEMA_NOME}] Simulando envio de e-mail:`, {
        assunto: emailData.subject,
        destinatarios: emailData.to,
    });
    return true;
};
