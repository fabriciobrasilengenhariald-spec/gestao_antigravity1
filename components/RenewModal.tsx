import React, { useState } from 'react';
import { Rental } from '../types';
import { X, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDate } from '../constants';

interface RenewModalProps {
    rental: Rental;
    onClose: () => void;
    onConfirm: (rentalId: string, newEndDate: string, notes: string) => void;
}

const RenewModal: React.FC<RenewModalProps> = ({ rental, onClose, onConfirm }) => {
    // Nova data sugerida: +30 dias a partir da data de vencimento original
    const defaultNewDate = () => {
        const base = new Date(rental.endDate);
        base.setDate(base.getDate() + 30);
        return base.toISOString().split('T')[0];
    };

    const [newEndDate, setNewEndDate] = useState(defaultNewDate());
    const [notes, setNotes] = useState('');

    const originalEnd = new Date(rental.endDate);
    const selected = new Date(newEndDate);
    const diffDays = Math.ceil((selected.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24));

    const handleSubmit = () => {
        if (!newEndDate) return;
        onConfirm(rental.id, newEndDate, notes);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0F1C2E] border border-[#01A4F1]/30 rounded-2xl shadow-2xl shadow-[#01A4F1]/10 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#01A4F1]/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#01A4F1]/20 border border-[#01A4F1]/30 flex items-center justify-center">
                            <RefreshCw size={16} className="text-[#01A4F1]" />
                        </div>
                        <h3 className="font-black text-white tracking-tight">Renovar Locação</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#94A3B8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* Info do equipamento */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <p className="font-black text-white text-sm tracking-tight">{rental.equipmentName}</p>
                        <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mt-1">
                            {rental.constructionSiteName}
                        </p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                            <div>
                                <p className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest">Vencimento Atual</p>
                                <p className="text-xs font-black text-[#FF6201] mt-0.5">{formatDate(rental.endDate)}</p>
                            </div>
                            <div className="text-[#94A3B8]">→</div>
                            <div>
                                <p className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest">Novo Vencimento</p>
                                <p className="text-xs font-black text-[#01A4F1] mt-0.5">
                                    {newEndDate ? formatDate(newEndDate) : '—'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Extensão em dias */}
                    {diffDays > 0 && (
                        <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl px-4 py-2.5">
                            <RefreshCw size={14} className="text-[#10B981]" />
                            <span className="text-[11px] font-black text-[#10B981] uppercase tracking-widest">
                                Extensão de +{diffDays} {diffDays === 1 ? 'dia' : 'dias'}
                            </span>
                        </div>
                    )}

                    {diffDays <= 0 && newEndDate && (
                        <div className="flex items-center gap-2 bg-[#FF6201]/10 border border-[#FF6201]/20 rounded-xl px-4 py-2.5">
                            <AlertCircle size={14} className="text-[#FF6201]" />
                            <span className="text-[11px] font-black text-[#FF6201] uppercase tracking-widest">
                                A nova data deve ser posterior ao vencimento atual
                            </span>
                        </div>
                    )}

                    {/* Nova Data de Vencimento */}
                    <div>
                        <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">
                            Nova Data de Devolução
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#01A4F1]" size={16} />
                            <input
                                type="date"
                                value={newEndDate}
                                min={new Date(rental.endDate).toISOString().split('T')[0]}
                                onChange={(e) => setNewEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl focus:ring-2 focus:ring-[#01A4F1]/50 focus:border-[#01A4F1]/50 outline-none text-white font-bold text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Motivo / Observações */}
                    <div>
                        <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">
                            Motivo da Renovação <span className="text-[#94A3B8]/50 normal-case font-bold">(opcional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 bg-white/5 border border-white/15 rounded-xl focus:ring-2 focus:ring-[#01A4F1]/50 focus:border-[#01A4F1]/50 outline-none text-white text-sm h-20 resize-none transition-all placeholder-[#94A3B8]/40 font-medium"
                            placeholder="Ex: Obra atrasada, engenheiro solicitou mais 30 dias..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white/3 border-t border-white/10 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-white/15 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!newEndDate || diffDays <= 0}
                        className="flex-1 px-4 py-2.5 bg-[#01A4F1] text-white rounded-xl hover:brightness-110 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#01A4F1]/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                    >
                        <RefreshCw size={14} />
                        Confirmar Renovação
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RenewModal;
