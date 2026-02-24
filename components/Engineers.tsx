import React, { useState } from 'react';
import { Engineer, Rental } from '../types';
import { UserPlus, Mail, Send, HardHat, Building2, BellRing, MessageSquare, Edit2, X } from 'lucide-react';
import { sendTelegramMessage } from '../services/telegramService';

interface EngineersProps {
  engineers: Engineer[];
  rentals: Rental[];
  onAddEngineer: (eng: Engineer) => void;
  onUpdateEngineer: (eng: Engineer) => void;
}

const Engineers: React.FC<EngineersProps> = ({ engineers, rentals, onAddEngineer, onUpdateEngineer }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    email: ''
  });

  const handleOpenAdd = () => {
    setEditingEngineer(null);
    setFormState({ name: '', email: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (eng: Engineer) => {
    setEditingEngineer(eng);
    setFormState({
      name: eng.name,
      email: eng.email
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (formState.name && formState.email) {
      if (editingEngineer) {
        onUpdateEngineer({
          ...editingEngineer,
          name: formState.name,
          email: formState.email
        });
      } else {
        onAddEngineer({
          id: `eng-${Date.now()}`,
          name: formState.name,
          email: formState.email,
          telegramHandle: '', // Keeping empty to avoid breaking types
          avatarUrl: `https://picsum.photos/seed/${Date.now()}/50/50`
        });
      }
      setShowModal(false);
    }
  };

  const getEngineerSites = (engineerId: string) => {
    const engineerRentals = rentals.filter(r => r.engineerId === engineerId);
    const uniqueSites = Array.from(new Set(engineerRentals.map(r => r.constructionSiteName)));
    return uniqueSites;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Responsáveis Técnicos</h2>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Novo Responsável
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engineers.map(eng => {
          const sites = getEngineerSites(eng.id);
          return (
            <div key={eng.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
              <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <img src={eng.avatarUrl} alt={eng.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{eng.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-1">
                      <HardHat size={12} className="text-blue-500" /> Responsável Técnico
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenEdit(eng)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 flex-1">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Mail size={16} className="text-blue-400" />
                    <span className="truncate font-medium">{eng.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Notificação Ativa</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Building2 size={12} /> Obras Vinculadas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {sites.length > 0 ? (
                      sites.map((site, idx) => (
                        <div key={idx} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-blue-100 max-w-full truncate">
                          {site}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Nenhuma obra vinculada.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {editingEngineer ? 'Editar Responsável' : 'Novo Responsável'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">As notificações de vencimento serão enviadas por Gmail.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Silva"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                    value={formState.name}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Gmail para Notificações)</label>
                  <input
                    type="email"
                    placeholder="usuario@empresa.com.br"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                    onChange={e => setFormState({ ...formState, email: e.target.value })}
                    value={formState.email}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-4 text-slate-500 hover:bg-slate-100 font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-[1.5] px-4 py-4 bg-blue-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-[0.98]"
                >
                  {editingEngineer ? 'Salvar Alterações' : 'Criar Engenheiro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Engineers;