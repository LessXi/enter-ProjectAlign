import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/StatsCard';
import { StockBadge, POBadge } from '@/components/StatusBadge';
import { getStockStatus } from '@/lib/stockStatus';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, DollarSign, Clock, Loader2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { useProducts, useTransactions, usePurchaseOrders } from '@/hooks/useInventoryData';

export default function Dashboard() {
  const { role: currentRole } = useAuth();
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
  const isPurchasing = currentRole === 'purchasing';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">工作台</h2>

      <div className={`grid gap-4 ${isBoss ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <StatsCard title="总 SKU 数" value={items.length} icon={Package} iconClassName="bg-primary/20 text-primary" />
        <StatsCard title="预警商品" value={warningItems.length} icon={AlertTriangle} iconClassName="bg-warning/20 text-warning" />
        {isBoss && (
          <StatsCard title="库存总值" value={`¥${totalValue.toLocaleString()}`} icon={DollarSign} iconClassName="bg-primary/20 text-primary" />
        )}
        <StatsCard title="本月入库额" value={`¥${monthInbound.toLocaleString()}`} icon={ArrowDownToLine} iconClassName="bg-warning/20 text-warning" />
        <StatsCard title="本月出库额" value={`¥${monthOutbound.toLocaleString()}`} icon={ArrowUpFromLine} iconClassName="bg-primary/20 text-primary" />
        {isBoss && (
          <StatsCard title="待审批采购单" value={pendingPOs.length} icon={Clock} iconClassName="bg-accent/20 text-accent" />
        )}
      </div>

      {isBoss && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl shadow-card p-6 transition-all duration-300 hover:shadow-elevated">
            <h3 className="text-base font-semibold text-card-foreground mb-4">月度进出趋势</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={miniChartData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(0,0%,50%)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="inbound" name="入库" fill="hsl(125, 85%, 81%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="outbound" name="出库" fill="hsl(255, 48%, 81%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-6 transition-all duration-300 hover:shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-card-foreground">待审批采购单</h3>
              <Link to="/purchase-orders" className="text-xs text-primary hover:brightness-90 font-medium">查看全部</Link>
            </div>
            {pendingPOs.length === 0 ? (
              <p className="text-sm text-card-foreground/40 py-8 text-center">暂无待审批采购单</p>
            ) : (
              <div className="space-y-3">
                {pendingPOs.map((po) => (
                  <div key={po.id} className="flex items-center justify-between py-2.5 px-4 bg-card-foreground/5 rounded-xl transition-all duration-200 hover:bg-card-foreground/10">
                    <div>
                      <span className="text-sm font-medium text-card-foreground">{po.poNumber}</span>
                      <span className="text-xs text-card-foreground/40 ml-2">{po.supplier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-card-foreground">
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
        <div className="bg-card rounded-2xl shadow-card p-6 transition-all duration-300 hover:shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-card-foreground">库存预警</h3>
            <Link to="/inventory" className="text-xs text-primary hover:brightness-90 font-medium">查看全部</Link>
          </div>
          {warningItems.length === 0 ? (
            <p className="text-sm text-card-foreground/40 py-8 text-center">库存状态良好</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-foreground/10">
                    <th className="text-left py-2.5 font-semibold text-card-foreground/50">品名</th>
                    <th className="text-right py-2.5 font-semibold text-card-foreground/50">库存</th>
                    <th className="text-right py-2.5 font-semibold text-card-foreground/50">阈值</th>
                    <th className="text-right py-2.5 font-semibold text-card-foreground/50">状态</th>
                    {isPurchasing && <th className="text-right py-2.5 font-semibold text-card-foreground/50">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {warningItems.map((item) => (
                    <tr key={item.id} className="border-b border-card-foreground/5 last:border-0">
                      <td className="py-2.5 text-card-foreground">{item.name} <span className="text-card-foreground/40">{item.spec}</span></td>
                      <td className="py-2.5 text-right font-medium text-card-foreground">{item.stock}</td>
                      <td className="py-2.5 text-right text-card-foreground/40">{item.threshold}</td>
                      <td className="py-2.5 text-right"><StockBadge status={getStockStatus(item.stock, item.threshold)} /></td>
                      {isPurchasing && (
                        <td className="py-2.5 text-right">
                          <Link
                            to={`/purchase-orders?prefill=${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-all duration-200"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            去采购
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 transition-all duration-300 hover:shadow-elevated">
          <h3 className="text-base font-semibold text-card-foreground mb-4">最近流水</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-foreground/10">
                  <th className="text-left py-2.5 font-semibold text-card-foreground/50">类型</th>
                  <th className="text-left py-2.5 font-semibold text-card-foreground/50">品名</th>
                  <th className="text-right py-2.5 font-semibold text-card-foreground/50">数量</th>
                  <th className="text-right py-2.5 font-semibold text-card-foreground/50">日期</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.map((tx) => (
                  <tr key={tx.id} className="border-b border-card-foreground/5 last:border-0">
                    <td className="py-2.5">
                      <span className={tx.type === 'inbound' ? 'text-primary font-medium' : 'text-destructive font-medium'}>
                        {tx.type === 'inbound' ? '入库' : '出库'}
                      </span>
                    </td>
                    <td className="py-2.5 text-card-foreground">{getItemName(tx.itemId)}</td>
                    <td className="py-2.5 text-right font-medium text-card-foreground">
                      {tx.type === 'inbound' ? '+' : '-'}{tx.quantity}
                    </td>
                    <td className="py-2.5 text-right text-card-foreground/40">{tx.date}</td>
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
