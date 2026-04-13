import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InventoryItem, Transaction, PurchaseOrder, POStatus } from '@/types/inventory';

// =====================
// Mappers
// =====================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): InventoryItem {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    spec: row.spec,
    stock: row.stock,
    threshold: row.threshold,
    unitPrice: Number(row.unit_price),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type as 'inbound' | 'outbound',
    itemId: row.product_id,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    counterparty: row.counterparty,
    date: row.date,
    note: row.note || '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPO(row: any): PurchaseOrder {
  return {
    id: row.id,
    poNumber: row.po_number,
    supplier: row.supplier,
    status: row.status as POStatus,
    createdDate: row.created_date,
    expectedDate: row.expected_date || '',
    note: row.note || '',
    items: (row.purchase_order_items || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => ({
        itemId: item.product_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      })
    ),
  };
}

// =====================
// Queries
// =====================
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sku');
      if (error) throw error;
      return data.map(mapProduct);
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(mapTransaction);
    },
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`*, purchase_order_items (id, product_id, quantity, unit_price)`)
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data.map(mapPO);
    },
  });
}

// =====================
// Mutations
// =====================
export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<Transaction, 'id'>) => {
      const { error } = await supabase.rpc('add_transaction', {
        p_type: tx.type,
        p_product_id: tx.itemId,
        p_quantity: tx.quantity,
        p_unit_price: tx.unitPrice,
        p_counterparty: tx.counterparty,
        p_date: tx.date,
        p_note: tx.note || '',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useCreatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (po: Omit<PurchaseOrder, 'id'>) => {
      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: po.poNumber,
          supplier: po.supplier,
          status: po.status,
          created_date: po.createdDate,
          expected_date: po.expectedDate || null,
          note: po.note,
        })
        .select()
        .single();
      if (poError) throw poError;

      if (po.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(
            po.items.map((item) => ({
              po_id: newPO.id,
              product_id: item.itemId,
              quantity: item.quantity,
              unit_price: item.unitPrice,
            }))
          );
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_orders'] });
    },
  });
}

export function useReceivePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ poNumber }: { poNumber: string }) => {
      // 1. Fetch PO with items
      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .select(`*, purchase_order_items (product_id, quantity, unit_price)`)
        .eq('po_number', poNumber)
        .single();
      if (poErr) throw poErr;

      // 2. For each PO item, create an inbound transaction via RPC
      for (const item of po.purchase_order_items) {
        const { error: txErr } = await supabase.rpc('add_transaction', {
          p_type: 'inbound',
          p_product_id: item.product_id,
          p_quantity: item.quantity,
          p_unit_price: Number(item.unit_price),
          p_counterparty: po.supplier || '',
          p_date: new Date().toISOString().split('T')[0],
          p_note: `采购单收货 - ${po.po_number}`,
        });
        if (txErr) throw txErr;
      }

      // 3. Update PO status to received
      const { error: statusErr } = await supabase
        .from('purchase_orders')
        .update({ status: 'received' })
        .eq('po_number', poNumber);
      if (statusErr) throw statusErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdatePOStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ poNumber, status }: { poNumber: string; status: POStatus }) => {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('po_number', poNumber);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_orders'] });
    },
  });
}
