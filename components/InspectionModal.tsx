import React, { useState } from 'react';
import { Rental } from '../types';
import { X, AlertTriangle, CheckCircle, DollarSign, ClipboardCheck } from 'lucide-react';

interface InspectionModalProps {
    rental: Rental;
    onClose: () => void;
    onConfirm: (
        rentalId: string,
        data: {
            condition: 'OK' | 'DEFECTIVE';
            maintenanceCost: number;
            fineCost: number;
            notes: string
        }
    ) => void;
}

const InspectionModal: React.FC<InspectionModalProps> = ({ rental, onClose, onConfirm }) => {
    const [condition, setCondition] = useState<'OK' | 'DEFECTIVE'>('OK');
    const [maintenanceCost, setMaintenanceCost] = useState<string>('0');
    const [fineCost, setFineCost] = useState<string>('0');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        onConfirm(rental.id, {
            condition,
            maintenanceCost: Math.max(0, parseFloat(maintenanceCost) || 0),
            fineCost: Math.max(0, parseFloat(fineCost) || 0),
            notes
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <ClipboardCheck className="text-blue-600" size={20} />
                        Inspeção de Devolução
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-sm text-orange-800">
                        <p className="font-bold">{rental.equipmentName}</p>
                        <p className="text-xs mt-1 opacity-80">Devolvido em: {new Date(rental.returnDate!).toLocaleDateString('pt-BR')}</p>
                        {rental.returnNotes && (
                            <p className="text-xs mt-2 pt-2 border-t border-orange-200 italic">"Nota de Entrega: {rental.returnNotes}"</p>
                        )}
                    </div>

                    {/* Condição */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Condição do Material</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setCondition('OK')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${condition === 'OK'
                                    ? 'bg-green-50 border-green-500 text-green-700 font-bold'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <CheckCircle size={18} />
                                Aprovado
                            </button>
                            <button
                                onClick={() => setCondition('DEFECTIVE')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${condition === 'DEFECTIVE'
                                    ? 'bg-red-50 border-red-500 text-red-700 font-bold'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <AlertTriangle size={18} />
                                Com Avaria
                            </button>
                        </div>
                    </div>

                    {/* Custos Extras */}
                    {(condition === 'DEFECTIVE' || parseFloat(fineCost) > 0) && (
                        <div className="space-y-3 animate-in slide-in-from-top-2">
                            {condition === 'DEFECTIVE' && (
                                <div>
                                    <label className="block text-xs font-bold text-red-500 uppercase mb-1">Custo de Manutenção / Reparo (R$)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 text-red-400" size={16} />
                                        <input
                                            type="number"
                                            value={maintenanceCost}
                                            onChange={(e) => setMaintenanceCost(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-red-900 font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Multa (Sempre visível opcional) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Multa por Atraso / Outros (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="number"
                                value={fineCost}
                                onChange={(e) => setFineCost(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Observações da Inspeção */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações da Inspeção</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 text-sm h-20 resize-none"
                            placeholder="Detalhes técnicos da avaria ou inspeção..."
                        ></textarea>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md"
                    >
                        Concluir Inspeção
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InspectionModal;
