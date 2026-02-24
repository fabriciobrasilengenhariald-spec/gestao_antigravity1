import { formatDate } from '../constants';

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;

/**
 * Envia uma mensagem via Telegram Bot API
 * @param chatId O ID numérico do chat do usuário
 * @param message Texto da mensagem (suporta Markdown simples)
 */
export const sendTelegramMessage = async (chatId: string, message: string): Promise<boolean> => {
    if (!TELEGRAM_TOKEN || !chatId) {
        console.warn("Telegram Token ou ChatId ausente.");
        return false;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Erro ao enviar mensagem para o Telegram:", error);
        return false;
    }
};

/**
 * Helper para formatar mensagens de novos aluguéis
 */
export const formatRentalNotification = (rental: any): string => {
    return `
🚀 *Novo Aluguel Registrado*

🏗️ *Obra:* ${rental.constructionSiteName}
📦 *Item:* ${rental.equipmentName}
📅 *Entrega:* ${formatDate(rental.startDate)}
⏳ *Previsão Devolução:* ${formatDate(rental.endDate)}
💰 *Valor:* R$ ${rental.orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

_Por favor, confirme o recebimento do material no canteiro._
    `;
};

/**
 * Helper para mensagens de avaria/defeito
 */
export const formatDefectNotification = (rental: any): string => {
    return `
⚠️ *ALERTA DE AVARIA*

🏗️ *Obra:* ${rental.constructionSiteName}
📦 *Item:* ${rental.equipmentName}
📅 *Devolvido em:* ${formatDate(rental.returnDate)}
🛠️ *Custo Reparo:* R$ ${rental.maintenanceCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📝 *Notas:* ${rental.returnNotes || 'Sem observações'}

_Verificar detalhes no painel administrativo._
    `;
};

/**
 * Helper para alertas de vencimento (2 dias antes)
 */
export const formatExpirationAlert = (rental: any): string => {
    return `
⏰ *LEMBRETE DE VENCIMENTO*

O aluguel do item abaixo vence em *2 dias*. 

🏗️ *Obra:* ${rental.constructionSiteName}
📦 *Item:* ${rental.equipmentName}
📅 *Data de Devolução:* ${formatDate(rental.endDate)}

_Por favor, providencie a liberação do material ou solicite a renovação se necessário._
    `;
};

/**
 * Verifica e notifica sobre aluguéis que vencem em X dias
 */
export const notifyUpcomingExpirations = (rentals: any[], engineers: any[], daysBefore: number = 2) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    rentals.forEach(rental => {
        if (rental.status === 'RETURNED' || !rental.engineerId) return;

        const endDate = new Date(rental.endDate);
        endDate.setHours(0, 0, 0, 0);

        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === daysBefore) {
            const eng = engineers.find(e => e.id === rental.engineerId);
            if (eng?.telegramChatId) {
                sendTelegramMessage(eng.telegramChatId, formatExpirationAlert(rental));
            }
        }
    });
};
