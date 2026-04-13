import { useState } from 'react';
import { StockBadge } from '@/components/StatusBadge';
import { getStockStatus } from '@/lib/stockStatus';
import type { StockStatus } from '@/types/inventory';
import { Search, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useInventoryData';

export default function Inventory() {
  const { data: items = [], isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | StockStatus>('all');

  const filtered = items.filter((item) => {
    const matchSearch = item.name.includes(search) || item.sku.includes(search) || item.spec.includes(search);
    const status = getStockStatus(item.stock, item.threshold);
    const matchFilter = filter === 'all' || status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h2 className="text-xl font-bold text-foreground">库存管理</h2>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="搜索品名、SKU、规格..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mint/50 shadow-card" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | StockStatus)}
          className="bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-mint/50 shadow-card">
          <option value="all">全部状态</option>
          <option value="normal">正常</option>
          <option value="warning">预警</option>
          <option value="critical">告急</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">SKU编号</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">品名</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">品类</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">规格</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground text-xs">库存</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground text-xs">预警阈值</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground text-xs">单价</th>
                  <th className="text-center py-3 px-5 font-medium text-muted-foreground text-xs">状态</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const status = getStockStatus(item.stock, item.threshold);
                  return (
                    <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                      <td className="py-3 px-5 font-medium text-card-foreground">{item.name}</td>
                      <td className="py-3 px-5 text-muted-foreground">{item.category}</td>
                      <td className="py-3 px-5 text-muted-foreground">{item.spec}</td>
                      <td className="py-3 px-5 text-right font-semibold text-card-foreground">{item.stock}</td>
                      <td className="py-3 px-5 text-right text-muted-foreground">{item.threshold}</td>
                      <td className="py-3 px-5 text-right text-card-foreground">¥{item.unitPrice}</td>
                      <td className="py-3 px-5 text-center"><StockBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-12 text-center">没有找到匹配的商品</p>
          )}
        </div>
      )}
    </div>
  );
}
