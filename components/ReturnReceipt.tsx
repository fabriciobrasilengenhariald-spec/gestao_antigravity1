import React from 'react';
import { Rental, Engineer } from '../types';
import { formatDate } from '../constants';

interface ReturnReceiptProps {
    rental: Rental;
    engineers: Engineer[];
    onClose: () => void;
}

const ReturnReceipt: React.FC<ReturnReceiptProps> = ({ rental, engineers, onClose }) => {
    const engineer = engineers.find(e => e.id === rental.engineerId);
    // Auto-print on mount
    React.useEffect(() => {
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    const totalExtras = (rental.maintenanceCost || 0) + (rental.fineCost || 0);
    const finalTotal = rental.orderTotal + totalExtras;

    return (
        <div className="fixed inset-0 bg-white z-[9999] overflow-auto">
            <div className="max-w-3xl mx-auto p-10 print:p-0">

                {/* Header sem print para UX */}
                <div className="print:hidden flex justify-between items-center mb-8 bg-slate-100 p-4 rounded-lg">
                    <p className="text-sm text-slate-500">Este documento está pronto para impressão.</p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900"
                    >
                        Fechar / Voltar
                    </button>
                </div>

                {/* Documento Real Impresso */}
                <div className="border border-slate-300 p-12 bg-white shadow-none" id="printable-area">

                    {/* Cabeçalho do Recibo */}
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter">Recibo de Devolução</h1>
                            <p className="text-slate-500 mt-1">Comprovante de Encerramento de Aluguel</p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-sm text-slate-400">ID: #{rental.id.slice(-6)}</p>
                            <p className="font-bold text-slate-900 mt-1">{formatDate(new Date().toISOString().split('T')[0])}</p>
                        </div>
                    </div>

                    {/* Corpo principal */}
                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Obra / Local</h3>
                            <p className="text-lg font-bold text-slate-900">{rental.constructionSiteName}</p>
                            <p className="text-sm text-slate-600 mt-1">Responsável: {engineer?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Fornecedor</h3>
                            <p className="text-lg font-bold text-slate-900">{rental.supplierName}</p>
                            <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                <p>Início: {formatDate(rental.startDate)}</p>
                                <p>Fim: {formatDate(rental.returnDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Itens */}
                    <table className="w-full mb-12">
                        <thead>
                            <tr className="border-b border-slate-200 text-left">
                                <th className="py-2 text-xs font-bold text-slate-500 uppercase">Descrição</th>
                                <th className="py-2 text-xs font-bold text-slate-500 uppercase text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-4">
                                    <p className="font-bold text-slate-900">{rental.equipmentName}</p>
                                    <p className="text-sm text-slate-500">Aluguel Base ({rental.quantity} {rental.unit})</p>
                                </td>
                                <td className="py-4 text-right font-medium text-slate-900">
                                    R$ {rental.orderTotal.toFixed(2)}
                                </td>
                            </tr>

                            {/* Custos Extras */}
                            {(rental.maintenanceCost || 0) > 0 && (
                                <tr className="bg-red-50 print:bg-transparent">
                                    <td className="py-4 pl-2">
                                        <p className="font-bold text-red-700 print:text-black">Manutenção / Reparo</p>
                                        <p className="text-sm text-red-500 print:text-slate-500">Cobrança por avaria/defeito identificado na devolução</p>
                                    </td>
                                    <td className="py-4 text-right font-bold text-red-700 print:text-black">
                                        + R$ {rental.maintenanceCost?.toFixed(2)}
                                    </td>
                                </tr>
                            )}

                            {(rental.fineCost || 0) > 0 && (
                                <tr className="bg-orange-50 print:bg-transparent">
                                    <td className="py-4 pl-2">
                                        <p className="font-bold text-orange-700 print:text-black">Multa / Atraso</p>
                                    </td>
                                    <td className="py-4 text-right font-bold text-orange-700 print:text-black">
                                        + R$ {rental.fineCost?.toFixed(2)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-800">
                            <tr>
                                <td className="py-4 pt-6 text-xl font-bold text-slate-900">Total Final</td>
                                <td className="py-4 pt-6 text-xl font-bold text-slate-900 text-right">
                                    R$ {finalTotal.toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Observações */}
                    {rental.returnNotes && (
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-12 print:border-slate-300">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Observações da Devolução</h3>
                            <p className="text-slate-700">{rental.returnNotes}</p>
                        </div>
                    )}

                    {/* Assinaturas */}
                    <div className="grid grid-cols-2 gap-12 mt-20 pt-8">
                        <div className="border-t border-slate-400 pt-2 text-center">
                            <p className="text-sm font-bold text-slate-900">Responsável Obra</p>
                        </div>
                        <div className="border-t border-slate-400 pt-2 text-center">
                            <p className="text-sm font-bold text-slate-900">Responsável Fornecedor</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReturnReceipt;
