import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, ListChecks, ArrowRight, Save, Info, ArrowLeftRight } from 'lucide-react';
import { parseDocumentWithGemini } from '../services/geminiService';
import { DocumentData, CostCenter, ParsedItem } from '../types';

interface FileUploadProps {
  onDataProcessed: (data: DocumentData) => void;
  processedDocuments: Set<string>;
  costCenters: CostCenter[]; // Needed to check existing inventory for SNAPSHOTs
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataProcessed, processedDocuments, costCenters }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for Review Mode (Snapshot)
  const [reviewData, setReviewData] = useState<DocumentData | null>(null);
  const [reviewItems, setReviewItems] = useState<ParsedItem[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Por favor, envie apenas arquivos PDF.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setReviewData(null);

    try {
      const base64 = await toBase64(file);
      const base64Data = base64.split(',')[1];
      
      const data = await parseDocumentWithGemini(base64Data, file.type);
      
      // 0. Global Duplicate Check 
      // APENAS para Movimentos (AV). Para Snapshots, permitimos o reprocessamento para checar diferenças de saldo.
      if (data.documentType === 'MOVEMENT' && processedDocuments.has(data.documentNumber)) {
         throw new Error(`Duplicidade Detectada: O documento de movimento ${data.documentNumber} já foi processado anteriormente.`);
      }

      // 1. Validation for SNAPSHOTS specific rule
      if (data.documentType === 'SNAPSHOT') {
         if (!data.destinationCrName.toUpperCase().includes('FERRAMENTA')) {
            throw new Error(`Documento recusado: A obra "${data.destinationCrName}" não parece ser uma obra de Ferramentas (nome deve conter "FERRAMENTA").`);
         }
         
         // Setup Review Mode
         // Add 'isRental' property, default to true for convenience, or false if user needs to be careful
         const itemsWithFlag = data.items.map(i => ({ ...i, isRental: true }));
         setReviewData(data);
         setReviewItems(itemsWithFlag);
         setIsProcessing(false);
         return;
      }

      // If it is a MOVEMENT, just proceed
      onDataProcessed(data);
      setSuccess(`Documento ${data.documentNumber} processado com sucesso! Itens adicionados à obra ${data.destinationCrName}.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao processar o documento.');
    } finally {
      if (!reviewData) { // Only finish processing if not entering review mode
          setIsProcessing(false);
          event.target.value = '';
      }
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // --- REVIEW MODE LOGIC ---

  const toggleItemRental = (index: number) => {
      setReviewItems(prev => {
          const newItems = [...prev];
          newItems[index].isRental = !newItems[index].isRental;
          return newItems;
      });
  };

  const handleConfirmSnapshot = () => {
      if (!reviewData) return;

      // 1. Filter only items selected as "Rental"
      const rentalItems = reviewItems.filter(i => i.isRental);

      if (rentalItems.length === 0) {
          setError("Nenhum item selecionado como aluguel.");
          return;
      }

      // 2. Calculate DELTAS (Difference between PDF and System)
      const existingCR = costCenters.find(cr => cr.code === reviewData.destinationCrCode);
      
      const itemsToAdd: ParsedItem[] = [];
      const itemsToRemove: ParsedItem[] = [];

      rentalItems.forEach(pdfItem => {
          // Find existing quantity in the system
          // We sum up all entries of this item code in the destination CR
          const currentSystemQty = existingCR 
              ? existingCR.inventory
                  .filter(inv => inv.code === pdfItem.code)
                  .reduce((sum, inv) => sum + inv.quantity, 0)
              : 0;

          const pdfQty = pdfItem.quantity;
          const diff = pdfQty - currentSystemQty;

          if (diff > 0) {
              // Aumento de Saldo (Entrada)
              const qtyToAdd = diff;
              const valueToAdd = qtyToAdd * pdfItem.unitPrice;
              itemsToAdd.push({
                  ...pdfItem,
                  quantity: qtyToAdd,
                  total: valueToAdd
              });
          } else if (diff < 0) {
              // Redução de Saldo (Baixa/Devolução)
              const qtyToRemove = Math.abs(diff);
              const valueToRemove = qtyToRemove * pdfItem.unitPrice;
              itemsToRemove.push({
                  ...pdfItem,
                  quantity: qtyToRemove,
                  total: valueToRemove
              });
          }
          // Se diff === 0, o saldo já está correto, não fazemos nada.
      });

      if (itemsToAdd.length === 0 && itemsToRemove.length === 0) {
          setError(`Nenhuma alteração de saldo detectada para a obra ${reviewData.destinationCrName}. O sistema já possui exatamente as mesmas quantidades informadas neste documento.`);
          // Não limpamos o reviewData para permitir que o usuário veja a tabela se quiser
          return;
      }

      const timestamp = Date.now().toString().slice(-6);

      // 3. Process ADDITIONS (Origin: 483 -> Dest: Site)
      if (itemsToAdd.length > 0) {
          const additionDoc: DocumentData = {
              ...reviewData,
              items: itemsToAdd,
              documentNumber: `${reviewData.documentNumber}-ADD-${timestamp}`, // Unique ID
              movementType: 'Ajuste de Saldo (Entrada)'
          };
          onDataProcessed(additionDoc);
      }

      // 4. Process REMOVALS (Origin: Site -> Dest: 483)
      if (itemsToRemove.length > 0) {
          const removalDoc: DocumentData = {
              ...reviewData,
              // Invert Origin/Dest for removal
              originCrCode: reviewData.destinationCrCode,
              originCrName: reviewData.destinationCrName,
              destinationCrCode: '483',
              destinationCrName: 'ALUGUEL DE EQUIPAMENTOS', // Devolução para central
              items: itemsToRemove,
              documentNumber: `${reviewData.documentNumber}-REM-${timestamp}`, // Unique ID
              movementType: 'Ajuste de Saldo (Saída)'
          };
          onDataProcessed(removalDoc);
      }

      let successMsg = "Processamento concluído!";
      if (itemsToAdd.length > 0) successMsg += ` ${itemsToAdd.length} itens adicionados.`;
      if (itemsToRemove.length > 0) successMsg += ` ${itemsToRemove.length} itens baixados/devolvidos.`;

      setSuccess(successMsg);
      setReviewData(null);
      setError(null);
  };

  if (reviewData) {
      return (
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-blue-200">
              <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                  <ListChecks className="w-8 h-8 text-blue-600" />
                  <div>
                      <h2 className="text-xl font-bold text-slate-800">Análise de Posição de Estoque</h2>
                      <p className="text-sm text-slate-500">O sistema comparará os itens selecionados com o saldo atual da obra para gerar entradas ou saídas.</p>
                  </div>
              </div>
              
              {error && (
                 <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"/>
                    <span className="text-sm">{error}</span>
                 </div>
              )}

              <div className="bg-slate-50 p-4 rounded-lg mb-4 flex justify-between items-center text-sm">
                  <div>
                      <span className="font-bold text-slate-700">Obra:</span> {reviewData.destinationCrCode} - {reviewData.destinationCrName}
                  </div>
                  <div>
                      <span className="font-bold text-slate-700">Data do Relatório:</span> {reviewData.date}
                  </div>
              </div>

              <div className="overflow-x-auto max-h-[50vh] overflow-y-auto border rounded-lg mb-6">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-600 sticky top-0">
                          <tr>
                              <th className="px-4 py-3 text-center w-24">É Aluguel?</th>
                              <th className="px-4 py-3">Item</th>
                              <th className="px-4 py-3 text-center">Qtd no PDF</th>
                              <th className="px-4 py-3 text-center">Saldo Atual no Sistema</th>
                              <th className="px-4 py-3 text-center">Ação Prevista</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                          {reviewItems.map((item, idx) => {
                              // Calculate projected action for UI feedback
                              const existingCR = costCenters.find(cr => cr.code === reviewData.destinationCrCode);
                              const currentSystemQty = existingCR 
                                  ? existingCR.inventory
                                      .filter(inv => inv.code === item.code)
                                      .reduce((sum, inv) => sum + inv.quantity, 0)
                                  : 0;
                              const diff = item.quantity - currentSystemQty;

                              let actionBadge = <span className="text-gray-400">-</span>;
                              if (item.isRental) {
                                  if (diff > 0) actionBadge = <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Adicionar +{diff}</span>;
                                  else if (diff < 0) actionBadge = <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">Baixar {diff}</span>;
                                  else actionBadge = <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Sem Alteração</span>;
                              }

                              return (
                                  <tr key={idx} className={item.isRental ? 'bg-blue-50/30' : 'opacity-50'}>
                                      <td className="px-4 py-3 text-center">
                                          <input 
                                              type="checkbox" 
                                              checked={item.isRental} 
                                              onChange={() => toggleItemRental(idx)}
                                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                          />
                                      </td>
                                      <td className="px-4 py-3 font-medium text-slate-800">
                                          {item.code} - {item.name}
                                          <div className="text-xs text-gray-500 font-normal">{item.detail}</div>
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold">{item.quantity} {item.unit}</td>
                                      <td className="px-4 py-3 text-center text-gray-600">{currentSystemQty} {item.unit}</td>
                                      <td className="px-4 py-3 text-center">{actionBadge}</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>

              <div className="flex justify-end space-x-3">
                  <button 
                      onClick={() => setReviewData(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                      Cancelar
                  </button>
                  <button 
                      onClick={handleConfirmSnapshot}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-2 transition-colors"
                  >
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Processar Diferenças</span>
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Importar Documento</h2>
        <p className="text-slate-500">Aceita PDF de "Movimentos de Estoque" (AV) ou "Posições de Estoque Atual" (Snapshot).</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50 transition-colors hover:bg-blue-50 hover:border-blue-300 group">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          
          <label 
            htmlFor="file-upload" 
            className={`cursor-pointer flex flex-col items-center justify-center w-full h-full ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isProcessing ? (
               <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            ) : (
               <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-blue-600" />
               </div>
            )}
            
            <span className="text-lg font-medium text-slate-700 mb-2">
              {isProcessing ? 'Analisando documento com IA...' : 'Clique para selecionar o PDF'}
            </span>
            <span className="text-sm text-slate-400">
              Suporta "Movimentos de Estoque" e "Posições de Estoque"
            </span>
          </label>
        </div>

        {/* Feedback Messages */}
        <div className="mt-6 space-y-4">
           {error && (
             <div className="flex items-start p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
               <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
               <div>
                 <h4 className="font-semibold">Atenção</h4>
                 <p className="text-sm">{error}</p>
               </div>
             </div>
           )}

           {success && (
             <div className="flex items-start p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
               <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
               <div>
                 <h4 className="font-semibold">Sucesso</h4>
                 <p className="text-sm">{success}</p>
               </div>
             </div>
           )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
        <h3 className="font-bold text-blue-800 mb-4 flex items-center text-lg">
            <Info className="w-6 h-6 mr-2" />
            Guia de Importação de Documentos
        </h3>
        
        <div className="space-y-6">
            <div>
                <h4 className="font-bold text-blue-700 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    1. Movimentos de Estoque (AV)
                </h4>
                <p className="text-sm text-blue-800/80 mb-2 ml-6">
                    Use para registrar transferências do dia a dia.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 ml-6">
                    <li>O documento deve ser um comprovante de movimentação (AV).</li>
                    <li><strong>Duplicidade:</strong> Se o número do AV já existir no sistema, o arquivo será recusado automaticamente.</li>
                </ul>
            </div>

            <div className="border-t border-blue-200 pt-4">
                <h4 className="font-bold text-blue-700 mb-2 flex items-center">
                    <ListChecks className="w-4 h-4 mr-2" />
                    2. Posições de Estoque Atual (Atualização de Saldo)
                </h4>
                <p className="text-sm text-blue-800/80 mb-2 ml-6">
                    Use para atualizar o saldo da obra baseando-se no relatório oficial.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 ml-6">
                    <li>O título do PDF deve ser "Posições de Estoque Atual".</li>
                    <li>O nome da Obra deve conter a palavra <strong>"FERRAMENTA"</strong>.</li>
                    <li>
                        <strong>Lógica Inteligente de Saldo:</strong>
                        <p className="mt-1 mb-1">O sistema comparará o PDF com o saldo atual:</p>
                        <ul className="pl-4 list-[square] text-blue-600/90">
                            <li><strong>Aumento (+):</strong> Se o PDF tem 3 e o Sistema tem 2, será gerada uma entrada de <strong>+1</strong>.</li>
                            <li><strong>Redução (-):</strong> Se o PDF tem 2 e o Sistema tem 3, será gerada uma baixa de <strong>-1</strong>.</li>
                            <li><strong>Igual (=):</strong> Se o PDF tem 2 e o Sistema tem 2, nenhuma alteração é feita.</li>
                        </ul>
                    </li>
                    <li className="mt-2 text-blue-800 font-semibold">
                        Atenção: O sistema só acusará "Duplicidade" se o documento não trouxer nenhuma alteração real (nenhum aumento nem diminuição) em relação ao saldo atual.
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;