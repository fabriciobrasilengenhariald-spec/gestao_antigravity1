import React, { useState } from 'react';
import { Rental, RentalStatus } from '../types';
import { X, Calendar } from 'lucide-react';

interface ReturnModalProps {
    rental: Rental;
    onClose: () => void;
    onConfirm: (
        rentalId: string,
        data: {
            returnDate: string;
            notes: string
        }
    ) => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ rental, onClose, onConfirm }) => {
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        onConfirm(rental.id, {
            returnDate,
            notes
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Devolver Equipamento</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                        <p className="font-bold">{rental.equipmentName}</p>
                        <p className="text-xs mt-1 opacity-80">Obra: {rental.constructionSiteName}</p>
                    </div>

                    {/* Data Devolução */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data da Devolução</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações de Recebimento</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 text-sm h-20 resize-none"
                            placeholder="Nome do entregador, horário, etc..."
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
                        Confirmar Devolução
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnModal;
