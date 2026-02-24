import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Check, Loader2, Building2, MapPin, Package, X, Trash2, Plus } from 'lucide-react';
import { extractDataFromDocument } from '../services/geminiService';
import { ExtractedData, Engineer, Rental, Supplier } from '../types';
import { calculateEndDate, determineStatus } from '../constants';

interface ScannerProps {
  engineers: Engineer[];
  suppliers: Supplier[];
  onSave: (rentals: Rental[], supplier: Supplier) => void; // Now accepts array
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ engineers, suppliers, onSave, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Estado para os dados extraídos/editáveis
  const [formData, setFormData] = useState<Partial<ExtractedData> | null>(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');
  const [existingSupplierId, setExistingSupplierId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efeito para checar se o fornecedor já existe pelo CNPJ e preencher dados
  useEffect(() => {
    if (formData?.supplierCNPJ) {
      const cleanInputCNPJ = formData.supplierCNPJ.replace(/\D/g, '');
      if (!cleanInputCNPJ) return;

      const existing = suppliers.find(s => s.cnpj.replace(/\D/g, '') === cleanInputCNPJ);

      if (existing) {
        setExistingSupplierId(existing.id);
        setFormData(prev => {
          if (!prev) return null;
          if (prev.supplierName === existing.name &&
            prev.supplierAddress === existing.address &&
            prev.supplierCity === existing.city) {
            return prev;
          }
          return {
            ...prev,
            supplierName: existing.name,
            supplierAddress: existing.address,
            supplierCity: existing.city,
            supplierCNPJ: existing.cnpj
          };
        });
      } else {
        setExistingSupplierId(null);
      }
    }
  }, [formData?.supplierCNPJ, suppliers]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf')) {
      await processFile(droppedFile);
    } else {
      alert('Formato não suportado. Use JPG, PNG ou PDF.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (f: File) => {
    setFile(f);
    setIsScanning(true);
    setFormData(null);
    setExistingSupplierId(null);

    try {
      const data = await extractDataFromDocument(f);
      setFormData(data);
    } catch (err: any) {
      console.error("Erro no processamento:", err);

      let friendlyMessage = `Erro na leitura do arquivo: ${err.message || 'Erro desconhecido'}.`;

      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('limit')) {
        friendlyMessage = "Limite de uso da IA atingido (Cota do Google Gemini). \n\nVocê pode aguardar alguns minutos ou preencher os dados manualmente.";
      }

      alert(`${friendlyMessage}\n\nO formulário foi aberto para preenchimento manual.`);

      // Fallback manual structure
      setFormData({
        constructionSite: '',
        supplierName: '',
        supplierCNPJ: '',
        supplierAddress: '',
        supplierCity: '',
        items: [{
          equipment: '',
          quantity: 1,
          unit: 'mes',
          goodsTotal: 0,
          orderTotal: 0
        }],
        date: new Date().toISOString().split('T')[0]
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Funções para manipular a lista de itens
  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      if (!prev || !prev.items) return prev;
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => {
      if (!prev) return prev;
      const currentItems = prev.items || [];
      return {
        ...prev,
        items: [...currentItems, {
          equipment: '',
          quantity: 1,
          unit: 'mes',
          goodsTotal: 0,
          orderTotal: 0
        }]
      };
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => {
      if (!prev || !prev.items) return prev;
      const newItems = [...prev.items];
      if (newItems.length === 1) return prev; // Não remove o último
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const handleConfirm = () => {
    if (!formData || !selectedEngineerId || !formData.items) return;

    // 1. Preparar Fornecedor
    const cleanCNPJ = formData.supplierCNPJ?.replace(/\D/g, '') || '';
    let supplierToSave: Supplier;

    const existingSupplier = suppliers.find(s => s.cnpj.replace(/\D/g, '') === cleanCNPJ && cleanCNPJ !== '');

    if (existingSupplier) {
      supplierToSave = existingSupplier;
    } else {
      supplierToSave = {
        id: `sup-${Date.now()}`,
        name: formData.supplierName || 'Fornecedor Desconhecido',
        cnpj: formData.supplierCNPJ || 'N/A',
        address: formData.supplierAddress || '',
        city: formData.supplierCity || ''
      };
    }

    // 2. Iterar sobre os itens e preparar array de alugueis
    const rentalsToSave: Rental[] = formData.items.map((item, index) => {
      const startDate = formData.date || new Date().toISOString().split('T')[0];
      const quantity = item.quantity || 1;

      const unitRaw = item.unit || 'mes';
      const unit: 'dia' | 'mes' | 'unidade' =
        (unitRaw === 'dia' || unitRaw === 'mes' || unitRaw === 'unidade')
          ? unitRaw
          : 'mes';

      const endDate = calculateEndDate(startDate, quantity, unit);

      return {
        id: `${Date.now()}-${index}`,
        constructionSiteName: formData.constructionSite || 'Obra Desconhecida',
        supplierId: supplierToSave.id,
        supplierName: supplierToSave.name,
        equipmentName: item.equipment || 'Insumo',
        goodsTotal: item.goodsTotal || 0,
        orderTotal: item.orderTotal || 0,
        quantity: quantity,
        unit: unit,
        startDate: startDate,
        endDate: endDate,
        status: determineStatus(endDate),
        engineerId: selectedEngineerId,
        originalDocumentUrl: file ? URL.createObjectURL(file) : undefined
      };
    });

    onSave(rentalsToSave, supplierToSave);
  };

  const InputField = ({ label, value, onChange, type = "text", placeholder = "", fullWidth = false, className = "", readOnly = false }: any) => (
    <div className={`flex flex-col space-y-1.5 ${fullWidth ? 'col-span-2' : 'col-span-1'} ${className}`}>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        readOnly={readOnly}
        className={`w-full px-3 py-2.5 border rounded-lg text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm ${readOnly ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300'
          }`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Novo Aluguel (Leitura Inteligente)</h2>
        <p className="text-slate-500 mb-8">Faça o upload do Pedido de Compra. Nossa IA extrairá os dados da obra, fornecedor e itens automaticamente.</p>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
          />
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Upload size={32} />
          </div>
          <p className="text-lg font-bold text-slate-700">Clique ou arraste o arquivo aqui</p>
          <p className="text-sm text-slate-400 mt-2">Suporta PDF, JPG e PNG</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">

      {/* Coluna Esquerda: Visualização do Documento */}
      <div className="w-full md:w-1/2 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col relative">
        <div className="absolute top-4 left-4 z-10 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
          Visualização do Arquivo
        </div>
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg transition-all"
          title="Cancelar"
        >
          <X size={18} />
        </button>
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-800/50">
          {file.type === 'application/pdf' ? (
            <iframe
              src={URL.createObjectURL(file)}
              className="w-full h-full rounded shadow-sm bg-white"
              title="PDF Preview"
            ></iframe>
          ) : (
            <img src={URL.createObjectURL(file)} alt="Preview" className="max-w-full max-h-full object-contain rounded shadow-lg" />
          )}
        </div>
      </div>

      {/* Coluna Direita: Formulário de Edição */}
      <div className="w-full md:w-1/2 flex flex-col bg-white rounded-[32px] shadow-[0_20px_50px_rgba(1,164,241,0.15)] border-[3px] border-[#01A4F1] overflow-hidden">

        <div className="px-8 py-6 border-b border-[#01A4F1]/10 bg-[#F1F5F9] flex justify-between items-center relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#01A4F1]/5 rounded-full -mr-16 -mt-16" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#01A4F1] rounded-lg text-white shadow-[0_0_15px_rgba(1,164,241,0.3)]">
                <FileText size={20} strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-[#0F1720] tracking-tight uppercase">
                DADOS EXTRAÍDOS
              </h2>
            </div>
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mt-1 ml-[44px]">Verifique os dados antes de salvar</p>
          </div>

          {isScanning && (
            <div className="flex items-center gap-2 text-[#01A4F1] bg-[#01A4F1]/10 px-4 py-2 rounded-xl border border-[#01A4F1]/20 animate-pulse">
              <Loader2 className="animate-spin" size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest">Processando IA...</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isScanning ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
              <div className="w-full h-24 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-full h-40 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-full h-32 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {/* DADOS DA OBRA */}
              <div className="bg-[#F8FAFC] rounded-2xl border-2 border-[#01A4F1]/20 p-6 relative overflow-hidden group hover:border-[#01A4F1]/40 transition-all duration-300">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#01A4F1]"></div>
                <h3 className="text-[10px] font-black text-[#01A4F1] mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <Building2 size={16} strokeWidth={3} /> Dados da Obra e Data
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  <InputField
                    label="Obra"
                    value={formData?.constructionSite || ''}
                    onChange={(e: any) => setFormData({ ...formData, constructionSite: e.target.value })}
                    fullWidth
                    placeholder="Ex: 516 - Obra CIMATEC"
                  />
                  <InputField
                    label="DATA DE ENTREGA"
                    type="date"
                    value={formData?.date || ''}
                    onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
                    fullWidth
                  />
                </div>
              </div>

              {/* DADOS DO FORNECEDOR */}
              <div className={`rounded-2xl border-2 p-6 relative overflow-hidden transition-all duration-300 ${existingSupplierId ? 'border-[#10B981]/30 bg-[#10B981]/5' : 'border-[#01A4F1]/20 bg-[#F8FAFC] hover:border-[#01A4F1]/40'}`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full ${existingSupplierId ? 'bg-[#10B981]' : 'bg-[#0067B4]'}`}></div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.2em] ${existingSupplierId ? 'text-[#10B981]' : 'text-[#01A4F1]'}`}>
                    <MapPin size={16} strokeWidth={3} /> Dados do Fornecedor
                  </h3>
                  {existingSupplierId && (
                    <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-lg border border-[#10B981]/20 uppercase tracking-widest flex items-center gap-1.5">
                      <Check size={12} strokeWidth={3} /> Já Cadastrado
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <InputField
                    label="CNPJ"
                    value={formData?.supplierCNPJ || ''}
                    onChange={(e: any) => setFormData({ ...formData, supplierCNPJ: e.target.value })}
                  />
                  <InputField
                    label="Nome do Fornecedor"
                    value={formData?.supplierName || ''}
                    readOnly={!!existingSupplierId}
                    onChange={(e: any) => setFormData({ ...formData, supplierName: e.target.value })}
                  />
                  <InputField
                    label="Cidade"
                    value={formData?.supplierCity || ''}
                    readOnly={!!existingSupplierId}
                    onChange={(e: any) => setFormData({ ...formData, supplierCity: e.target.value })}
                  />
                  <InputField
                    label="Endereço"
                    value={formData?.supplierAddress || ''}
                    readOnly={!!existingSupplierId}
                    onChange={(e: any) => setFormData({ ...formData, supplierAddress: e.target.value })}
                  />
                </div>
              </div>

              {/* LISTA DE ITENS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black text-[#0F1720] flex items-center gap-2 uppercase tracking-[0.2em]">
                    <Package size={16} strokeWidth={3} /> Itens do Pedido ({formData?.items?.length || 0})
                  </h3>
                  <button onClick={addItem} className="text-[10px] font-black flex items-center gap-1.5 bg-[#01A4F1]/10 text-[#01A4F1] px-4 py-2 rounded-xl border border-[#01A4F1]/20 hover:bg-[#01A4F1]/20 uppercase tracking-widest transition-all">
                    <Plus size={14} strokeWidth={3} /> Adicionar
                  </button>
                </div>

                {formData?.items?.map((item, index) => (
                  <div key={index} className="bg-white rounded-2xl border-2 border-[#0067B4]/10 p-5 relative overflow-hidden hover:border-[#01A4F1]/30 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#0067B4]/20"></div>
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[10px] font-black text-[#01A4F1] bg-[#01A4F1]/5 px-3 py-1 rounded-lg border border-[#01A4F1]/10 uppercase tracking-widest">Item #{index + 1}</span>
                      {formData.items!.length > 1 && (
                        <button onClick={() => removeItem(index)} className="text-[#94A3B8] hover:text-[#FF6201] transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Equipamento"
                        value={item.equipment}
                        onChange={(e: any) => handleItemChange(index, 'equipment', e.target.value)}
                        fullWidth
                        placeholder="Ex: Martelete 10kg"
                      />
                      <InputField
                        label="Qtde"
                        type="number"
                        value={item.quantity}
                        onChange={(e: any) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                      />
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Unidade</label>
                        <select
                          className="w-full px-4 py-3 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl text-[#0F1720] font-bold focus:outline-none focus:border-[#01A4F1] transition-all"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        >
                          <option value="mes">Mês</option>
                          <option value="dia">Dia</option>
                          <option value="unidade">Unidade</option>
                        </select>
                      </div>
                      <InputField
                        label="Vl. Mercadoria (R$)"
                        type="number"
                        value={item.goodsTotal}
                        onChange={(e: any) => handleItemChange(index, 'goodsTotal', parseFloat(e.target.value))}
                      />
                      <InputField
                        label="Vl. Aluguel (R$)"
                        type="number"
                        value={item.orderTotal}
                        onChange={(e: any) => handleItemChange(index, 'orderTotal', parseFloat(e.target.value))}
                        className="bg-[#01A4F1]/5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer com Ação */}
        <div className="p-8 bg-[#F1F5F9] border-t border-[#01A4F1]/10">
          <div className="flex flex-col gap-6">
            <div>
              <label className="text-[10px] font-black text-[#0F1720] uppercase tracking-widest mb-2 block">Responsável Técnico <span className="text-[#FF6201]">*</span></label>
              <select
                className="w-full p-4 border-2 border-[#E2E8F0] rounded-xl bg-white text-[#0F1720] font-bold focus:border-[#01A4F1] outline-none transition-all shadow-sm"
                value={selectedEngineerId}
                onChange={(e) => setSelectedEngineerId(e.target.value)}
              >
                <option value="">Selecione um engenheiro...</option>
                {engineers.map(eng => (
                  <option key={eng.id} value={eng.id}>{eng.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!selectedEngineerId || isScanning}
              className="w-full bg-[#0067B4] hover:bg-[#01A4F1] disabled:bg-[#CBD5E1] disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-[#01A4F1]/20 transform active:scale-[0.98] uppercase tracking-[0.2em] text-sm"
            >
              <Check size={24} strokeWidth={3} />
              Confirmar {(formData?.items?.length || 0) > 1 ? `Todos os ${formData?.items?.length} Aluguéis` : 'Aluguel'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Scanner;