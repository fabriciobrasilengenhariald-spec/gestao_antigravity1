import React, { useState } from 'react';
import { CostCenter } from '../types';
import { Package, ArrowRight, ArrowLeft, Calendar, Clock, CheckCircle2, AlertCircle, Building2, Warehouse, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProjectsInventoryProps {
  costCenters: CostCenter[];
}

const ProjectsInventory: React.FC<ProjectsInventoryProps> = ({ costCenters }) => {
  const [selectedCrCode, setSelectedCrCode] = useState<string | null>(null);

  const calculateDaysRented = (entryDate: string) => {
    if (!entryDate) return 0;
    
    let dateObj: Date | null = null;
    
    if (entryDate.includes('-')) {
        const parts = entryDate.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts.map(Number);
            dateObj = new Date(year, month - 1, day);
        }
    } else if (entryDate.includes('/')) {
        const parts = entryDate.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            dateObj = new Date(year, month - 1, day);
        }
    }

    if (!dateObj || isNaN(dateObj.getTime())) return 0;

    const today = new Date();
    today.setHours(0,0,0,0);
    dateObj.setHours(0,0,0,0);
    
    const diffTime = Math.abs(today.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const generatePDF = (cr: CostCenter) => {
    const doc = new jsPDF();
    const isLocadora = cr.code === '483';

    // -- Header --
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFontSize(18);
    doc.text(isLocadora ? "Relatório de Estoque Central" : "Relatório de Materiais Alugados", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);

    // -- Project Info Box --
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 45, 182, 35, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text("Centro de Custo:", 20, 55);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${cr.code} - ${cr.name}`, 20, 62);

    const totalValue = cr.inventory.reduce((sum, item) => sum + item.total, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Valor Total:", 140, 55);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(isLocadora ? 37 : 234, isLocadora ? 99 : 88, isLocadora ? 235 : 12); // Blue or Orange
    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue), 140, 62);

    // -- Table Data --
    const tableBody = cr.inventory.map(item => [
        item.code,
        `${item.name}\n${item.detail || ''}`,
        `${item.quantity} ${item.unit}`,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total),
        item.documentNumber,
        isLocadora ? '-' : `${calculateDaysRented(item.entryDate)} dias`
    ]);

    autoTable(doc, {
        startY: 90,
        head: [['Cód', 'Item / Detalhe', 'Qtd', 'Vlr Unit.', 'Total', 'Doc.', 'Tempo']],
        body: tableBody,
        theme: 'striped',
        headStyles: { 
            fillColor: isLocadora ? [37, 99, 235] : [234, 88, 12], // Blue-600 or Orange-600
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 'auto' }, // Item Name flexible
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
            5: { cellWidth: 20, halign: 'center' },
            6: { cellWidth: 20, halign: 'center' }
        },
        didDrawPage: (data) => {
            // Footer with page number
            const str = 'Página ' + doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(str, data.settings.margin.left, pageHeight - 10);
        }
    });

    doc.save(`Relatorio_Estoque_${cr.code}.pdf`);
  };

  const selectedCr = costCenters.find(cr => cr.code === selectedCrCode);
  const warehouse = costCenters.find(cr => cr.code === '483');
  const projects = costCenters.filter(cr => cr.code !== '483');

  // Detail View
  if (selectedCr) {
    const isLocadora = selectedCr.code === '483';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button 
            onClick={() => setSelectedCrCode(null)}
            className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-medium"
            >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para Lista
            </button>

            <button
                onClick={() => generatePDF(selectedCr)}
                className="flex items-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
            >
                <FileDown className="w-4 h-4" />
                <span>Exportar PDF</span>
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className={`${isLocadora ? 'bg-blue-50' : 'bg-orange-50'} px-8 py-6 border-b border-gray-200 flex justify-between items-start`}>
            <div>
               <div className="flex items-center space-x-3 mb-2">
                  <span className={`${isLocadora ? 'bg-blue-600' : 'bg-orange-500'} text-white font-bold rounded px-2 py-1 text-sm`}>
                    {selectedCr.code}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedCr.name}</h2>
               </div>
               <p className="text-slate-500">
                 {isLocadora 
                    ? "Materiais disponíveis no Almoxarifado Central." 
                    : "Detalhamento completo dos materiais alugados nesta obra."
                 }
               </p>
            </div>
            <div className="text-right">
               <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Valor Total</p>
               <p className="text-2xl font-bold text-slate-800">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                   selectedCr.inventory.reduce((sum, item) => sum + item.total, 0)
                 )}
               </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">Item / Detalhe</th>
                  <th className="px-6 py-3 text-center">Qtd</th>
                  <th className="px-6 py-3 text-right">Valor Unit.</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3">Documento</th>
                  <th className="px-6 py-3">Envio</th>
                  {!isLocadora && (
                    <th className="px-6 py-3 text-center">Tempo</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedCr.inventory.map((item, idx) => (
                  <tr key={`${item.code}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.code} - {item.name}</div>
                      <div className="text-xs text-gray-500">{item.detail}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {item.quantity} <span className="text-xs text-gray-400">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       R$ {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                       R$ {item.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.documentNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center space-x-2">
                         <Calendar className="w-3 h-3" />
                         <span>{item.entryDate}</span>
                      </div>
                    </td>
                    {!isLocadora && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1 text-orange-600 font-medium">
                          <Clock className="w-4 h-4" />
                          <span>{calculateDaysRented(item.entryDate)} dias</span>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {selectedCr.inventory.length === 0 && (
                   <tr>
                      <td colSpan={isLocadora ? 6 : 7} className="px-6 py-12 text-center text-gray-400 italic">
                         {isLocadora ? 'Nenhum material em estoque.' : 'Nenhum material alugado.'}
                      </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Render Card Function
  const renderCard = (cr: CostCenter, isCentral: boolean) => {
      const isActive = cr.inventory.length > 0;
      const totalValue = cr.inventory.reduce((sum, item) => sum + item.total, 0);

      return (
        <div 
          key={cr.code} 
          className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md cursor-pointer group ${
             isActive 
                ? (isCentral ? 'border-blue-200' : 'border-gray-200') 
                : 'border-gray-100 bg-gray-50'
          }`}
          onClick={() => setSelectedCrCode(cr.code)}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
               <div className={`${isCentral ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'} font-bold text-xs rounded px-2 py-1`}>
                  {cr.code}
               </div>
               <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
               }`}>
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {isCentral ? 'Com Saldo' : 'Ativa'}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Vazio
                    </>
                  )}
               </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
              {cr.name}
            </h3>

            <div className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
               {isCentral ? <Warehouse className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
               <span>{isCentral ? 'Central / Locadora' : 'Obra / Cliente'}</span>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
               <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Itens</p>
                  <p className="text-xl font-bold text-slate-700">{cr.inventory.length}</p>
               </div>
               <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Total</p>
                  <p className="text-base font-bold text-blue-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </p>
               </div>
            </div>
          </div>
          
          <div className={`${isCentral ? 'bg-blue-50' : 'bg-gray-50'} px-6 py-3 border-t ${isCentral ? 'border-blue-100' : 'border-gray-100'} rounded-b-xl flex justify-between items-center group-hover:bg-blue-100 transition-colors`}>
              <span className="text-sm font-medium text-slate-600 group-hover:text-blue-700">Ver detalhes</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      );
  };

  // List View
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Estoque por Centro de Custo</h2>
        <p className="text-slate-500">Gerencie o saldo da central e os materiais alugados em cada obra.</p>
      </div>
      
      {/* Central Section */}
      {warehouse && (
          <div className="mb-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <Warehouse className="w-5 h-5 mr-2" />
                  Almoxarifado Central (Locadora)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderCard(warehouse, true)}
              </div>
          </div>
      )}

      {/* Projects Section */}
      <div>
        <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
             <Building2 className="w-5 h-5 mr-2" />
             Obras (Locatários)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(cr => renderCard(cr, false))}
            {projects.length === 0 && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">Nenhuma obra cadastrada ainda.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsInventory;