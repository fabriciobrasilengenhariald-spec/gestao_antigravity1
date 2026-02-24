import React from 'react';
import { LayoutDashboard, PlusCircle, Users, ListTodo, Truck } from 'lucide-react';
import LogoLD from './LogoLD';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Novo Aluguel', icon: PlusCircle },
    { id: 'rentals', label: 'Aluguéis Ativos', icon: ListTodo },
    { id: 'reports', label: 'Relatórios', icon: LayoutDashboard }, // Reusing check-square or similar
    { id: 'suppliers', label: 'Fornecedores', icon: Truck },
    { id: 'engineers', label: 'Engenheiros & Obras', icon: Users },
  ];

  return (
    <div className="w-64 min-h-screen flex flex-col z-10 hidden md:flex border-r border-[#1E293B] bg-[#0F1720]">
      <div className="p-6 border-b border-[#1E293B]">
        <LogoLD />
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                ${isActive
                  ? 'bg-[#0067B4]/20 text-[#01A4F1] border-l-4 border-[#01A4F1]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon size={20} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`} />
              <span className={`font-bold tracking-tight text-sm ${isActive ? 'text-[#01A4F1]' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1E293B] bg-black/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0067B4] to-[#01A4F1] flex items-center justify-center font-black text-white shadow-lg ring-2 ring-white/10">AD</div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">Administrador</p>
            <p className="text-[10px] text-[#01A4F1] truncate font-black uppercase tracking-wider">admin@ldalugueis.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
