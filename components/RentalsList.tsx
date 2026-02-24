import React, { useState } from 'react';
import { Rental, RentalStatus, Engineer } from '../types';
import { AlertCircle, CheckCircle, Clock, Send, Printer, ClipboardCheck, RefreshCw } from 'lucide-react';
import { formatDate } from '../constants';
import ReturnModal from './ReturnModal';
import InspectionModal from './InspectionModal';
import ReturnReceipt from './ReturnReceipt';
import RenewModal from './RenewModal';

interface RentalsListProps {
  rentals: Rental[];
  engineers: Engineer[];
  onUpdateStatus: (id: string, newStatus: RentalStatus, extras?: any) => void;
  onRenewRental: (id: string, newEndDate: string, notes: string) => void;
}

const RentalsList: React.FC<RentalsListProps> = ({ rentals, engineers, onUpdateStatus, onRenewRental }) => {
  const [selectedRentalForReturn, setSelectedRentalForReturn] = useState<Rental | null>(null);
  const [selectedRentalForInspection, setSelectedRentalForInspection] = useState<Rental | null>(null);
  const [receiptRental, setReceiptRental] = useState<Rental | null>(null);
  const [selectedRentalForRenew, setSelectedRentalForRenew] = useState<Rental | null>(null);

  const getEngineer = (id?: string) => engineers.find(e => e.id === id);

  const handleNotify = (rental: Rental) => {
    const eng = getEngineer(rental.engineerId);
    if (eng && eng.telegramHandle) {
      const cleanHandle = eng.telegramHandle.replace('@', '').trim();
      window.open(`https://t.me/${cleanHandle}`, '_blank');
    } else {
      alert('Nenhum engenheiro vinculado ou Telegram não cadastrado.');
    }
  };

  const handleConfirmReturn = (rentalId: string, data: any) => {
    onUpdateStatus(rentalId, RentalStatus.RETURNED, data);
    setSelectedRentalForReturn(null);
  };

  const handleConfirmInspection = (rentalId: string, data: any) => {
    onUpdateStatus(rentalId, RentalStatus.RETURNED, {
      returnCondition: data.condition,
      maintenanceCost: data.maintenanceCost,
      fineCost: data.fineCost,
      returnNotes: data.notes
    });
    setSelectedRentalForInspection(null);
  };

  const getStatusBadge = (status: RentalStatus, rental: Rental) => {
    switch (status) {
      case RentalStatus.ACTIVE:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 uppercase tracking-widest leading-none"><CheckCircle size={12} strokeWidth={3} /> Ativo</span>;
      case RentalStatus.EXPIRING_SOON:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 uppercase tracking-widest leading-none"><Clock size={12} strokeWidth={3} /> Vence Logo</span>;
      case RentalStatus.OVERDUE:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-[#FF6201]/10 text-[#FF6201] border border-[#FF6201]/20 uppercase tracking-widest leading-none shadow-[0_0_10px_rgba(255,98,1,0.2)]"><AlertCircle size={12} strokeWidth={3} /> Atrasado</span>;
      case RentalStatus.RETURNED:
        return rental.returnCondition
          ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-white/5 text-[#94A3B8] border border-white/10 uppercase tracking-widest leading-none">Devolvido</span>
          : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-[#01A4F1]/10 text-[#01A4F1] border border-[#01A4F1]/20 uppercase tracking-widest leading-none"><ClipboardCheck size={12} strokeWidth={3} /> Inspeção Pendente</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Gerenciar Aluguéis</h2>

      {selectedRentalForReturn && (
        <ReturnModal
          rental={selectedRentalForReturn}
          onClose={() => setSelectedRentalForReturn(null)}
          onConfirm={handleConfirmReturn}
        />
      )}

      {selectedRentalForInspection && (
        <InspectionModal
          rental={selectedRentalForInspection}
          onClose={() => setSelectedRentalForInspection(null)}
          onConfirm={handleConfirmInspection}
        />
      )}

      {receiptRental && (
        <ReturnReceipt
          rental={receiptRental}
          engineers={engineers}
          onClose={() => setReceiptRental(null)}
        />
      )}

      {selectedRentalForRenew && (
        <RenewModal
          rental={selectedRentalForRenew}
          onClose={() => setSelectedRentalForRenew(null)}
          onConfirm={(id, newEndDate, notes) => {
            onRenewRental(id, newEndDate, notes);
            setSelectedRentalForRenew(null);
          }}
        />
      )}

      <div className="glass-panel rounded-xl overflow-hidden shadow-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#0067B4]/30 text-[#01A4F1] uppercase font-black text-[10px] tracking-widest border-b border-[#01A4F1]/20">
              <tr>
                <th className="px-6 py-5">Equipamento / Obra</th>
                <th className="px-6 py-4">Fornecedor</th>
                <th className="px-6 py-4">Vencimento / Devolução</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rentals
                .filter(r => r.status !== RentalStatus.RETURNED || !r.returnCondition)
                .map((rental) => {
                  return (
                    <tr key={rental.id} className="hover:bg-[#01A4F1]/5 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-black text-white tracking-tight">{rental.equipmentName}</p>
                        <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest min-w-[150px] mt-0.5">{rental.constructionSiteName}</p>
                        <p className="text-[10px] text-[#01A4F1] mt-1 font-black uppercase">Responsável: {getEngineer(rental.engineerId)?.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-white text-xs">{rental.supplierName}</p>
                      </td>
                      <td className="px-6 py-5">
                        {rental.status === RentalStatus.RETURNED ? (
                          <div>
                            <p className="text-white font-black text-xs">{formatDate(rental.returnDate)}</p>
                            <p className="text-[10px] text-[#94A3B8] font-bold uppercase">Devolvido em</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-white font-black text-xs">{formatDate(rental.endDate)}</p>
                            <p className="text-[10px] text-[#94A3B8] font-bold uppercase">Entrega: {formatDate(rental.startDate)}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(rental.status, rental)}
                        {rental.returnCondition === 'DEFECTIVE' && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#FF6201] font-black uppercase tracking-widest">
                            <AlertCircle size={10} /> Com Defeito
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleNotify(rental)}
                            className="p-2.5 text-[#01A4F1] bg-[#01A4F1]/10 hover:bg-[#01A4F1]/20 rounded-xl border border-[#01A4F1]/20 transition-all duration-200"
                            title="Notificar Engenheiro via Telegram"
                          >
                            <Send size={16} />
                          </button>

                          {rental.status === RentalStatus.RETURNED ? (
                            <button
                              onClick={() => setReceiptRental(rental)}
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              <Printer size={14} /> Recibo
                            </button>
                          ) : rental.status === RentalStatus.OVERDUE ? (
                            // VENCIDO: mostra RENOVAR + DEVOLVER lado a lado
                            <>
                              <button
                                onClick={() => setSelectedRentalForRenew(rental)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/30 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                title="Renovar / Prorrogar prazo"
                              >
                                <RefreshCw size={14} /> Renovar
                              </button>
                              <button
                                onClick={() => setSelectedRentalForReturn(rental)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#FF6201] text-white hover:brightness-110 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#FF6201]/20 transition-all"
                              >
                                <AlertCircle size={14} /> Devolver
                              </button>
                            </>
                          ) : rental.status === RentalStatus.EXPIRING_SOON ? (
                            // VENCENDO EM BREVE: mostra RENOVAR + DEVOLVER
                            <>
                              <button
                                onClick={() => setSelectedRentalForRenew(rental)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/30 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                title="Renovar / Prorrogar prazo"
                              >
                                <RefreshCw size={14} /> Renovar
                              </button>
                              <button
                                onClick={() => setSelectedRentalForReturn(rental)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0067B4] text-white hover:bg-[#01A4F1] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                              >
                                <CheckCircle size={14} /> Devolver
                              </button>
                            </>
                          ) : !rental.returnCondition && rental.status === RentalStatus.RETURNED ? (
                            <button
                              onClick={() => setSelectedRentalForInspection(rental)}
                              className="flex items-center gap-2 px-4 py-2 bg-[#01A4F1] text-white hover:brightness-110 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                              <ClipboardCheck size={14} /> Inspecionar
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedRentalForReturn(rental)}
                              className="flex items-center gap-2 px-4 py-2 bg-[#0067B4] text-white hover:bg-[#01A4F1] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                              <CheckCircle size={14} /> Devolver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {rentals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#94A3B8] font-bold uppercase tracking-widest text-xs">
                    Nenhum aluguel registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RentalsList;