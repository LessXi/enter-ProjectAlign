import { useInventoryStore } from '@/store/inventoryStore';
import { StatsCard } from '@/components/StatsCard';
import { StockBadge, POBadge } from '@/components/StatusBadge';
import { getStockStatus } from '@/lib/stockStatus';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, DollarSign, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { useProducts, useTransactions, usePurchaseOrders } from '@/hooks/useInventoryData';

export default function Dashboard() {
  const { currentRole } = useInventoryStore();
  const { data: items = [], isLoading: loadingItems } = useProducts();
  const { data: transactions = [], isLoading: loadingTx } = useTransactions();
  const { data: purchaseOrders = [], isLoading: loadingPOs } = usePurchaseOrders();

  const isLoading = loadingItems || loadingTx || loadingPOs;

  const warningItems = items.filter((i) => getStockStatus(i.stock, i.threshold) !== 'normal');

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTxs = transactions.filter((t) => t.date.startsWith(thisMonth));
  const monthInbound = monthTxs.filter((t) => t.type === 'inbound').reduce((s, t) => s + t.quantity * t.unitPrice, 0);
  const monthOutbound = monthTxs.filter((t) => t.type === 'outbound').reduce((s, t) => s + t.quantity * t.unitPrice, 0);
  const totalValue = items.reduce((s, i) => s + i.stock * i.unitPrice, 0);
  const pendingPOs = purchaseOrders.filter((po) => po.status === 'pending');

  const recentTxs = [...transactions].slice(0, 5);

  const miniChartData = useMemo(() => {
    const months: Record<string, { month: string; inbound: number; outbound: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = `${d.getMonth() + 1}月`;
      months[key] = { month: label, inbound: 0, outbound: 0 };
    }
    transactions.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (months[key]) {
        const val = t.quantity * t.unitPrice;
        if (t.type === 'inbound') months[key].inbound += val;
        else months[key].outbound += val;
      }
    });
    return Object.values(months);
  }, [transactions]);

  const getItemName = (id: string) => items.find((i) => i.id === id)?.name || id;

  const isBoss = currentRole === 'boss';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">工作台</h2>

      <div className={`grid gap-4 ${isBoss ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <StatsCard title="总 SKU 数" value={items.length} icon={Package} iconClassName="bg-primary/10 text-primary" />
        <StatsCard title="预警商品" value={warningItems.length} icon={AlertTriangle} iconClassName="bg-warning-bg text-warning" />
        {isBoss && (
          <StatsCard
            title="库存总值"
            value={`¥${totalValue.toLocaleString()}`}
            icon={DollarSign}
            iconClassName="bg-success-bg text-success"
          />
        )}
        <StatsCard title="本月入库额" value={`¥${monthInbound.toLocaleString()}`} icon={ArrowDownToLine} iconClassName="bg-info-bg text-info" />
        <StatsCard title="本月出库额" value={`¥${monthOutbound.toLocaleString()}`} icon={ArrowUpFromLine} iconClassName="bg-destructive-bg text-destructive" />
        {isBoss && (
          <StatsCard
            title="待审批采购单"
            value={pendingPOs.length}
            icon={Clock}
            iconClassName="bg-info-bg text-info"
          />
        )}
      </div>

      {isBoss && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg shadow-card p-5">
            <h3 className="text-base font-semibold mb-4">月度进出趋势</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={miniChartData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                <Bar dataKey="inbound" name="入库" fill="hsl(230, 55%, 30%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" name="出库" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">待审批采购单</h3>
              <Link to="/purchase-orders" className="text-xs text-primary hover:underline">查看全部</Link>
            </div>
            {pendingPOs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">暂无待审批采购单</p>
            ) : (
              <div className="space-y-3">
                {pendingPOs.map((po) => (
                  <div key={po.id} className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-md">
                    <div>
                      <span className="text-sm font-medium">{po.poNumber}</span>
                      <span className="text-xs text-muted-foreground ml-2">{po.supplier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        ¥{po.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toLocaleString()}
                      </span>
                      <POBadge status={po.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">库存预警</h3>
            <Link to="/inventory" className="text-xs text-primary hover:underline">查看全部</Link>
          </div>
          {warningItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">库存状态良好</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold text-muted-foreground">品名</th>
                    <th className="text-right py-2 font-semibold text-muted-foreground">库存</th>
                    <th className="text-right py-2 font-semibold text-muted-foreground">阈值</th>
                    <th className="text-right py-2 font-semibold text-muted-foreground">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {warningItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">{item.name} <span className="text-muted-foreground">{item.spec}</span></td>
                      <td className="py-2 text-right font-medium">{item.stock}</td>
                      <td className="py-2 text-right text-muted-foreground">{item.threshold}</td>
                      <td className="py-2 text-right"><StockBadge status={getStockStatus(item.stock, item.threshold)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg shadow-card p-5">
          <h3 className="text-base font-semibold mb-4">最近流水</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold text-muted-foreground">类型</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">品名</th>
                  <th className="text-right py-2 font-semibold text-muted-foreground">数量</th>
                  <th className="text-right py-2 font-semibold text-muted-foreground">日期</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-2">
                      <span className={tx.type === 'inbound' ? 'text-success font-medium' : 'text-destructive font-medium'}>
                        {tx.type === 'inbound' ? '入库' : '出库'}
                      </span>
                    </td>
                    <td className="py-2">{getItemName(tx.itemId)}</td>
                    <td className="py-2 text-right font-medium">
                      {tx.type === 'inbound' ? '+' : '-'}{tx.quantity}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
