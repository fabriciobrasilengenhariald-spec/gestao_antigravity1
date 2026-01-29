import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DocumentData, CostCenter, InventoryItem } from '../types';

/**
 * Converte data de DD/MM/YYYY ou ISO para YYYY-MM-DD
 */
const parseDateToISO = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Se já tiver T (ISO full), retorna só a data
    if (dateStr.includes('T')) return dateStr.split('T')[0];

    // Tratamento para DD/MM/YYYY ou DD-MM-YYYY
    if (dateStr.includes('/') || (dateStr.includes('-') && dateStr.split('-')[0].length === 2)) {
        const separator = dateStr.includes('/') ? '/' : '-';
        const parts = dateStr.split(separator);
        if (parts.length === 3) {
            const [day, month, year] = parts;
            // Garante YYYY-MM-DD
            return `${year}-${month}-${day}`;
        }
    }

    // Se já for YYYY-MM-DD, devolve como está
    return dateStr;
};

/**
 * Salva um documento processado e seus itens no Supabase.
 * Isso atualizará automaticamente a View de estoque.
 */
export const saveDocumentToSupabase = async (data: DocumentData): Promise<void> => {
  if (!isSupabaseConfigured()) {
      throw new Error("Supabase não está configurado ou credenciais inválidas.");
  }

  console.log("Iniciando salvamento no Supabase...", data);

  // 1. Sanitização e Upsert de Centros de Custo
  // Garante que name nunca seja null/undefined para não quebrar a constraint do banco
  const originName = data.originCrName || `CR ${data.originCrCode}`;
  const destName = data.destinationCrName || `CR ${data.destinationCrCode}`;

  const crsToUpsert = [
      { code: data.originCrCode, name: originName },
      { code: data.destinationCrCode, name: destName }
  ].filter(cr => cr.code); 

  const { error: crError } = await supabase
      .from('cost_centers')
      .upsert(crsToUpsert, { onConflict: 'code' });

  if (crError) {
      console.error("Erro CR:", crError);
      throw new Error(`Erro ao salvar Centros de Custo: ${crError.message}`);
  }

  // 2. Inserir o Documento (Cabeçalho)
  const isoDate = parseDateToISO(data.date);

  const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
          document_number: data.documentNumber,
          origin_cr_code: data.originCrCode,
          destination_cr_code: data.destinationCrCode,
          movement_date: isoDate
      })
      .select('id')
      .single();

  if (docError) {
      console.error("Erro Documento:", docError);
      // Tratamento amigável para erro de duplicidade (código 23505 no Postgres)
      if (docError.code === '23505') {
          throw new Error(`O documento número ${data.documentNumber} já existe no sistema.`);
      }
      throw new Error(`Erro ao salvar Documento: ${docError.message}`);
  }
  
  const documentId = docData.id;

  // 3. Inserir os Itens
  // Conversão explícita de tipos para evitar erros se a IA mandou string em vez de number
  const itemsPayload = data.items.map(item => ({
      document_id: documentId,
      item_code: item.code,
      item_name: item.name,
      item_detail: item.detail || '',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'UN',
      unit_price: Number(item.unitPrice) || 0,
      total_value: Number(item.total) || 0
  }));

  if (itemsPayload.length > 0) {
      const { error: itemsError } = await supabase
          .from('movement_items')
          .insert(itemsPayload);

      if (itemsError) {
          console.error("Erro Itens:", itemsError);
          // Opcional: Poderíamos deletar o documento criado se os itens falharem (rollback manual)
          await supabase.from('documents').delete().eq('id', documentId);
          throw new Error(`Erro ao salvar Itens: ${itemsError.message}`);
      }
  } else {
      console.warn("Documento sem itens para salvar.");
  }
  
  console.log("Salvamento concluído com sucesso!");
};

/**
 * Busca o estoque consolidado diretamente da View do banco.
 * Transforma o retorno plano do banco na estrutura hierárquica (CostCenter -> Inventory[]) usada pela App.
 */
export const fetchInventoryFromSupabase = async (): Promise<CostCenter[]> => {
    if (!isSupabaseConfigured()) return [];

    // Busca dados da view_inventory_balance
    // E faz um join para pegar o nome do Centro de Custo
    const { data, error } = await supabase
        .from('view_inventory_balance')
        .select(`
            cr_code,
            item_code,
            item_name,
            item_detail,
            current_quantity,
            unit,
            avg_unit_price,
            total_value_stock,
            cost_centers ( name )
        `);

    if (error) {
        console.error("Erro ao buscar view_inventory_balance:", error);
        throw new Error(`Erro ao buscar estoque: ${error.message}`);
    }

    // Agrupa o resultado plano em objetos CostCenter
    const crMap = new Map<string, CostCenter>();

    data.forEach((row: any) => {
        if (!crMap.has(row.cr_code)) {
            crMap.set(row.cr_code, {
                code: row.cr_code,
                name: row.cost_centers?.name || 'Desconhecido',
                fullName: `${row.cr_code} - ${row.cost_centers?.name || 'Desconhecido'}`,
                inventory: []
            });
        }

        const cr = crMap.get(row.cr_code)!;
        
        // Adiciona o item ao inventário deste CR
        cr.inventory.push({
            code: row.item_code,
            name: row.item_name,
            detail: row.item_detail,
            quantity: Number(row.current_quantity),
            unit: row.unit,
            unitPrice: Number(row.avg_unit_price),
            total: Number(row.total_value_stock),
            // Campos extras requeridos pela interface InventoryItem, 
            // mas que a View consolidada não tem (pois é um saldo, não um movimento único)
            entryDate: new Date().toLocaleDateString('pt-BR'), 
            documentNumber: 'SALDO'
        });
    });

    return Array.from(crMap.values());
};

/**
 * Busca o histórico de movimentações para popular a busca/timeline
 */
export const fetchMovementsHistory = async (): Promise<DocumentData[]> => {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('documents')
        .select(`
            document_number,
            movement_date,
            origin_cr_code,
            origin:cost_centers!origin_cr_code(name),
            destination_cr_code,
            destination:cost_centers!destination_cr_code(name),
            movement_items (
                item_code, item_name, item_detail, quantity, unit, unit_price, total_value
            )
        `)
        .order('movement_date', { ascending: false });

    if (error) throw error;

    // Transforma para o formato DocumentData da aplicação
    return data.map((doc: any) => ({
        documentType: 'MOVEMENT',
        documentNumber: doc.document_number,
        date: new Date(doc.movement_date).toLocaleDateString('pt-BR'),
        originCrCode: doc.origin_cr_code,
        originCrName: doc.origin?.name || '',
        destinationCrCode: doc.destination_cr_code,
        destinationCrName: doc.destination?.name || '',
        movementType: 'Transferência', // Simplificado
        items: doc.movement_items.map((item: any) => ({
            code: item.item_code,
            name: item.item_name,
            detail: item.item_detail,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unit_price,
            total: item.total_value
        }))
    }));
}