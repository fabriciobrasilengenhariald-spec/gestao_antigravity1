export enum RentalStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON', // Within 1 day
  OVERDUE = 'OVERDUE',
  RETURNED = 'RETURNED'
}

export interface Engineer {
  id: string;
  name: string;
  email: string;
  telegramHandle: string;
  telegramChatId?: string; // Novo campo para notificações automáticas
  avatarUrl?: string;
}

export interface Supplier {
  id: string;
  name: string; // "1503 - HML..."
  cnpj: string;
  address: string;
  city: string;
}

export interface ConstructionSite {
  id: string;
  name: string; // e.g., "516 - OBRA CIMATEC"
  address: string;
  responsibleEngineerId: string;
}

export interface Rental {
  id: string;
  constructionSiteName: string;

  // Dados do Fornecedor Linkados
  supplierId: string;
  supplierName: string; // Snapshot for display

  equipmentName: string; // "Código - Nome do Insumo"

  // Valores
  goodsTotal: number; // Total das Mercadorias
  orderTotal: number; // Total do Pedido (Final com frete/desconto)

  quantity: number;
  unit: 'dia' | 'mes' | 'unidade';
  startDate: string; // Data da entrega
  endDate: string;
  status: RentalStatus;
  engineerId?: string;
  originalDocumentUrl?: string;

  // Devolução e Custos Extras
  returnDate?: string;
  returnCondition?: 'OK' | 'DEFECTIVE';
  maintenanceCost?: number;
  fineCost?: number; // Multa
  returnNotes?: string;
}

export interface ExtractedData {
  constructionSite: string;

  // Fornecedor
  supplierName: string;
  supplierCNPJ: string;
  supplierAddress: string;
  supplierCity: string;

  // Lista de Itens
  items: Array<{
    equipment: string; // Código + Nome
    quantity: number;
    unit: string;
    goodsTotal: number;
    orderTotal: number; // Pode ser rateado ou individual
  }>;

  date: string; // Data de entrega
}
