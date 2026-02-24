import { RentalStatus } from "./types";

export const MOCK_ENGINEERS = [
  {
    id: 'eng-1',
    name: 'Carlos Silva',
    email: 'carlos.silva@ldengenharia.com.br',
    telegramHandle: '@carlos_eng',
    avatarUrl: 'https://picsum.photos/seed/eng1/50/50'
  },
  {
    id: 'eng-2',
    name: 'Amanda Oliveira',
    email: 'amanda.o@ldengenharia.com.br',
    telegramHandle: '@amanda_eng_ld',
    avatarUrl: 'https://picsum.photos/seed/eng2/50/50'
  }
];

// Iniciando zerado conforme solicitado
export const MOCK_RENTALS = [] as any[];

// Mock inicial de fornecedores (opcional, pode começar vazio)
export const MOCK_SUPPLIERS = [
  {
    id: 'sup-1',
    name: '1503 - HML SALVADOR ALUGUEL DE EQUIPAMENTOS EIRELI',
    cnpj: '12.345.678/0001-90',
    address: 'Rua Exemplo, 123, Bairro Industrial',
    city: 'Salvador'
  }
];

export const calculateEndDate = (startDate: string, quantity: number, unit: string): string => {
  const start = new Date(startDate);
  const end = new Date(startDate);

  if (unit.toLowerCase().includes('mês') || unit.toLowerCase().includes('mes')) {
    end.setMonth(start.getMonth() + quantity);
  } else if (unit.toLowerCase().includes('dia')) {
    end.setDate(start.getDate() + quantity);
  } else {
    // Default fallback: treat as days if unknown
    end.setDate(start.getDate() + quantity);
  }
  return end.toISOString().split('T')[0];
};

export const determineStatus = (endDateStr: string): RentalStatus => {
  const today = new Date();
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return RentalStatus.OVERDUE;
  if (diffDays <= 1) return RentalStatus.EXPIRING_SOON;
  return RentalStatus.ACTIVE;
};

/**
 * Formata uma data string (AAAA-MM-DD) para exibição PT-BR garantindo o dia correto
 * sem interferência de fuso horário.
 */
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  // Garante que a data seja tratada como UTC para evitar o erro de retroceder um dia
  // split e manual parse é o método mais seguro
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;

  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
};

/**
 * Formata valores numéricos para o eixo Y de gráficos de forma adaptativa.
 * R$ 0-999 -> ex: R$ 500
 * R$ 1.000-9.999 -> ex: R$ 1,5k
 * R$ 10.000-999.999 -> ex: R$ 10k
 * R$ 1.000.000+ -> ex: R$ 1,5M
 */
export const formatCurrencyAxis = (value: number): string => {
  const abs = Math.abs(value);

  if (abs === 0) return 'R$0';

  if (abs >= 1000000) {
    return `R$${(value / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  }

  if (abs >= 10000) {
    return `R$${Math.round(value / 1000)}k`;
  }

  if (abs >= 1000) {
    const kValue = value / 1000;
    if (Number.isInteger(kValue)) {
      return `R$${kValue}k`;
    }
    return `R$${kValue.toLocaleString('pt-BR', { maximumFractionDigits: 1 }).replace(',', '.')}k`;
  }

  return `R$${Math.round(value)}`;
};
