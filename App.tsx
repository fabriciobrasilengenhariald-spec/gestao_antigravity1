import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectsInventory from './components/ProjectsInventory';
import FileUpload from './components/FileUpload';
import Search from './components/Search';
import Login from './components/Login';
import { AppView, CostCenter, DocumentData } from './types';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { saveDocumentToSupabase, fetchInventoryFromSupabase, fetchMovementsHistory } from './services/dbService';
import { Session } from '@supabase/supabase-js';
import { Loader2, Database } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [processedDocuments, setProcessedDocuments] = useState<Set<string>>(new Set());
  const [movementsHistory, setMovementsHistory] = useState<DocumentData[]>([]);

  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [supabaseConfigMissing, setSupabaseConfigMissing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Auth Initialization
  useEffect(() => {
    // Verificação crítica antes de tentar usar o cliente Supabase
    if (!isSupabaseConfigured()) {
      setSupabaseConfigMissing(true);
      setLoadingSession(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Data Loading (Only if logged in)
  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  // 3. API Key check
  useEffect(() => {
    // Check for VITE_GEMINI_API_KEY or injected keys
    const hasKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
    if (!hasKey) {
      setApiKeyMissing(true);
    }
  }, []);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const [inventory, history] = await Promise.all([
        fetchInventoryFromSupabase(),
        fetchMovementsHistory()
      ]);

      setCostCenters(inventory);
      setMovementsHistory(history);

      // Rebuild processed documents set to avoid duplicates
      const docSet = new Set<string>();
      history.forEach(h => docSet.add(h.documentNumber));
      setProcessedDocuments(docSet);

    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
      alert("Erro ao sincronizar dados. Verifique a conexão.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDocumentProcessed = async (data: DocumentData) => {
    setIsSyncing(true);
    try {
      // Save to Database
      await saveDocumentToSupabase(data);

      // Reload Database View (let the DB handle the math of balancing stock)
      await loadData();

    } catch (error: any) {
      console.error("Erro ao salvar documento:", error);
      alert(`Erro ao salvar no banco de dados: ${error.message}`);
      setIsSyncing(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setApiKeyMissing(false);
      window.location.reload();
    } else {
      alert("O seletor de chave de API não está disponível neste ambiente.");
    }
  };

  // --- RENDERS ---

  if (loadingSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Tela de erro se Supabase não estiver configurado
  if (supabaseConfigMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
          <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Database className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Configuração de Banco de Dados</h1>
          <p className="text-gray-600 mb-6 text-sm">
            Não foi possível conectar ao Supabase. As variáveis de ambiente necessárias não foram encontradas.
          </p>
          <div className="bg-gray-100 p-4 rounded text-left text-xs font-mono text-gray-700 overflow-x-auto mb-6 border border-gray-200">
            <span className="font-bold">Variáveis Obrigatórias:</span><br />
            process.env.SUPABASE_URL<br />
            process.env.SUPABASE_ANON_KEY
          </div>
          <p className="text-xs text-gray-400">
            Configure estas variáveis no seu ambiente de desenvolvimento para continuar.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuração Necessária</h1>
          <p className="text-gray-600 mb-6">
            Para processar os documentos PDF, você precisa conectar sua chave de API do Google Gemini.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Selecionar Chave de API
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {/* Sync Indicator */}
      {isSyncing && (
        <div className="fixed top-4 right-4 bg-white p-2 rounded-lg shadow-md flex items-center space-x-2 z-50">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-xs text-gray-600 font-medium">Sincronizando...</span>
        </div>
      )}

      {currentView === AppView.DASHBOARD && (
        <Dashboard costCenters={costCenters} />
      )}
      {currentView === AppView.PROJECTS && (
        <ProjectsInventory costCenters={costCenters} />
      )}
      {currentView === AppView.UPLOAD && (
        <FileUpload
          onDataProcessed={handleDocumentProcessed}
          processedDocuments={processedDocuments}
          costCenters={costCenters}
        />
      )}
      {currentView === AppView.SEARCH && (
        <Search costCenters={costCenters} movements={movementsHistory} />
      )}
    </Layout>
  );
}

export default App;