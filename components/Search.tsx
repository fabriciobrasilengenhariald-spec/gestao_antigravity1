import React, { useState, useMemo } from 'react';
import { CostCenter, DocumentData } from '../types';
import { Search as SearchIcon, MapPin, Calendar, ArrowRight, History } from 'lucide-react';
import ItemHistory from './ItemHistory';

interface SearchProps {
  costCenters: CostCenter[];
  movements: DocumentData[];
}

const Search: React.FC<SearchProps> = ({ costCenters, movements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{code: string, name: string} | null>(null);

  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const lowerTerm = searchTerm.toLowerCase();
    const hits: Array<{
      crName: string;
      crCode: string;
      itemCode: string;
      itemName: string;
      quantity: number;
      unit: string;
      entryDate: string;
    }> = [];

    costCenters.forEach(cr => {
      cr.inventory.forEach(item => {
        if (
          item.name.toLowerCase().includes(lowerTerm) || 
          item.code.toLowerCase().includes(lowerTerm) ||
          item.detail.toLowerCase().includes(lowerTerm)
        ) {
          hits.push({
            crName: cr.name,
            crCode: cr.code,
            itemCode: item.code,
            itemName: `${item.name} ${item.detail}`,
            quantity: item.quantity,
            unit: item.unit,
            entryDate: item.entryDate
          });
        }
      });
    });

    return hits;
  }, [searchTerm, costCenters]);

  if (selectedHistoryItem) {
    return (
      <ItemHistory 
        itemCode={selectedHistoryItem.code}
        itemName={selectedHistoryItem.name}
        movements={movements}
        onBack={() => setSelectedHistoryItem(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Localizar Materiais</h2>
        <p className="text-slate-500">Pesquise por nome (ex: "container") ou código para saber onde o material está alugado.</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-300 rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg shadow-sm"
          placeholder="Digite o nome do material..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {searchTerm && results.length === 0 && (
           <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Nenhum material encontrado com esse termo.</p>
           </div>
        )}

        {results.map((result, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                   <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">
                     {result.itemCode}
                   </span>
                   <h4 className="text-lg font-bold text-slate-800">{result.itemName}</h4>
                </div>
                
                <div className="flex items-center text-slate-600 text-sm">
                   <span className="font-semibold text-blue-600">{result.quantity} {result.unit}</span>
                   <span className="mx-2 text-gray-300">|</span>
                   <span className="flex items-center">
                     <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                     Enviado em {result.entryDate}
                   </span>
                </div>
             </div>

             <div className="flex flex-col space-y-2 md:w-1/3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Localização Atual</p>
                          <p className="font-bold text-slate-800 text-sm">{result.crCode} - {result.crName}</p>
                      </div>
                    </div>
                </div>
                
                <button 
                  onClick={() => setSelectedHistoryItem({ code: result.itemCode, name: result.itemName })}
                  className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-600 font-medium py-2 px-4 border border-gray-200 rounded-lg transition-colors text-sm"
                >
                  <History className="w-4 h-4" />
                  <span>Ver Histórico</span>
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;