import { GoogleGenAI, Type } from "@google/genai";
import { DocumentData } from '../types';

const getClient = () => {
  // Tenta pegar do ambiente (Vite) ou do objeto window (injetado)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please select an API key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseDocumentWithGemini = async (base64File: string, mimeType: string): Promise<DocumentData> => {
  const ai = getClient();

  const prompt = `
    Analise o documento fornecido. Ele pode ser de dois tipos:
    TIPO A: "Movimentos de Estoque" (Cabeçalho AV).
    TIPO B: "Posições de Estoque Atual" (Relatório de Saldo).

    Se for TIPO A (Movimento):
    Extraia Origem, Destino, Data, Número (AV) e Itens normalmente. documentType = 'MOVEMENT'.

    Se for TIPO B (Posições de Estoque Atual):
    1. Verifique se o nome da Obra contém a palavra "FERRAMENTA" ou "FERRAMENTAS".
    2. documentType = 'SNAPSHOT'.
    3. movementType = 'Implantação de Saldo'.
    4. Origem CR Code = '483', Origem CR Name = 'ALUGUEL DE EQUIPAMENTOS' (Assumimos que veio do estoque central).
    5. Destino CR Code e Name: Extraia do campo "Obra" (ex: "628 - FERRAMENTA HBO" -> Code: 628, Name: FERRAMENTA HBO).
    6. Número do Documento: Use o texto "POSICAO-" seguido da data encontrada no rodapé ou topo.
    7. Data: Extraia a data de emissão do relatório (ex: rodapé "29/01/2026").
    8. Itens (Tabela):
       - Coluna "Insumo": Contém Código, Nome e Detalhe. Separe-os. Ex: "15221 - CONTAINER... / Detalhe: ALMOXARIFADO" -> Code: 15221, Name: CONTAINER..., Detail: ALMOXARIFADO.
       - Coluna "Unidade": unit.
       - Coluna "Quantidade": quantity.
       - Coluna "Custo médio": unitPrice.
       - Coluna "Custo total": total.

    Retorne JSON estruturado. Limpe textos extras.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64File
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
            documentType: { type: Type.STRING, enum: ['MOVEMENT', 'SNAPSHOT'] },
            originCrCode: { type: Type.STRING },
            originCrName: { type: Type.STRING },
            destinationCrCode: { type: Type.STRING },
            destinationCrName: { type: Type.STRING },
            movementType: { type: Type.STRING },
            documentNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  name: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  unitPrice: { type: Type.NUMBER },
                  total: { type: Type.NUMBER },
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Não foi possível extrair texto do documento.");
    }

    const data = JSON.parse(response.text) as DocumentData;
    return data;
  } catch (error) {
    console.error("Erro ao processar documento:", error);
    throw error;
  }
};