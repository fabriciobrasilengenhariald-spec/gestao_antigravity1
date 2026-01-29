import React from 'react';
import { LayoutDashboard, Upload, Search, HardHat, Package } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <HardHat className="w-8 h-8 text-orange-500" />
          <span className="font-bold text-lg tracking-tight">Gestão Obras</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => onChangeView(AppView.DASHBOARD)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === AppView.DASHBOARD 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Painel Geral</span>
          </button>

          <button
            onClick={() => onChangeView(AppView.PROJECTS)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === AppView.PROJECTS 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Estoque por Obra</span>
          </button>

          <button
            onClick={() => onChangeView(AppView.UPLOAD)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === AppView.UPLOAD 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>Importar Documento</span>
          </button>

          <button
            onClick={() => onChangeView(AppView.SEARCH)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === AppView.SEARCH 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Buscar Materiais</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            &copy; 2026 Sistema de Controle
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center">
             <div className="flex items-center space-x-2">
                <HardHat className="w-6 h-6 text-orange-500" />
                <span className="font-bold text-gray-800">Gestão Obras</span>
             </div>
             <div className="flex space-x-4">
                <LayoutDashboard onClick={() => onChangeView(AppView.DASHBOARD)} className={currentView === AppView.DASHBOARD ? "text-blue-600" : "text-gray-500"} />
                <Package onClick={() => onChangeView(AppView.PROJECTS)} className={currentView === AppView.PROJECTS ? "text-blue-600" : "text-gray-500"} />
                <Upload onClick={() => onChangeView(AppView.UPLOAD)} className={currentView === AppView.UPLOAD ? "text-blue-600" : "text-gray-500"} />
             </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;