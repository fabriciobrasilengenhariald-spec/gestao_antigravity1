import React from 'react';
import { Rental, RentalStatus } from '../types';
import { TrendingUp, AlertTriangle, Calendar, DollarSign, Activity, Truck, Building2 } from 'lucide-react';
import { formatDate, formatCurrencyAxis } from '../constants';

interface DashboardProps {
  rentals: Rental[];
}

const Dashboard: React.FC<DashboardProps> = ({ rentals }) => {
  // Somente aluguéis que NÃO foram devolvidos
  const pendingRentals = rentals.filter(r => r.status !== RentalStatus.RETURNED);

  // Custo somando apenas o que ainda está ativo
  const activeSpend = pendingRentals.reduce((acc, curr) => acc + curr.orderTotal, 0);

  const activeCount = rentals.filter(r => r.status === RentalStatus.ACTIVE).length;
  const overdueCount = rentals.filter(r => r.status === RentalStatus.OVERDUE).length;
  const expiringCount = rentals.filter(r => r.status === RentalStatus.EXPIRING_SOON).length;


  const StatCard = ({ title, value, icon: Icon, gradient, textColor = "text-white", subtext }: any) => (
    <div className={`glass-panel p-6 rounded-2xl relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${gradient} bg-opacity-20`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">{title}</p>
          </div>
          <h3 className={`text-3xl font-bold ${textColor} mt-2 tracking-tight`}>{value}</h3>
        </div>
        {subtext && <div className="mt-4">{subtext}</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md ring-white/10">Visão Geral</h2>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            🔄 Verificar Vencimentos
          </button>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">Atualizado Agora</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Custo Total */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-l-4 border-l-cyan-500">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Custo Total (Ativos)</p>
              <h3 className="text-3xl font-bold text-white">R$ {activeSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[10px] text-cyan-400 font-bold uppercase tracking-widest gap-2">
            <TrendingUp size={12} />
            <span>Fluxo de Caixa Ativo</span>
          </div>
        </div>

        {/* Aluguéis Ativos */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-l-4 border-l-blue-600">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Aluguéis Ativos</p>
              <h3 className="text-3xl font-bold text-white">{activeCount}</h3>
            </div>
            <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[10px] text-blue-400 font-bold uppercase tracking-widest gap-2">
            <Truck size={12} />
            <span>Equipamentos em Campo</span>
          </div>
        </div>

        {/* Vencem em 24h */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Vencem em 24h</p>
              <h3 className="text-3xl font-bold text-white">{expiringCount}</h3>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <Calendar size={24} />
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-8 h-8 rounded-lg border border-orange-500/30 flex items-center justify-center ${i <= expiringCount ? 'text-orange-400 bg-orange-500/10' : 'text-slate-700'}`}>
                <Calendar size={14} />
              </div>
            ))}
          </div>
        </div>

        {/* Atrasados */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-l-4 border-l-red-500">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Atrasados</p>
              <h3 className="text-3xl font-bold text-white">{overdueCount}</h3>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[10px] text-red-400 font-bold uppercase tracking-widest gap-2">
            <AlertTriangle size={12} />
            <span>Ação Necessária</span>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Status das Devoluções - Full Width */}
        <div className="glass-panel p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Status das Devoluções</h3>
              <p className="text-sm text-slate-500 font-medium">Controle detalhado de equipamentos em campo</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                <span>EM DIA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500/50"></div>
                <span>PRÓXIMO</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <span>ATRASADO</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
              <div className="col-span-4">Equipamento / Obra</div>
              <div className="col-span-3">Fornecedor</div>
              <div className="col-span-2 text-center">Valor / Unidade</div>
              <div className="col-span-2 text-center">Data Limite</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            {rentals
              .filter(r => r.status !== RentalStatus.RETURNED)
              .map((rental) => (
                <div key={rental.id} className="grid grid-cols-12 items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                  {/* Equipamento */}
                  <div className="col-span-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${rental.status === RentalStatus.ACTIVE ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                      rental.status === RentalStatus.EXPIRING_SOON ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                        'bg-red-500/20 text-red-400 border border-red-500/20'
                      }`}>
                      <Truck size={24} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-white truncate leading-tight">{rental.equipmentName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 size={10} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">{rental.constructionSiteName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fornecedor */}
                  <div className="col-span-3 flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-300 truncate">{rental.supplierName}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Parceiro Homologado</span>
                  </div>

                  {/* Valor */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">R$ {rental.orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">por {rental.unit}</span>
                    </div>
                  </div>

                  {/* Data */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-300">{formatDate(rental.endDate)}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Calendar size={10} />
                        <span>Previsão</span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex justify-end">
                    <span className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-lg border shadow-sm ${rental.status === RentalStatus.ACTIVE ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      rental.status === RentalStatus.EXPIRING_SOON ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                      {rental.status === RentalStatus.ACTIVE ? 'OK' :
                        rental.status === RentalStatus.EXPIRING_SOON ? 'CRÍTICO' : 'ATRASADO'}
                    </span>
                  </div>
                </div>
              ))}

            {rentals.filter(r => r.status !== RentalStatus.RETURNED).length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center opacity-50 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-white/5">
                  <Truck size={40} className="text-slate-600" />
                </div>
                <h4 className="text-white font-bold">Nenhum aluguel pendente</h4>
                <p className="text-sm text-slate-500">Todos os equipamentos estão com a devolução em dia ou devolvidos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;
