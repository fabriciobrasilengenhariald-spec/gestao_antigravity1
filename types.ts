export interface ParsedItem {
  code: string;
  name: string;
  detail: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  // UI helper for Snapshot review
  isRental?: boolean; 
}

export type DocumentType = 'MOVEMENT' | 'SNAPSHOT';

export interface DocumentData {
  documentType: DocumentType;
  originCrCode: string;
  originCrName: string;
  destinationCrCode: string;
  destinationCrName: string;
  movementType: string;
  documentNumber: string; // e.g., "AV / 5739" or "POSICAO-DATA"
  date: string; // Format DD/MM/YYYY
  items: ParsedItem[];
}

export interface InventoryItem extends ParsedItem {
  entryDate: string; // ISO Date string
  documentNumber: string;
}

export interface CostCenter {
  code: string;
  name: string;
  fullName: string; // code + " - " + name
  inventory: InventoryItem[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  SEARCH = 'SEARCH',
  PROJECTS = 'PROJECTS',
}