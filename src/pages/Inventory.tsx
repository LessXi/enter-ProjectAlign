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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">库存管理</h2>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-card-foreground/30" />
          <input
            type="text"
            placeholder="搜索品名、SKU、规格..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-card-foreground placeholder:text-card-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | StockStatus)}
          className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">全部状态</option>
          <option value="normal">正常</option>
          <option value="warning">预警</option>
          <option value="critical">告急</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-foreground/10">
                  <th className="text-left py-3.5 px-5 font-semibold text-card-foreground/50">SKU编号</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-card-foreground/50">品名</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-card-foreground/50">品类</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-card-foreground/50">规格</th>
                  <th className="text-right py-3.5 px-5 font-semibold text-card-foreground/50">库存</th>
                  <th className="text-right py-3.5 px-5 font-semibold text-card-foreground/50">预警阈值</th>
                  <th className="text-right py-3.5 px-5 font-semibold text-card-foreground/50">单价</th>
                  <th className="text-center py-3.5 px-5 font-semibold text-card-foreground/50">状态</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const status = getStockStatus(item.stock, item.threshold);
                  return (
                    <tr key={item.id} className={`border-b border-card-foreground/5 last:border-0 hover:bg-card-foreground/5 transition-colors ${idx % 2 === 1 ? 'bg-card-foreground/[0.02]' : ''}`}>
                      <td className="py-3.5 px-5 font-mono text-xs text-card-foreground/60">{item.sku}</td>
                      <td className="py-3.5 px-5 font-medium text-card-foreground">{item.name}</td>
                      <td className="py-3.5 px-5 text-card-foreground/50">{item.category}</td>
                      <td className="py-3.5 px-5 text-card-foreground/50">{item.spec}</td>
                      <td className="py-3.5 px-5 text-right font-semibold text-card-foreground">{item.stock}</td>
                      <td className="py-3.5 px-5 text-right text-card-foreground/40">{item.threshold}</td>
                      <td className="py-3.5 px-5 text-right text-card-foreground">¥{item.unitPrice}</td>
                      <td className="py-3.5 px-5 text-center"><StockBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-card-foreground/40 py-12 text-center">没有找到匹配的商品</p>
          )}
        </div>
      )}
    </div>
  );
}
