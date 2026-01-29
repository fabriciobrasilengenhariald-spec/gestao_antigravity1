import React, { useState } from 'react';
import { DocumentData } from '../types';
import { ArrowLeft, Calendar, FileText, ArrowRight, Truck, History, Filter, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface ItemHistoryProps {
  itemCode: string;
  itemName: string;
  movements: DocumentData[];
  onBack: () => void;
}

type FilterType = 'ALL' | 'SEND' | 'RETURN' | 'TRANSFER';

const ItemHistory: React.FC<ItemHistoryProps> = ({ itemCode, itemName, movements, onBack }) => {
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  // 1. First, filter documents that contain this specific item and Sort by date
  const itemHistory = movements.filter(doc => 
    doc.items.some(i => i.code === itemCode)
  ).sort((a, b) => {
    // Sort by date descending (newest first)
    // Handle both / and - date formats just in case
    const parseDate = (dateStr: string) => {
        if (dateStr.includes('/')) {
            const [d, m, y] = dateStr.split('/').map(Number);
            return new Date(y, m - 1, d).getTime();
        }
        if (dateStr.includes('-')) {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d).getTime();
        }
        return 0;
    };
    return parseDate(b.date) - parseDate(a.date);
  });

  // 2. Apply the specific Type Filter
  const filteredHistory = itemHistory.filter(doc => {
      const isReturn = doc.destinationCrCode === '483';
      const isTransfer = doc.originCrCode !== '483' && doc.destinationCrCode !== '483';
      const isSend = doc.originCrCode === '483' && doc.destinationCrCode !== '483';

      if (filterType === 'RETURN') return isReturn;
      if (filterType === 'TRANSFER') return isTransfer;
      if (filterType === 'SEND') return isSend;
      return true; // 'ALL'
  });

  // Helper to render filter buttons
  const FilterButton = ({ type, label, icon: Icon, activeClass }: { type: FilterType, label: string, icon?: any, activeClass: string }) => (
      <button
          onClick={() => setFilterType(type)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center space-x-2 ${
              filterType === type 
                  ? `${activeClass} shadow-sm border-transparent` 
                  : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
          }`}
      >
          {Icon && <Icon className="w-4 h-4" />}
          <span>{label}</span>
      </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar para Busca
      </button>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
         <div className="flex items-center space-x-3 mb-2">
            <span className="bg-slate-800 text-white text-sm font-bold px-3 py-1 rounded-md shadow-sm">
              {itemCode}
            </span>
            <h2 className="text-2xl font-bold text-slate-800">{itemName}</h2>
         </div>
         <p className="text-slate-500 flex items-center">
            <History className="w-4 h-4 mr-2" />
            Histórico completo de movimentações
         </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-slate-700 ml-1 flex items-center">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                Filtrar Movimentações
            </h3>
            
            <div className="flex flex-wrap gap-2">
                <FilterButton 
                    type="ALL" 
                    label="Todos" 
                    activeClass="bg-slate-800 text-white" 
                />
                <FilterButton 
                    type="SEND" 
                    label="Envios" 
                    icon={ArrowUpRight} 
                    activeClass="bg-orange-500 text-white" 
                />
                <FilterButton 
                    type="TRANSFER" 
                    label="Transferências" 
                    icon={RefreshCw} 
                    activeClass="bg-purple-500 text-white" 
                />
                <FilterButton 
                    type="RETURN" 
                    label="Devoluções" 
                    icon={ArrowDownLeft} 
                    activeClass="bg-blue-500 text-white" 
                />
            </div>
        </div>
        
        {filteredHistory.length === 0 ? (
           <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
             <p className="text-gray-500">
                 {filterType === 'ALL' 
                    ? 'Nenhum histórico encontrado para este item nos documentos importados.' 
                    : 'Nenhuma movimentação deste tipo encontrada.'}
             </p>
           </div>
        ) : (
          <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pb-4 mt-6">
            {filteredHistory.map((doc, idx) => {
               // Find the specific item details in this document
               const itemDetails = doc.items.find(i => i.code === itemCode);
               if (!itemDetails) return null;

               const isReturn = doc.destinationCrCode === '483'; // Returning to Warehouse
               const isTransfer = doc.originCrCode !== '483' && doc.destinationCrCode !== '483'; // Site to Site
               // Else isSend
               
               return (
                 <div key={`${doc.documentNumber}-${idx}`} className="relative pl-8">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        isReturn ? 'bg-blue-500' : (isTransfer ? 'bg-purple-500' : 'bg-orange-500')
                    }`}></div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                          <div className="flex items-center text-sm text-gray-500">
                             <Calendar className="w-4 h-4 mr-1" />
                             <span className="font-medium mr-4">{doc.date}</span>
                             <FileText className="w-4 h-4 mr-1" />
                             <span>{doc.documentNumber}</span>
                          </div>
                          <div className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${
                             isReturn ? 'bg-blue-50 text-blue-700' : (isTransfer ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700')
                          }`}>
                             {isReturn ? 'Devolução' : (isTransfer ? 'Transferência' : 'Envio para Obra')}
                          </div>
                       </div>

                       <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex items-center space-x-3 text-sm">
                             <div className="text-right">
                                <p className="text-xs text-gray-400">De</p>
                                <p className="font-semibold text-slate-700">{doc.originCrName}</p>
                             </div>
                             <ArrowRight className="w-4 h-4 text-gray-400" />
                             <div>
                                <p className="text-xs text-gray-400">Para</p>
                                <p className="font-semibold text-slate-700">{doc.destinationCrName}</p>
                             </div>
                          </div>

                          <div className="text-right">
                             <p className="text-xs text-gray-400 mb-0.5">Quantidade</p>
                             <p className="text-lg font-bold text-slate-800">
                                {itemDetails.quantity} <span className="text-xs font-normal text-gray-500">{itemDetails.unit}</span>
                             </p>
                          </div>
                       </div>
                       
                       <div className="mt-2 text-right">
                           <span className="text-xs text-gray-400">Valor ref. ao movimento: </span>
                           <span className="text-sm font-medium text-slate-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemDetails.total)}
                           </span>
                       </div>
                    </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemHistory;