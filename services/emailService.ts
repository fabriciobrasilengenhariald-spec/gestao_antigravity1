import { Rental, Engineer } from '../types';

/**
 * Templates de Email para Notificações de Aluguel
 */

export const formatEmailReminder = (rental: Rental, engineer: Engineer, type: 'pre-expire' | 'expiry' | 'overdue') => {
    const totalWithExtras = rental.orderTotal + (rental.maintenanceCost || 0) + (rental.fineCost || 0);

    let subject = '';
    let greeting = `Olá ${engineer.name},`;
    let message = '';
    let recipients: string[] = [engineer.email];

    // Adicionar stakeholders conforme o nível
    if (type === 'pre-expire') {
        subject = `[Lembrete] Devolução de Equipamento Amanhã - Obra: ${rental.constructionSiteName}`;
        message = `Este é um lembrete amigável de que o aluguel do item abaixo vence amanhã. Por favor, organize a logística de devolução ou solicite a prorrogação.`;
        // Adicionar Almoxarifado (simulado)
        recipients.push('almoxarifado@empresa.com.br');
    }
    else if (type === 'expiry') {
        subject = `[HOJE] Prazo de Devolução Finaliza Hoje - ${rental.constructionSiteName}`;
        message = `O prazo para devolução do equipamento abaixo encerra HOJE. Evite multas confirmando a entrega ou prorrogação no sistema.`;
    }
    else if (type === 'overdue') {
        subject = `[ATRASO] Equipamento não devolvido - Início de Multa - Obra: ${rental.constructionSiteName}`;
        message = `ATENÇÃO: O equipamento abaixo está com a devolução ATRASADA. Os custos de multa e manutenção diária já estão sendo contabilizados.`;
        // Adicionar Stakeholders
        recipients.push('gerente.contratos@empresa.com.br', 'financeiro@empresa.com.br');
    }

    const tableHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <h2 style="margin-top: 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Detalhes do Aluguel</h2>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b;">Equipamento:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${rental.equipmentName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b;">Empresa (Locadora):</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${rental.supplierName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b;">Data do Aluguel:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${new Date(rental.startDate).toLocaleDateString('pt-BR')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b;">Data de Vencimento:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #e11d48;">${new Date(rental.endDate).toLocaleDateString('pt-BR')}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 12px 0; color: #64748b;">Valor Unitário:</td>
                    <td style="padding: 12px 0; font-weight: bold; text-align: right;">R$ ${rental.orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr style="border-top: 2px solid #0067B4;">
                    <td style="padding: 12px 0; font-weight: bold;">VALOR TOTAL:</td>
                    <td style="padding: 12px 0; font-weight: 800; text-align: right; font-size: 18px; color: #1e293b;">R$ ${totalWithExtras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
            </table>
        </div>
    `;

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0067B4; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">LD ALUGUÉIS</h1>
                <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8;">Gestão de Equipamentos</p>
            </div>
            <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                <p>${greeting}</p>
                <p>${message}</p>
                ${tableHtml}
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <a href="#" style="background-color: #01A4F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">ACESSAR PAINEL DO GESTOR</a>
                </div>
            </div>
            <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 12px 12px;">
                <p style="margin: 0; font-weight: 800;">© ${new Date().getFullYear()} LD ENGENHARIA</p>
                <p style="margin: 4px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Este é um e-mail automático, por favor não responda.</p>
            </div>
        </div>
    `;

    return {
        subject,
        to: recipients,
        html: htmlContent
    };
};

/**
 * Função simulada para disparar o e-mail via Supabase Edge Function
 */
export const sendEmail = async (emailData: { subject: string, to: string[], html: string }) => {
    console.log("Simulando envio de e-mail:", emailData);
    return true;
};
