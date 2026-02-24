import { Rental, Engineer, Supplier, RentalStatus } from '../types';

export const mapRentalFromDB = (db: any): Rental => ({
    id: db.id,
    constructionSiteName: db.obras?.nome || 'Obra Desconhecida',
    supplierId: db.id_fornecedor || '',
    supplierName: db.fornecedores?.name || db.fornecedor || 'Fornecedor Desconhecido',
    equipmentName: db.equipamento,
    goodsTotal: Number(db.goods_total) || 0,
    orderTotal: Number(db.order_total) || 0,
    quantity: Number(db.quantity) || 1,
    unit: db.unit as 'dia' | 'mes' | 'unidade',
    startDate: db.data_inicio,
    endDate: db.data_fim_prevista,
    status: db.status as RentalStatus,
    engineerId: db.engineer_id || '',
    originalDocumentUrl: db.link_pdf_storage || '',
    returnDate: db.return_date || undefined,
    returnCondition: db.return_condition as 'OK' | 'DEFECTIVE' | undefined,
    maintenanceCost: Number(db.maintenance_cost) || 0,
    fineCost: Number(db.fine_cost) || 0,
    returnNotes: db.return_notes || ''
});

// Robust UUID check
const isUUID = (str: any) => {
    if (typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
};

export const mapRentalToDB = (r: Partial<Rental>) => {
    const dbObj: any = {
        // FORCE OMIT ID if it's not a proper UUID
        ...(r.id && isUUID(r.id) ? { id: r.id } : {}),
        fornecedor: r.supplierName,
        id_fornecedor: r.supplierId,
        equipamento: r.equipmentName,
        data_inicio: r.startDate,
        prazo_dias: r.quantity && r.unit === 'dia' ? Math.round(r.quantity) : (r.quantity && r.unit === 'mes' ? Math.round(r.quantity * 30) : 0),
        data_fim_prevista: r.endDate,
        status: r.status,
        goods_total: r.goodsTotal,
        order_total: r.orderTotal,
        quantity: r.quantity,
        unit: r.unit,
        // Ensure engineer_id is a valid UUID or NULL
        engineer_id: r.engineerId && isUUID(r.engineerId) ? r.engineerId : null,
        link_pdf_storage: r.originalDocumentUrl,
        return_date: r.returnDate,
        return_condition: r.returnCondition,
        maintenance_cost: r.maintenanceCost,
        fine_cost: r.fineCost,
        return_notes: r.returnNotes
    };

    // Ensure mandatory types
    if (dbObj.prazo_dias === undefined || isNaN(dbObj.prazo_dias)) dbObj.prazo_dias = 0;

    // Final cleanup of undefined values to avoid Supabase errors
    Object.keys(dbObj).forEach(key => dbObj[key] === undefined && delete dbObj[key]);

    return dbObj;
};

export const mapEngineerFromDB = (db: any): Engineer => ({
    id: db.id,
    name: db.nome,
    email: db.email,
    telegramHandle: '',
    telegramChatId: db.telegram_chat_id?.toString(),
    avatarUrl: undefined
});

export const mapSupplierFromDB = (db: any): Supplier => ({
    id: db.id,
    name: db.name,
    cnpj: db.cnpj || '',
    address: db.address || '',
    city: db.city || ''
});
