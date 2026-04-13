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

  const recentTxs = [...transactions].slice(0, 20);

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
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h2 className="text-xl font-bold text-foreground">工作台</h2>

      {/* === BENTO GRID === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
        {/* Row 1: Stats cards (small) + chart (tall, spans 2 rows) */}
        <StatsCard title="总 SKU 数" value={items.length} icon={Package} />
        <StatsCard title="预警商品" value={warningItems.length} icon={AlertTriangle} variant="warning" subtitle={warningItems.length > 0 ? '需要关注' : '状态良好'} />

        {/* Chart card - spans 2 cols on lg, 3 rows to align with left cards */}
        <div className="col-span-2 row-span-3 bg-[#1A1A2E] rounded-3xl p-6 shadow-card transition-all duration-300 hover:shadow-elevated flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-white/60">月度进出趋势</h3>
            <span className="text-[10px] text-white/30 bg-white/10 px-2.5 py-1 rounded-full">近6月</span>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <p className="text-3xl font-bold text-white">¥{(monthInbound + monthOutbound).toLocaleString()}</p>
            <p className="text-xs text-white/40 pb-1">本月总流水</p>
          </div>
          <ResponsiveContainer width="100%" className="flex-1 min-h-0" height="100%">
            <BarChart data={miniChartData} barGap={4}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                formatter={(value: number) => `¥${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', color: '#1A1A1A', fontSize: '12px' }}
              />
              <Bar dataKey="inbound" name="入库" fill="#A4F5A6" radius={[6, 6, 2, 2]} />
              <Bar dataKey="outbound" name="出库" fill="#B3A1FF" radius={[6, 6, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Row 2: More stats */}
        <StatsCard title="本月入库额" value={`¥${monthInbound.toLocaleString()}`} icon={ArrowDownToLine} variant="lavender" subtitle="采购支出" />
        <StatsCard title="本月出库额" value={`¥${monthOutbound.toLocaleString()}`} icon={ArrowUpFromLine} variant="mint" subtitle="销售收入" />

        {isBoss && (
          <>
            <StatsCard title="库存总值" value={`¥${totalValue.toLocaleString()}`} icon={DollarSign} />
            <StatsCard title="待审批采购单" value={pendingPOs.length} icon={Clock} variant="dark" subtitle={pendingPOs.length > 0 ? '需要处理' : '无待办'} />
          </>
        )}
      </div>

      {/* === CONTENT CARDS ROW === */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Inventory warnings - wider */}
        <div className="lg:col-span-3 bg-card rounded-3xl shadow-card p-6 border border-border/50 transition-all duration-300 hover:shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">库存预警</h3>
            <Link to="/inventory" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">查看全部</Link>
          </div>
          {warningItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">库存状态良好</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-2 font-medium text-muted-foreground text-xs">品名</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground text-xs">库存</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground text-xs">阈值</th>
                    <th className="text-right py-2.5 px-2 font-medium text-muted-foreground text-xs">状态</th>
                    {isPurchasing && <th className="text-right py-2.5 px-2 font-medium text-muted-foreground text-xs">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {warningItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-2 text-card-foreground">{item.name} <span className="text-muted-foreground">{item.spec}</span></td>
                      <td className="py-2.5 px-2 text-right font-semibold text-card-foreground">{item.stock}</td>
                      <td className="py-2.5 px-2 text-right text-muted-foreground">{item.threshold}</td>
                      <td className="py-2.5 px-2 text-right"><StockBadge status={getStockStatus(item.stock, item.threshold)} /></td>
                      {isPurchasing && (
                        <td className="py-2.5 px-2 text-right">
                          <Link
                            to={`/purchase-orders?prefill=${item.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mint/30 text-foreground text-[11px] font-medium hover:bg-mint/50 transition-all"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            采购
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

        {/* Recent transactions - narrower */}
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-card p-6 border border-border/50 transition-all duration-300 hover:shadow-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">最近流水</h3>
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {recentTxs.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${tx.type === 'inbound' ? 'bg-mint/30' : 'bg-lavender/30'}`}>
                    {tx.type === 'inbound'
                      ? <ArrowDownToLine className="w-3.5 h-3.5 text-foreground/70" />
                      : <ArrowUpFromLine className="w-3.5 h-3.5 text-foreground/70" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-card-foreground leading-tight truncate">{getItemName(tx.itemId)}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{tx.date}</span>
                      {tx.counterparty && (
                        <>
                          <span className="text-[10px] text-muted-foreground/40">|</span>
                          <span className="text-[10px] text-muted-foreground truncate">{tx.counterparty}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-3">
                  <span className={`text-xs font-semibold ${tx.type === 'inbound' ? 'text-success' : 'text-destructive'}`}>
                    {tx.type === 'inbound' ? '+' : '-'}{tx.quantity}
                  </span>
                  <span className="text-[10px] text-muted-foreground">¥{(tx.quantity * tx.unitPrice).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {recentTxs.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">暂无交易记录</p>
            )}
          </div>
        </div>
      </div>

      {/* === BOSS: Pending POs === */}
      {isBoss && pendingPOs.length > 0 && (
        <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50 transition-all duration-300 hover:shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">待审批采购单</h3>
            <Link to="/purchase-orders" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">查看全部</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingPOs.map((po) => (
              <div key={po.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors">
                <div>
                  <span className="text-sm font-medium text-card-foreground">{po.poNumber}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{po.supplier}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-card-foreground">
                    ¥{po.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toLocaleString()}
                  </span>
                  <div className="mt-1"><POBadge status={po.status} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
