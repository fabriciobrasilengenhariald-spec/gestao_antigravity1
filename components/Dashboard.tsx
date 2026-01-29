import React from 'react';
import { CostCenter } from '../types';
import { Calendar, Package, Clock, DollarSign, TrendingUp, Warehouse, HardHat } from 'lucide-react';

interface DashboardProps {
  costCenters: CostCenter[];
}

const Dashboard: React.FC<DashboardProps> = ({ costCenters }) => {
  // Separate Warehouse (483) from Projects
  const warehouse = costCenters.find(cr => cr.code === '483');
  const activeProjects = costCenters.filter(cr => cr.code !== '483' && cr.inventory.length > 0);

  const calculateDaysRented = (entryDate: string) => {
    if (!entryDate) return 0;
    
    let dateObj: Date | null = null;
    
    // Tenta detectar o formato YYYY-MM-DD (ISO)
    if (entryDate.includes('-')) {
        const parts = entryDate.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts.map(Number);
            dateObj = new Date(year, month - 1, day);
        }
    } 
    // Tenta detectar o formato DD/MM/YYYY (BR)
    else if (entryDate.includes('/')) {
        const parts = entryDate.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            dateObj = new Date(year, month - 1, day);
        }
    }

    // Se a data for inválida
    if (!dateObj || isNaN(dateObj.getTime())) return 0;

    const today = new Date();
    // Zerar horas para cálculo preciso de dias
    today.setHours(0,0,0,0);
    dateObj.setHours(0,0,0,0);
    
    const diffTime = Math.abs(today.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  // Calculate Value currently RENTED OUT (at projects)
  const totalRentedValue = activeProjects.reduce((acc, cr) => {
    return acc + cr.inventory.reduce((sum, item) => sum + item.total, 0);
  }, 0);

  // Calculate Value IN STOCK (at warehouse 483)
  const totalStockValue = warehouse ? warehouse.inventory.reduce((sum, item) => sum + item.total, 0) : 0;

  if (activeProjects.length === 0 && (!warehouse || warehouse.inventory.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700">Sistema Vazio</h3>
        <p className="text-gray-500 mt-2 max-w-md">
          Não há dados de estoque ou aluguel. Importe documentos PDF para iniciar o controle.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Value Rented Out */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between relative overflow-hidden">
            <div className="flex items-center space-x-5 z-10">
              <div className="p-4 bg-orange-100 rounded-full shadow-sm">
                <DollarSign className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Alugado (Em Obras)</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRentedValue)}
                </h3>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end z-10">
               <div className="flex items-center text-orange-600 text-sm font-medium bg-orange-50 px-3 py-1 rounded-full mb-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Ativo</span>
               </div>
               <p className="text-xs text-slate-400">{activeProjects.length} obras ativas</p>
            </div>
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-orange-50 to-transparent opacity-50 pointer-events-none"></div>
        </div>

        {/* Card 2: Value In Warehouse */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between relative overflow-hidden">
            <div className="flex items-center space-x-5 z-10">
              <div className="p-4 bg-blue-100 rounded-full shadow-sm">
                <Warehouse className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Estoque Disponível (483)</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalStockValue)}
                </h3>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end z-10">
               <div className="flex items-center text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-full mb-1">
                  <Package className="w-4 h-4 mr-1" />
                  <span>Depósito</span>
               </div>
               <p className="text-xs text-slate-400">{warehouse?.inventory.length || 0} itens</p>
            </div>
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-blue-50 to-transparent opacity-50 pointer-events-none"></div>
        </div>
      </div>

      {/* SECTION 1: ACTIVE PROJECTS (RENTERS) */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <HardHat className="w-6 h-6 mr-2 text-orange-500" />
                Obras com Materiais Alugados
             </h2>
             <p className="text-slate-500">Materiais atualmente em posse das obras.</p>
          </div>
        </div>

        {activeProjects.length === 0 ? (
           <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 italic">
              Nenhuma obra com material alugado no momento.
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {activeProjects.map((cr) => (
              <div key={cr.code} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500 text-white font-bold rounded p-2 text-sm shadow-sm">
                      {cr.code}
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">{cr.name}</h3>
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    {cr.inventory.length} itens alugados
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3">Item / Detalhe</th>
                        <th className="px-6 py-3 text-center">Qtd</th>
                        <th className="px-6 py-3 text-right">Valor Unit.</th>
                        <th className="px-6 py-3 text-right">Total</th>
                        <th className="px-6 py-3">Documento (AV)</th>
                        <th className="px-6 py-3">Data Envio</th>
                        <th className="px-6 py-3 text-center">Dias Alugado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cr.inventory.map((item, idx) => (
                        <tr key={`${item.code}-${idx}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{item.code} - {item.name}</div>
                            <div className="text-xs text-gray-500">{item.detail}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-medium">
                            {item.quantity} <span className="text-xs text-gray-400">{item.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             R$ {item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-orange-600">
                             R$ {item.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.documentNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="flex items-center space-x-2">
                               <Calendar className="w-3 h-3" />
                               <span>{item.entryDate}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1 text-slate-600 font-medium bg-slate-100 rounded-full px-2 py-1 w-fit mx-auto">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{calculateDaysRented(item.entryDate)} dias</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: WAREHOUSE (483) */}
      {warehouse && warehouse.inventory.length > 0 && (
        <div className="pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-slate-700 flex items-center mb-4">
               <Warehouse className="w-5 h-5 mr-2 text-blue-500" />
               Estoque Central Disponível (483)
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
               <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                     <span className="font-bold text-blue-800 text-sm">483 - {warehouse.name}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Itens Disponíveis</span>
               </div>
               <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0">
                        <tr>
                           <th className="px-6 py-2">Item</th>
                           <th className="px-6 py-2 text-center">Disponível</th>
                           <th className="px-6 py-2 text-right">Valor Unit.</th>
                           <th className="px-6 py-2 text-right">Valor Total</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {warehouse.inventory.map((item, idx) => (
                           <tr key={`wh-${idx}`} className="hover:bg-gray-50">
                              <td className="px-6 py-2 font-medium text-gray-700">{item.code} - {item.name}</td>
                              <td className="px-6 py-2 text-center font-bold text-blue-600">{item.quantity} {item.unit}</td>
                              <td className="px-6 py-2 text-right text-gray-500">R$ {item.unitPrice.toFixed(2)}</td>
                              <td className="px-6 py-2 text-right font-medium text-gray-700">R$ {item.total.toFixed(2)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;