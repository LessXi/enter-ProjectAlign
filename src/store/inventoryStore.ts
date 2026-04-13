import { create } from 'zustand';
import type {
  Role,
  InventoryItem,
  Transaction,
  PurchaseOrder,
  POStatus,
  TransactionType,
} from '@/types/inventory';

interface InventoryState {
  currentRole: Role;
  items: InventoryItem[];
  transactions: Transaction[];
  purchaseOrders: PurchaseOrder[];
  setRole: (role: Role) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  createPO: (po: Omit<PurchaseOrder, 'id'>) => void;
  updatePOStatus: (poNumber: string, status: POStatus) => void;
}

// Seed data
const seedItems: InventoryItem[] = [
  { id: '1', sku: 'TS-001', name: '基础圆领T恤', category: 'T恤', spec: '白色/M', stock: 120, threshold: 50, unitPrice: 25 },
  { id: '2', sku: 'TS-002', name: '基础圆领T恤', category: 'T恤', spec: '黑色/L', stock: 85, threshold: 50, unitPrice: 25 },
  { id: '3', sku: 'HD-001', name: '连帽卫衣', category: '卫衣', spec: '灰色/XL', stock: 15, threshold: 30, unitPrice: 68 },
  { id: '4', sku: 'HD-002', name: '拉链卫衣', category: '卫衣', spec: '黑色/L', stock: 42, threshold: 30, unitPrice: 75 },
  { id: '5', sku: 'JN-001', name: '直筒牛仔裤', category: '牛仔裤', spec: '蓝色/32', stock: 8, threshold: 20, unitPrice: 55 },
  { id: '6', sku: 'JN-002', name: '修身牛仔裤', category: '牛仔裤', spec: '深蓝/30', stock: 65, threshold: 20, unitPrice: 60 },
  { id: '7', sku: 'DR-001', name: '碎花连衣裙', category: '连衣裙', spec: '红色/S', stock: 35, threshold: 15, unitPrice: 88 },
  { id: '8', sku: 'PL-001', name: 'Polo短袖衫', category: 'Polo衫', spec: '白色/M', stock: 5, threshold: 25, unitPrice: 45 },
  { id: '9', sku: 'JK-001', name: '薄款夹克', category: '外套', spec: '卡其/L', stock: 28, threshold: 15, unitPrice: 120 },
  { id: '10', sku: 'SK-001', name: 'A字半裙', category: '半裙', spec: '黑色/M', stock: 48, threshold: 20, unitPrice: 42 },
];

function generateDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const seedTransactions: Transaction[] = [
  { id: 't1', type: 'inbound', itemId: '1', quantity: 200, unitPrice: 22, counterparty: '东莞织梦厂', date: generateDate(60), note: '春季补货' },
  { id: 't2', type: 'outbound', itemId: '1', quantity: 150, unitPrice: 25, counterparty: '杭州四季批发', date: generateDate(58), note: '' },
  { id: 't3', type: 'inbound', itemId: '3', quantity: 100, unitPrice: 55, counterparty: '广州棉纺源', date: generateDate(55), note: '新款到货' },
  { id: 't4', type: 'outbound', itemId: '3', quantity: 85, unitPrice: 68, counterparty: '温州服装城', date: generateDate(50), note: '' },
  { id: 't5', type: 'inbound', itemId: '5', quantity: 80, unitPrice: 42, counterparty: '佛山牛仔坊', date: generateDate(45), note: '' },
  { id: 't6', type: 'outbound', itemId: '5', quantity: 72, unitPrice: 55, counterparty: '义乌批发市场', date: generateDate(40), note: '' },
  { id: 't7', type: 'inbound', itemId: '7', quantity: 60, unitPrice: 70, counterparty: '苏州丝绸园', date: generateDate(38), note: '夏季新款' },
  { id: 't8', type: 'outbound', itemId: '2', quantity: 45, unitPrice: 25, counterparty: '杭州四季批发', date: generateDate(35), note: '' },
  { id: 't9', type: 'inbound', itemId: '2', quantity: 100, unitPrice: 22, counterparty: '东莞织梦厂', date: generateDate(32), note: '' },
  { id: 't10', type: 'outbound', itemId: '7', quantity: 25, unitPrice: 88, counterparty: '温州服装城', date: generateDate(30), note: '' },
  { id: 't11', type: 'inbound', itemId: '9', quantity: 50, unitPrice: 95, counterparty: '广州棉纺源', date: generateDate(28), note: '' },
  { id: 't12', type: 'outbound', itemId: '9', quantity: 22, unitPrice: 120, counterparty: '北京新光批发', date: generateDate(25), note: '' },
  { id: 't13', type: 'inbound', itemId: '4', quantity: 60, unitPrice: 60, counterparty: '广州棉纺源', date: generateDate(22), note: '' },
  { id: 't14', type: 'outbound', itemId: '4', quantity: 18, unitPrice: 75, counterparty: '杭州四季批发', date: generateDate(20), note: '' },
  { id: 't15', type: 'inbound', itemId: '10', quantity: 70, unitPrice: 32, counterparty: '苏州丝绸园', date: generateDate(18), note: '' },
  { id: 't16', type: 'outbound', itemId: '10', quantity: 22, unitPrice: 42, counterparty: '义乌批发市场', date: generateDate(15), note: '' },
  { id: 't17', type: 'inbound', itemId: '8', quantity: 40, unitPrice: 35, counterparty: '东莞织梦厂', date: generateDate(12), note: '急补' },
  { id: 't18', type: 'outbound', itemId: '8', quantity: 35, unitPrice: 45, counterparty: '温州服装城', date: generateDate(10), note: '' },
  { id: 't19', type: 'inbound', itemId: '6', quantity: 50, unitPrice: 48, counterparty: '佛山牛仔坊', date: generateDate(8), note: '' },
  { id: 't20', type: 'outbound', itemId: '6', quantity: 30, unitPrice: 60, counterparty: '北京新光批发', date: generateDate(5), note: '' },
  { id: 't21', type: 'inbound', itemId: '1', quantity: 80, unitPrice: 22, counterparty: '东莞织梦厂', date: generateDate(3), note: '追加补货' },
  { id: 't22', type: 'outbound', itemId: '3', quantity: 20, unitPrice: 68, counterparty: '杭州四季批发', date: generateDate(2), note: '' },
  { id: 't23', type: 'inbound', itemId: '5', quantity: 30, unitPrice: 42, counterparty: '佛山牛仔坊', date: generateDate(1), note: '' },
  { id: 't24', type: 'outbound', itemId: '1', quantity: 60, unitPrice: 25, counterparty: '义乌批发市场', date: generateDate(1), note: '' },
];

const seedPOs: PurchaseOrder[] = [
  {
    id: 'po1', poNumber: 'PO-2026-001',
    items: [{ itemId: '3', quantity: 100, unitPrice: 55 }],
    supplier: '广州棉纺源', status: 'received',
    createdDate: generateDate(30), expectedDate: generateDate(20), note: '卫衣补货',
  },
  {
    id: 'po2', poNumber: 'PO-2026-002',
    items: [{ itemId: '5', quantity: 80, unitPrice: 42 }, { itemId: '6', quantity: 50, unitPrice: 48 }],
    supplier: '佛山牛仔坊', status: 'approved',
    createdDate: generateDate(10), expectedDate: generateDate(3), note: '牛仔裤补货',
  },
  {
    id: 'po3', poNumber: 'PO-2026-003',
    items: [{ itemId: '8', quantity: 60, unitPrice: 35 }],
    supplier: '东莞织梦厂', status: 'pending',
    createdDate: generateDate(5), expectedDate: generateDate(0), note: 'Polo衫紧急采购',
  },
  {
    id: 'po4', poNumber: 'PO-2026-004',
    items: [{ itemId: '1', quantity: 200, unitPrice: 22 }, { itemId: '2', quantity: 150, unitPrice: 22 }],
    supplier: '东莞织梦厂', status: 'draft',
    createdDate: generateDate(2), expectedDate: '', note: 'T恤大批采购',
  },
  {
    id: 'po5', poNumber: 'PO-2026-005',
    items: [{ itemId: '7', quantity: 40, unitPrice: 70 }],
    supplier: '苏州丝绸园', status: 'rejected',
    createdDate: generateDate(8), expectedDate: generateDate(1), note: '价格偏高',
  },
];

let txCounter = seedTransactions.length;
let poCounter = seedPOs.length;

export const useInventoryStore = create<InventoryState>((set) => ({
  currentRole: 'boss',
  items: seedItems,
  transactions: seedTransactions,
  purchaseOrders: seedPOs,

  setRole: (role) => set({ currentRole: role }),

  addTransaction: (tx) =>
    set((state) => {
      txCounter++;
      const newTx: Transaction = { ...tx, id: `t${txCounter}` };
      const updatedItems = state.items.map((item) => {
        if (item.id === tx.itemId) {
          const delta = tx.type === 'inbound' ? tx.quantity : -tx.quantity;
          return { ...item, stock: Math.max(0, item.stock + delta) };
        }
        return item;
      });
      return {
        transactions: [...state.transactions, newTx],
        items: updatedItems,
      };
    }),

  createPO: (po) =>
    set((state) => {
      poCounter++;
      const newPO: PurchaseOrder = { ...po, id: `po${poCounter}` };
      return { purchaseOrders: [...state.purchaseOrders, newPO] };
    }),

  updatePOStatus: (poNumber, status) =>
    set((state) => ({
      purchaseOrders: state.purchaseOrders.map((po) =>
        po.poNumber === poNumber ? { ...po, status } : po
      ),
    })),
}));
