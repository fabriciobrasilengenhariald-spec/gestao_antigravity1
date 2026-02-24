import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import RentalsList from './components/RentalsList';
import Engineers from './components/Engineers';
import Suppliers from './components/Suppliers';
import { Rental, Engineer, RentalStatus, Supplier } from './types';
import { Menu } from 'lucide-react';
import Reports from './components/Reports';
import { formatEmailReminderLegacy as formatEmailReminder, sendEmail } from './services/emailService';
import Toast, { ToastType } from './components/Toast';
import NotificationCenter, { Notification } from './components/NotificationCenter';
import { supabase } from './services/supabaseClient';
import { mapRentalFromDB, mapRentalToDB, mapEngineerFromDB, mapSupplierFromDB } from './services/dbMapper';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de Notificações
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    const newNotif: Notification = { id, type, message, timestamp: new Date() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
    setUnreadCount(prev => prev + 1);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearUnread = () => {
    setUnreadCount(0);
  };

  // Carregar dados do Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Buscar Engenheiros (Users)
      const { data: engData, error: engError } = await supabase
        .from('users')
        .select('*');

      if (engError) throw engError;
      const mappedEngs = engData.map(mapEngineerFromDB);
      setEngineers(mappedEngs);

      // 2. Buscar Fornecedores
      const { data: supData, error: supError } = await supabase
        .from('fornecedores')
        .select('*');

      if (supError) throw supError;
      const mappedSups = supData.map(mapSupplierFromDB);
      setSuppliers(mappedSups);

      // 3. Buscar Aluguéis
      const { data: rentData, error: rentError } = await supabase
        .from('alugueis')
        .select(`
          *,
          obras (nome),
          fornecedores (name)
        `)
        .order('created_at', { ascending: false });

      if (rentError) throw rentError;
      const mappedRentals = rentData.map(mapRentalFromDB);
      setRentals(mappedRentals);

    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      showToast('Erro ao carregar dados do banco', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Verificação de vencimentos (opcional: pode ser movido para fetchData ou cron)
  useEffect(() => {
    if (loading || rentals.length === 0) return;

    const timer = setTimeout(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      rentals.forEach(r => {
        if (r.status === RentalStatus.RETURNED) return;

        const endDate = new Date(r.endDate);
        endDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const eng = engineers.find(e => e.id === r.engineerId);
        if (!eng) return;

        if (diffDays === 1) {
          const email = formatEmailReminder(r, eng, 'pre-expire');
          sendEmail(email);
          showToast(`Lembrete (-1 dia) para ${eng.name}`, 'info');
        } else if (diffDays === 0) {
          const email = formatEmailReminder(r, eng, 'expiry');
          sendEmail(email);
          showToast(`Vencimento HOJE para ${eng.name}`, 'warning');
        } else if (diffDays < 0) {
          const email = formatEmailReminder(r, eng, 'overdue');
          sendEmail(email);
          showToast(`ATRASO notificado para ${eng.name}`, 'error');
        }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading, rentals]);

  const handleSaveRental = async (newRentals: Rental[], associatedSupplier: Supplier) => {
    console.log('Iniciando salvamento bulk:', { newRentals, associatedSupplier });
    try {
      // 1. Salvar/Atualizar Fornecedor
      const supplierPayload = {
        id: associatedSupplier.id,
        name: associatedSupplier.name,
        cnpj: associatedSupplier.cnpj,
        address: associatedSupplier.address,
        city: associatedSupplier.city
      };
      console.log('Upsert Fornecedor:', supplierPayload);

      const { error: supError } = await supabase
        .from('fornecedores')
        .upsert(supplierPayload);

      if (supError) throw supError;

      // 2. Resolver Obra (Garantir que existe)
      const siteName = newRentals[0]?.constructionSiteName || 'Obra Desconhecida';
      console.log('Resolvendo Obra:', siteName);

      let { data: siteData } = await supabase
        .from('obras')
        .select('id')
        .eq('nome', siteName)
        .maybeSingle();

      if (!siteData) {
        console.log('Obra não encontrada, criando nova...');
        const { data: newSite, error: siteError } = await supabase
          .from('obras')
          .insert({ nome: siteName })
          .select('id')
          .single();
        if (siteError) throw siteError;
        siteData = newSite;
      }
      console.log('ID da Obra resolvido:', siteData?.id);

      // 3. Preparar Alugueis para Bulk Insert
      const dbRentals = newRentals.map(r => ({
        ...mapRentalToDB(r),
        id_obra: siteData?.id
      }));

      console.log('Payload Final Alugueis (Alvo Supabase):', dbRentals);

      const { error: rentError } = await supabase
        .from('alugueis')
        .insert(dbRentals);

      if (rentError) {
        console.error('Erro específico do Supabase no insert:', rentError);
        throw rentError;
      }

      fetchData();
      setCurrentView('rentals');
      showToast(`${newRentals.length} itens registrados com sucesso!`, 'success');
    } catch (error: any) {
      console.error('Erro fatal ao salvar:', error);
      showToast(`Erro ao salvar: ${error.message || 'Verifique o console'}`, 'error');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: RentalStatus, extras?: any) => {
    try {
      const dbUpdates = mapRentalToDB({ status: newStatus, ...(extras || {}) });
      // Remove undefined keys
      Object.keys(dbUpdates).forEach(key => (dbUpdates as any)[key] === undefined && delete (dbUpdates as any)[key]);

      const { error } = await supabase
        .from('alugueis')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setRentals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, ...(extras || {}) } : r));

      if (newStatus === RentalStatus.RETURNED) {
        showToast(`Item devolvido com sucesso`, 'success');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      showToast('Erro ao atualizar no banco', 'error');
    }
  };

  const handleRenewRental = async (id: string, newEndDate: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('alugueis')
        .update({
          data_fim_prevista: newEndDate,
          status: RentalStatus.ACTIVE,
          return_notes: notes || null
        })
        .eq('id', id);

      if (error) throw error;

      // Atualiza localmente sem precisar recarregar tudo
      setRentals(prev => prev.map(r =>
        r.id === id
          ? { ...r, endDate: newEndDate, status: RentalStatus.ACTIVE, returnNotes: notes }
          : r
      ));

      showToast('Locação renovada com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao renovar locação:', error);
      showToast('Erro ao renovar locação no banco', 'error');
    }
  };

  const handleAddEngineer = async (newEng: Engineer) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: newEng.id || undefined,
          nome: newEng.name,
          email: newEng.email,
          role: 'engenheiro'
        });

      if (error) throw error;
      fetchData();
      showToast(`Engenheiro registrado: ${newEng.name}`, 'success');
    } catch (error: any) {
      showToast('Erro ao salvar engenheiro', 'error');
    }
  };

  return (
    <div className="flex min-h-screen font-sans text-white selection:bg-[#01A4F1] bg-[#0B1426]">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 md:block`}>
        <Sidebar currentView={currentView} setCurrentView={(view) => { setCurrentView(view); setMobileMenuOpen(false); }} />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#0B1426]">
        {/* Header Updated with Brand Style */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0 z-20 border-b border-white/5 bg-[#0F1720]/80 backdrop-blur-md">
          <button
            className="md:hidden text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu />
          </button>

          <div className="flex-1 md:flex-initial" />

          <div className="flex items-center space-x-6">
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onClearUnread={clearUnread}
            />

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800">Administrador</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">Online</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs ring-2 ring-white">
                AD
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && <Dashboard rentals={rentals} />}
            {currentView === 'upload' && (
              <Scanner
                engineers={engineers}
                suppliers={suppliers}
                onSave={handleSaveRental}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}
            {currentView === 'rentals' && (
              <RentalsList
                rentals={rentals}
                engineers={engineers}
                onUpdateStatus={handleUpdateStatus}
                onRenewRental={handleRenewRental}
              />
            )}
            {currentView === 'reports' && (
              <Reports rentals={rentals} engineers={engineers} />
            )}
            {currentView === 'suppliers' && (
              <Suppliers suppliers={suppliers} rentals={rentals} />
            )}
            {currentView === 'engineers' && (
              <Engineers
                engineers={engineers}
                onAddEngineer={handleAddEngineer}
                onUpdateEngineer={(updatedEng) => {
                  setEngineers(prev => prev.map(e => e.id === updatedEng.id ? updatedEng : e));
                  showToast(`Dados de ${updatedEng.name} atualizados`, 'success');
                }}
                rentals={rentals}
              />
            )}
          </div>
        </main>
      </div>

      {/* Toast Container - Moved to TOP-RIGHT */}
      <div className="fixed top-6 right-6 z-[130] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
