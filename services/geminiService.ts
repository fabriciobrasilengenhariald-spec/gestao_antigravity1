import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

// Helper to convert file to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const extractDataFromDocument = async (file: File): Promise<ExtractedData> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables (VITE_GEMINI_API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToBase64(file);

  const prompt = `
    Analise esta imagem de um PEDIDO DE COMPRA ou ORDEM DE SERVIÇO.
    Extraia EXATAMENTE os dados que correspondem aos campos abaixo.
    
    Seus objetivos:
    1. Identificar o campo "Obra" ou "Centro de Custo".
    2. Identificar a seção "Dados do Fornecedor" e extrair: CNPJ, Nome, Cidade e Endereço Completo.
    3. Identificar a LISTA de itens alugados e extrair para cada um: Código+Nome do Insumo, Quantidade, Unidade e Valor Total do Item.
    4. Extrair a "Data de Entrega" ou "Data Início". Procure explicitamente por um campo rotulado como "Data de Entrega" ou similar.

    Retorne JSON puro. Se não encontrar um dado, use null ou string vazia.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            obra: { type: Type.STRING, description: "Nome ou código da obra/centro de custo" },
            fornecedor: {
              type: Type.OBJECT,
              properties: {
                cnpj: { type: Type.STRING },
                nome: { type: Type.STRING },
                cidade: { type: Type.STRING },
                endereco_completo: { type: Type.STRING },
              }
            },
            itens: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  insumo_codigo_nome: { type: Type.STRING, description: "Descrição completa do item (ex: código - nome)" },
                  quantidade: { type: Type.NUMBER },
                  unidade: { type: Type.STRING },
                  total_mercadorias: { type: Type.NUMBER },
                  total_pedido: { type: Type.NUMBER },
                }
              }
            },
            data_entrega: { type: Type.STRING, description: "Formato YYYY-MM-DD" },
          }
        }
      }
    });

    let text = response.text || "{}";

    // Limpeza de Markdown caso a API retorne (embora responseMimeType ajude)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log("JSON Limpo da IA:", text);

    let rawData;
    try {
      rawData = JSON.parse(text);
    } catch (e) {
      console.error("Erro ao fazer parse do JSON da IA:", e);
      rawData = {};
    }

    // Mapeamento
    const extractedItems = Array.isArray(rawData.itens) ? rawData.itens.map((i: any) => ({
      equipment: i.insumo_codigo_nome || "",
      quantity: typeof i.quantidade === 'number' ? i.quantidade : 1,
      unit: i.unidade || "mes",
      goodsTotal: typeof i.total_mercadorias === 'number' ? i.total_mercadorias : 0,
      orderTotal: typeof i.total_pedido === 'number' ? i.total_pedido : 0
    })) : [];

    // Fallback se não encontrar lista mas o modelo alucinar estrutura antiga (raro com schema, mas seguro)
    if (extractedItems.length === 0 && rawData.item) {
      extractedItems.push({
        equipment: rawData.item.insumo_codigo_nome || "",
        quantity: rawData.item.quantidade || 1,
        unit: rawData.item.unidade || "mes",
        goodsTotal: rawData.item.total_mercadorias || 0,
        orderTotal: rawData.item.total_pedido || 0
      });
    }

    return {
      constructionSite: rawData.obra || "",

      supplierName: rawData.fornecedor?.nome || "",
      supplierCNPJ: rawData.fornecedor?.cnpj || "",
      supplierAddress: rawData.fornecedor?.endereco_completo || "",
      supplierCity: rawData.fornecedor?.cidade || "",

      items: extractedItems,
      date: rawData.data_entrega || new Date().toISOString().split('T')[0]
    };

  } catch (error) {
    console.error("Error extracting data:", error);
    throw error;
  }
};