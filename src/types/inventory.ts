export type Role = 'warehouse' | 'purchasing' | 'boss';

export type StockStatus = 'normal' | 'warning' | 'critical';

export type POStatus = 'draft' | 'pending' | 'approved' | 'received' | 'rejected';

export type TransactionType = 'inbound' | 'outbound';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  spec: string;
  stock: number;
  threshold: number;
  unitPrice: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  itemId: string;
  quantity: number;
  unitPrice: number;
  counterparty: string; // supplier or customer
  date: string;
  note: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  items: POItem[];
  supplier: string;
  status: POStatus;
  createdDate: string;
  expectedDate: string;
  note: string;
}

export interface POItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
}
