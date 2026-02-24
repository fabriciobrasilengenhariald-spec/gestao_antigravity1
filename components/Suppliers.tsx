import React, { useState } from 'react';
import { Supplier, Rental, RentalStatus } from '../types';
import { MapPin, Building, History, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { formatDate } from '../constants';

interface SuppliersProps {
  suppliers: Supplier[];
  rentals: Rental[]; // Agora precisamos dos aluguéis para calcular o histórico
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, rentals }) => {
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedSupplierId === id) {
      setExpandedSupplierId(null);
    } else {
      setExpandedSupplierId(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Banco de Fornecedores</h2>

      {suppliers.filter(sup => rentals.some(r => r.supplierId === sup.id)).length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Building size={32} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">Nenhum fornecedor com notas cadastradas.</p>
          <p className="text-xs text-slate-500 mt-1">Cadastre um novo aluguel para que o fornecedor apareça aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suppliers
            .filter(sup => rentals.some(r => r.supplierId === sup.id))
            .map(sup => {
              const supplierRentals = rentals.filter(r => r.supplierId === sup.id);
              const totalVolume = supplierRentals.reduce((acc, r) => acc + r.orderTotal + (r.maintenanceCost || 0) + (r.fineCost || 0), 0);
              const activeCount = supplierRentals.filter(r => r.status !== RentalStatus.RETURNED).length;
              const isExpanded = expandedSupplierId === sup.id;

              return (
                <div key={sup.id} className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 border ${isExpanded ? 'border-[#01A4F1]/40 ring-1 ring-[#01A4F1]/20' : 'border-white/10'}`}>
                  <div
                    className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer transition-colors ${isExpanded ? 'bg-[#01A4F1]/5' : 'hover:bg-white/5'}`}
                    onClick={() => toggleExpand(sup.id)}
                  >
                    <div className="flex gap-5 items-center">
                      <div className="p-4 bg-[#01A4F1]/10 rounded-xl text-[#01A4F1] border border-[#01A4F1]/20 shadow-[0_0_15px_rgba(1,164,241,0.1)]">
                        <Building size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-xl tracking-tight">{sup.name}</h3>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-[10px] font-black bg-white/5 px-2.5 py-1 rounded-lg text-[#01A4F1] border border-white/10 uppercase tracking-wider">CNPJ: {sup.cnpj}</span>
                          <span className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-medium">
                            <MapPin size={14} className="text-[#01A4F1]/60" /> {sup.address} - {sup.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 mt-6 md:mt-0">
                      <div className="text-right">
                        <p className="text-[10px] text-[#01A4F1] uppercase font-black tracking-widest mb-1">Volume Total</p>
                        <p className="font-black text-white text-2xl tracking-tighter">R$ {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right hidden md:block border-l border-white/10 pl-8">
                        <p className="text-[10px] text-[#94A3B8] uppercase font-black tracking-widest mb-1">Aluguéis</p>
                        <p className="font-bold text-white text-xl">{supplierRentals.length} <span className="text-xs text-[#01A4F1]/60 font-black">({activeCount} ativos)</span></p>
                      </div>
                      <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-[#01A4F1]/20 text-[#01A4F1] rotate-180' : 'text-slate-500 bg-white/5'}`}>
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Área Expandida - Histórico */}
                  {isExpanded && (
                    <div className="bg-black/40 border-t border-white/10 p-8 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-black text-white text-lg flex items-center gap-2 uppercase tracking-tight">
                          <History size={20} className="text-cyan-400" />
                          Histórico de Aluguéis
                        </h4>
                        <div className="h-px flex-1 mx-6 bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
                      </div>

                      {supplierRentals.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-white/5">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] bg-white/5 border-b border-white/10">
                                <th className="py-5 text-left px-6">Data</th>
                                <th className="py-5 text-left px-6">Devolução</th>
                                <th className="py-5 text-left px-6">Obra</th>
                                <th className="py-5 text-left px-6">Item</th>
                                <th className="py-5 text-right px-6">Aluguel</th>
                                <th className="py-5 text-right px-6">Reparo</th>
                                <th className="py-5 text-right px-6">Multa</th>
                                <th className="py-5 text-right px-6 text-cyan-400">Total</th>
                                <th className="py-5 text-center px-6">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {supplierRentals.map(r => (
                                <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                                  <td className="py-5 text-xs text-slate-400 px-6 whitespace-nowrap font-medium">{formatDate(r.startDate)}</td>
                                  <td className="py-5 text-xs text-slate-300 px-6 whitespace-nowrap font-black">
                                    {r.status === RentalStatus.RETURNED && r.returnDate ? formatDate(r.returnDate) : '-'}
                                  </td>
                                  <td className="py-5 px-6">
                                    <p className="text-xs font-black text-white min-w-[140px]">{r.constructionSiteName}</p>
                                  </td>
                                  <td className="py-5 px-6">
                                    <p className="text-xs text-slate-400 font-medium min-w-[200px]">{r.equipmentName}</p>
                                  </td>

                                  <td className="py-5 text-right font-mono text-xs text-slate-300 px-6 bg-white/[0.02]">
                                    R$ {r.orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className={`py-5 text-right font-mono text-xs px-6 bg-white/[0.02] ${r.maintenanceCost ? 'text-red-400 font-black' : 'text-slate-600'}`}>
                                    R$ {(r.maintenanceCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className={`py-5 text-right font-mono text-xs px-6 bg-white/[0.02] ${r.fineCost ? 'text-orange-400 font-black' : 'text-slate-600'}`}>
                                    R$ {(r.fineCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>

                                  <td className="py-5 text-right px-6 bg-cyan-500/5">
                                    <span className="font-mono text-sm font-black text-white whitespace-nowrap drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                                      R$ {(r.orderTotal + (r.maintenanceCost || 0) + (r.fineCost || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </td>

                                  <td className="py-5 text-center px-6">
                                    {r.status === RentalStatus.RETURNED ?
                                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-white/5 text-slate-500 border border-white/10 uppercase tracking-tighter">Devolvido</span> :
                                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)] uppercase tracking-tighter">Ativo</span>
                                    }
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-sm text-slate-500 font-medium">Nenhum histórico encontrado para este fornecedor.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  );
};

export default Suppliers;

