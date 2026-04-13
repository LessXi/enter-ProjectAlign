import type { StockStatus } from '@/types/inventory';

export function getStockStatus(stock: number, threshold: number): StockStatus {
  if (stock <= threshold * 0.3) return 'critical';
  if (stock <= threshold) return 'warning';
  return 'normal';
}
