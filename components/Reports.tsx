import React, { useState } from 'react';
import { Rental, RentalStatus, Engineer } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, Hammer, DollarSign, Building, X, Calendar, Building2, Trophy, LayoutGrid, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, formatCurrencyAxis } from '../constants';

interface ReportsProps {
    rentals: Rental[];
    engineers: Engineer[];
}

const Reports: React.FC<ReportsProps> = ({ rentals, engineers }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'engineers' | 'equipment'>('overview');
    const [selectedSiteForDefects, setSelectedSiteForDefects] = useState<string | null>(null);
    const [selectedEngineerForDefects, setSelectedEngineerForDefects] = useState<{ id: string, name: string } | null>(null);
    const [showAllSites, setShowAllSites] = useState(false);

    // AGGREGAÇÃO DE DADOS
    const totalRentals = rentals.length;
    const totalSpent = rentals.reduce((acc, r) => acc + r.orderTotal, 0);

    const totalMaintenance = rentals.reduce((acc, r) => acc + Math.max(0, r.maintenanceCost || 0), 0);
    const totalFines = rentals.reduce((acc, r) => acc + Math.max(0, r.fineCost || 0), 0);
    const totalExtraCosts = totalMaintenance + totalFines;

    const defectiveCount = rentals.filter(r => r.returnCondition === 'DEFECTIVE' || (r.maintenanceCost || 0) > 0).length;
    const defectRate = totalRentals > 0 ? (defectiveCount / totalRentals) * 100 : 0;

    // DADOS POR OBRA
    const sitesData = Object.values(rentals.reduce((acc: any, r) => {
        if (!acc[r.constructionSiteName]) {
            acc[r.constructionSiteName] = {
                name: r.constructionSiteName,
                totalSpent: 0,
                extraCosts: 0,
                defectCount: 0,
                items: 0
            };
        }
        acc[r.constructionSiteName].totalSpent += r.orderTotal;
        const extra = (r.maintenanceCost || 0) + (r.fineCost || 0);
        acc[r.constructionSiteName].extraCosts += Math.max(0, extra);
        acc[r.constructionSiteName].items += 1;
        if (r.returnCondition === 'DEFECTIVE' || (r.maintenanceCost || 0) > 0) {
            acc[r.constructionSiteName].defectCount += 1;
        }
        return acc;
    }, {}));

    // DADOS POR ENGENHEIRO
    const engineersData = engineers.map(eng => {
        const engineerRentals = rentals.filter(r => r.engineerId === eng.id);
        const defects = engineerRentals.filter(r => r.returnCondition === 'DEFECTIVE' || (r.maintenanceCost || 0) > 0).length;
        const maintenance = engineerRentals.reduce((acc, r) => acc + Math.max(0, r.maintenanceCost || 0), 0);

        return {
            id: eng.id,
            name: eng.name,
            totalRentals: engineerRentals.length,
            defects,
            maintenanceCost: maintenance
        };
    }).filter(e => e.totalRentals > 0);

    // RANKING DE EQUIPAMENTOS
    const equipmentData = Object.values(rentals.reduce((acc: any, r) => {
        if (!acc[r.equipmentName]) {
            acc[r.equipmentName] = {
                name: r.equipmentName,
                count: 0,
                totalSpent: 0
            };
        }
        acc[r.equipmentName].count += 1;
        acc[r.equipmentName].totalSpent += r.orderTotal;
        return acc;
    }, {}))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5); // Top 5 mais alugados


    const COLORS = ['#01A4F1', '#0067B4', '#10B981', '#F59E0B', '#FF6201'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">Relatórios Gerenciais</h2>

                <div className="flex bg-[#0F1720] p-1.5 rounded-xl border border-white/5 shadow-inner">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 ${activeTab === 'overview' ? 'bg-[#01A4F1] text-white shadow-[0_0_15px_rgba(1,164,241,0.3)]' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('sites')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 ${activeTab === 'sites' ? 'bg-[#01A4F1] text-white shadow-[0_0_15px_rgba(1,164,241,0.3)]' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}`}
                    >
                        Por Obra
                    </button>
                    <button
                        onClick={() => setActiveTab('engineers')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 ${activeTab === 'engineers' ? 'bg-[#01A4F1] text-white shadow-[0_0_15px_rgba(1,164,241,0.3)]' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}`}
                    >
                        Engenheiros
                    </button>
                    <button
                        onClick={() => setActiveTab('equipment')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 ${activeTab === 'equipment' ? 'bg-[#01A4F1] text-white shadow-[0_0_15px_rgba(1,164,241,0.3)]' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}`}
                    >
                        Equipamentos
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Cards de KPI */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-[#01A4F1]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Total em Aluguéis</p>
                                    <h3 className="text-2xl font-black text-white mt-1">R$ {totalSpent.toLocaleString('pt-BR')}</h3>
                                </div>
                                <div className="p-2 bg-[#01A4F1]/10 text-[#01A4F1] rounded-lg border border-[#01A4F1]/20"><DollarSign size={20} /></div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-[#FF6201]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-[#FF6201] uppercase tracking-widest">Custos Extras</p>
                                    <h3 className="text-2xl font-black text-white mt-1">R$ {totalExtraCosts.toLocaleString('pt-BR')}</h3>
                                </div>
                                <div className="p-2 bg-[#FF6201]/10 text-[#FF6201] rounded-lg border border-[#FF6201]/20"><TrendingUp size={20} /></div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-[#F59E0B]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Taxa de Defeitos</p>
                                    <h3 className="text-2xl font-bold text-white mt-1">{defectRate.toFixed(1)}%</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{defectiveCount} itens com avaria</p>
                                </div>
                                <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20"><AlertTriangle size={20} /></div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-slate-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Itens</p>
                                    <h3 className="text-2xl font-bold text-white mt-1">{totalRentals}</h3>
                                </div>
                                <div className="p-2 bg-slate-500/10 text-slate-400 rounded-lg border border-slate-500/20"><Hammer size={20} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-panel p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Trophy className="text-yellow-400" size={20} />
                                    <h3 className="text-lg font-bold text-white">Ranking de Obras por Investimento</h3>
                                </div>
                                <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">
                                    {(sitesData as any[]).length} {(sitesData as any[]).length === 1 ? 'obra' : 'obras'}
                                </span>
                            </div>

                            {(() => {
                                const sorted = [...(sitesData as any[])].sort((a, b) => b.totalSpent - a.totalSpent);
                                const maxVal = sorted.length > 0 ? sorted[0].totalSpent : 1;
                                const visible = showAllSites ? sorted : sorted.slice(0, 5);

                                const medalColors: Record<number, string> = {
                                    0: 'bg-yellow-400 text-yellow-900',
                                    1: 'bg-slate-300 text-slate-700',
                                    2: 'bg-orange-400 text-orange-900',
                                };

                                return (
                                    <>
                                        <div className={`space-y-3 ${showAllSites ? 'max-h-[320px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                                            {visible.map((site: any, idx: number) => {
                                                const pct = maxVal > 0 ? (site.totalSpent / maxVal) * 100 : 0;
                                                return (
                                                    <div key={site.name} className="group flex items-center gap-3 hover:bg-white/5 rounded-xl px-2 py-1.5 transition-all">
                                                        {/* Posição / Medalha */}
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${medalColors[idx] || 'bg-white/10 text-[#94A3B8]'
                                                            }`}>
                                                            {idx + 1}º
                                                        </div>

                                                        {/* Nome + Barra + Valor */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className="text-xs font-bold text-white truncate mr-3 group-hover:text-[#01A4F1] transition-colors" title={site.name}>
                                                                    {site.name}
                                                                </p>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">
                                                                        {site.items} {site.items === 1 ? 'item' : 'itens'}
                                                                    </span>
                                                                    <span className="text-xs font-black text-white">
                                                                        R$ {site.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {/* Barra proporcional */}
                                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                                                    style={{
                                                                        width: `${Math.max(pct, 2)}%`,
                                                                        background: idx === 0
                                                                            ? 'linear-gradient(90deg, #01A4F1, #0067B4)'
                                                                            : idx === 1
                                                                                ? 'linear-gradient(90deg, #01A4F1cc, #0067B4cc)'
                                                                                : 'linear-gradient(90deg, #01A4F199, #0067B499)'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Botão Ver Todas / Recolher */}
                                        {sorted.length > 5 && (
                                            <button
                                                onClick={() => setShowAllSites(!showAllSites)}
                                                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-black text-[#01A4F1] uppercase tracking-widest hover:bg-[#01A4F1]/10 rounded-xl border border-[#01A4F1]/20 transition-all"
                                            >
                                                {showAllSites ? (
                                                    <><ChevronUp size={14} /> Mostrar Top 5</>
                                                ) : (
                                                    <><ChevronDown size={14} /> Ver Todas ({sorted.length})</>
                                                )}
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-6">Composição de Custos Extras</h3>
                            <div className="h-64 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Manutenção', value: totalMaintenance },
                                                { name: 'Multas', value: totalFines }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="#ef4444" /> {/* Manutenção */}
                                            <Cell fill="#f97316" /> {/* Multas */}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-wider mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                    <span className="text-slate-300">Manutenção: R$ {totalMaintenance.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                    <span className="text-slate-300">Multas: R$ {totalFines.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ranking de Equipamentos mais alugados */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <Trophy className="text-yellow-400" size={24} />
                            <h3 className="font-bold text-white text-lg tracking-tight">Top 5 Equipamentos com Maior Demanda</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Lista de Ranking */}
                            <div className="space-y-4">
                                {equipmentData.map((item: any, index: number) => (
                                    <div key={item.name} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${index === 0 ? 'bg-yellow-400' :
                                            index === 1 ? 'bg-slate-300' :
                                                index === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                            {index + 1}º
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate" title={item.name}>{item.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">{item.count} Aluguéis Registrados</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Investimento</p>
                                            <p className="font-bold text-slate-900 text-sm">R$ {item.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Gráfico de Barras Mini */}
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={equipmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" hide />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={10}
                                            axisLine={false}
                                            tickLine={false}
                                            domain={[0, 'auto']}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar dataKey="count" name="Qtd. Aluguéis" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20 flex items-start gap-4">
                            <Activity className="text-cyan-400 shrink-0 mt-1" size={20} />
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                <span className="text-cyan-400 font-black uppercase tracking-tighter mr-2">Insight de Gestão:</span>
                                Analisar o ranking ajuda a identificar ferramentas que aparecem em múltiplas obras simultaneamente. Se o ticket médio de aluguel for alto, considere a **aquisição própria** para reduzir o Capex a longo prazo.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sites' && (
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-white/5 text-slate-400 uppercase font-black text-[10px] tracking-widest border-b border-white/10">
                            <tr>
                                <th className="px-6 py-5">Obra</th>
                                <th className="px-6 py-5 text-center">Itens Alugados</th>
                                <th className="px-6 py-5 text-center">Gasto Aluguel</th>
                                <th className="px-6 py-5 text-center text-red-400">Gasto Extra</th>
                                <th className="px-6 py-5 text-center">Avarias</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sitesData.map((site: any) => (
                                <tr key={site.name} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5 font-bold text-white group-hover:text-cyan-400 transition-all border-l-4 border-transparent group-hover:border-cyan-500">
                                        {site.name}
                                    </td>
                                    <td className="px-6 py-5 text-center text-slate-300 font-medium">{site.items}</td>
                                    <td className="px-6 py-5 text-center text-slate-300 font-mono">R$ {site.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-5 text-center font-bold text-red-400 font-mono">R$ {site.extraCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-5 text-center">
                                        {site.defectCount > 0 ? (
                                            <button
                                                onClick={() => setSelectedSiteForDefects(site.name)}
                                                className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-red-500/30 transition-all flex items-center gap-1 mx-auto"
                                                title="Clique para ver detalhes das avarias"
                                            >
                                                <AlertTriangle size={12} />
                                                {site.defectCount} {site.defectCount === 1 ? 'Avaria' : 'Avarias'}
                                            </button>
                                        ) : (
                                            <span className="text-slate-600 font-bold tracking-widest">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'engineers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {engineersData.map((eng: any) => (
                        <div key={eng.name} className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center group border border-white/5 hover:border-cyan-500/30 transition-all">
                            <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl mb-6 shadow-[0_10px_20px_rgba(6,182,212,0.3)] transition-transform group-hover:scale-110">
                                {eng.name.charAt(0)}
                            </div>
                            <h3 className="font-black text-white text-xl tracking-tight">{eng.name}</h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 mb-8">Engenheiro Responsável</p>

                            <div className="w-full grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Aluguéis</p>
                                    <p className="font-black text-white text-2xl mt-1">{eng.totalRentals}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Defeitos</p>
                                    {eng.defects > 0 ? (
                                        <button
                                            onClick={() => setSelectedEngineerForDefects({ id: eng.id, name: eng.name })}
                                            className="font-black text-2xl text-red-500 hover:scale-110 transition-transform cursor-pointer mt-1"
                                            title="Ver detalhes das avarias deste engenheiro"
                                        >
                                            {eng.defects}
                                        </button>
                                    ) : (
                                        <p className="font-black text-2xl text-green-500 mt-1">{eng.defects}</p>
                                    )}
                                </div>
                            </div>

                            {eng.maintenanceCost > 0 && (
                                <div className="mt-8 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest w-full shadow-lg">
                                    R$ {eng.maintenanceCost.toLocaleString()} em reparos
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'equipment' && (
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl animate-in slide-in-from-right-4">
                    <div className="p-8 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <h3 className="font-black text-white text-lg flex items-center gap-3 tracking-tight">
                            <LayoutGrid size={24} className="text-cyan-400" />
                            Relatório Detalhado de Necessidades
                        </h3>
                        <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">Ordenado por Frequência</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-white/5 border-b border-white/10">
                                    <th className="py-5 text-left px-8">Equipamento</th>
                                    <th className="py-5 text-center px-4">Frequência</th>
                                    <th className="py-5 text-right px-4">Investimento Base</th>
                                    <th className="py-5 text-right px-8">Ticket Médio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Object.values(rentals.reduce((acc: any, r) => {
                                    if (!acc[r.equipmentName]) {
                                        acc[r.equipmentName] = { name: r.equipmentName, count: 0, total: 0 };
                                    }
                                    acc[r.equipmentName].count += 1;
                                    acc[r.equipmentName].total += r.orderTotal;
                                    return acc;
                                }, {})).sort((a: any, b: any) => b.count - a.count).map((item: any) => (
                                    <tr key={item.name} className="hover:bg-white/5 transition-colors group">
                                        <td className="py-5 px-8 font-black text-white group-hover:text-cyan-400 transition-colors">{item.name}</td>
                                        <td className="py-5 text-center px-4">
                                            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                                {item.count} Locações
                                            </span>
                                        </td>
                                        <td className="py-5 text-right px-4 font-mono text-slate-400">
                                            R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-5 text-right px-8 font-mono font-black text-white">
                                            R$ {(item.total / item.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Detalhes de Defeitos por Obra */}
            {selectedSiteForDefects && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Histórico de Avarias</h3>
                                <p className="text-sm text-slate-500">{selectedSiteForDefects}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSiteForDefects(null)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                {rentals
                                    .filter(r => r.constructionSiteName === selectedSiteForDefects && (r.returnCondition === 'DEFECTIVE' || (r.maintenanceCost || 0) > 0))
                                    .map(r => (
                                        <div key={r.id} className="border border-red-100 rounded-xl p-4 bg-red-50/30 flex flex-col md:flex-row justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900">{r.equipmentName}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1"><Building2 size={12} /> {r.supplierName}</span>
                                                    <span className="flex items-center gap-1"><Calendar size={12} /> Devolvido em: {formatDate(r.returnDate)}</span>
                                                </div>
                                                {r.returnNotes && (
                                                    <div className="mt-2 text-sm text-slate-700 bg-white/50 p-2 rounded border border-red-50 italic">
                                                        "{r.returnNotes}"
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right flex flex-col justify-center min-w-[120px]">
                                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Custo de Reparo</p>
                                                <p className="text-lg font-bold text-red-600">
                                                    R$ {(r.maintenanceCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedSiteForDefects(null)}
                                className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalhes de Defeitos por Eng */}
            {selectedEngineerForDefects && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Avarias sob Responsabilidade</h3>
                                <p className="text-sm text-slate-500">Eng: {selectedEngineerForDefects.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedEngineerForDefects(null)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                {rentals
                                    .filter(r => r.engineerId === selectedEngineerForDefects.id && (r.returnCondition === 'DEFECTIVE' || (r.maintenanceCost || 0) > 0))
                                    .map(r => (
                                        <div key={r.id} className="border border-red-100 rounded-xl p-4 bg-red-50/30 flex flex-col md:flex-row justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{r.constructionSiteName}</span>
                                                </div>
                                                <p className="font-bold text-slate-900">{r.equipmentName}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1"><Building2 size={12} /> {r.supplierName}</span>
                                                    <span className="flex items-center gap-1"><Calendar size={12} /> Devolvido em: {formatDate(r.returnDate)}</span>
                                                </div>
                                                {r.returnNotes && (
                                                    <div className="mt-2 text-sm text-slate-700 bg-white/50 p-2 rounded border border-red-50 italic">
                                                        "{r.returnNotes}"
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right flex flex-col justify-center min-w-[120px]">
                                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Custo de Reparo</p>
                                                <p className="text-lg font-bold text-red-600">
                                                    R$ {(r.maintenanceCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedEngineerForDefects(null)}
                                className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
