import { useMemo, useState } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { StockBadge } from '@/components/StatusBadge';
import { getStockStatus } from '@/lib/stockStatus';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts';

const COLORS = ['hsl(230,55%,30%)', 'hsl(38,92%,50%)', 'hsl(160,60%,40%)', 'hsl(0,72%,51%)', 'hsl(270,50%,55%)', 'hsl(190,60%,45%)', 'hsl(340,60%,50%)'];

type TabKey = 'overview' | 'category' | 'health' | 'reconciliation';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '进出总览' },
  { key: 'category', label: '品类分析' },
  { key: 'health', label: '库存健康' },
  { key: 'reconciliation', label: '差异对账' },
];

export default function Reports() {
  const { items, transactions } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Month data for 6 months
  const monthlyData = useMemo(() => {
    const result: { month: string; key: string; inbound: number; outbound: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      result.push({ month: `${d.getMonth() + 1}月`, key, inbound: 0, outbound: 0 });
    }
    transactions.forEach((t) => {
      const k = t.date.slice(0, 7);
      const entry = result.find((r) => r.key === k);
      if (entry) {
        const val = t.quantity * t.unitPrice;
        if (t.type === 'inbound') entry.inbound += val;
        else entry.outbound += val;
      }
    });
    return result;
  }, [transactions]);

  // Daily data for current month
  const dailyData = useMemo(() => {
    const now = new Date();
    const days: Record<string, { day: string; inbound: number; outbound: number }> = {};
    for (let i = 1; i <= now.getDate(); i++) {
      const day = String(i);
      const dateKey = `${now.toISOString().slice(0, 8)}${String(i).padStart(2, '0')}`;
      days[dateKey] = { day: `${i}日`, inbound: 0, outbound: 0 };
    }
    transactions.forEach((t) => {
      if (days[t.date]) {
        if (t.type === 'inbound') days[t.date].inbound += t.quantity;
        else days[t.date].outbound += t.quantity;
      }
    });
    return Object.values(days);
  }, [transactions]);

  // Summary stats
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentEntry = monthlyData.find((m) => m.key === currentMonthKey);
  const prevEntry = monthlyData[monthlyData.length - 2];
  const monthInbound = currentEntry?.inbound || 0;
  const monthOutbound = currentEntry?.outbound || 0;
  const netFlow = monthInbound - monthOutbound;
  const prevTotal = (prevEntry?.inbound || 0) + (prevEntry?.outbound || 0);
  const currTotal = monthInbound + monthOutbound;
  const growthRate = prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal * 100).toFixed(1) : '0';

  // Category analysis
  const categoryData = useMemo(() => {
    const cats: Record<string, { category: string; skuCount: number; totalQty: number; totalValue: number }> = {};
    items.forEach((item) => {
      if (!cats[item.category]) {
        cats[item.category] = { category: item.category, skuCount: 0, totalQty: 0, totalValue: 0 };
      }
      cats[item.category].skuCount++;
      cats[item.category].totalQty += item.stock;
      cats[item.category].totalValue += item.stock * item.unitPrice;
    });
    const arr = Object.values(cats);
    const totalVal = arr.reduce((s, c) => s + c.totalValue, 0);
    return arr.map((c) => ({ ...c, ratio: totalVal > 0 ? ((c.totalValue / totalVal) * 100).toFixed(1) : '0' }));
  }, [items]);

  // Top 5 by outbound quantity
  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.filter((t) => t.type === 'outbound').forEach((t) => {
      counts[t.itemId] = (counts[t.itemId] || 0) + t.quantity;
    });
    return Object.entries(counts)
      .map(([id, qty]) => ({ name: items.find((i) => i.id === id)?.name || id, quantity: qty }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [items, transactions]);

  // Health distribution
  const healthDist = useMemo(() => {
    let normal = 0, warning = 0, critical = 0;
    items.forEach((i) => {
      const s = getStockStatus(i.stock, i.threshold);
      if (s === 'normal') normal++;
      else if (s === 'warning') warning++;
      else critical++;
    });
    return [
      { name: '正常', value: normal, fill: 'hsl(160,60%,40%)' },
      { name: '预警', value: warning, fill: 'hsl(38,92%,50%)' },
      { name: '告急', value: critical, fill: 'hsl(0,72%,51%)' },
    ];
  }, [items]);

  const alertItems = items.filter((i) => getStockStatus(i.stock, i.threshold) !== 'normal');

  // Stock history (simulated 30 days)
  const stockHistory = useMemo(() => {
    const base = items.reduce((s, i) => s + i.stock, 0);
    const data: { day: string; total: number }[] = [];
    for (let i = 30; i >= 0; i--) {
      const jitter = Math.round((Math.random() - 0.5) * base * 0.08);
      data.push({ day: `${30 - i}`, total: base + jitter + i * 3 });
    }
    return data;
  }, [items]);

  // Reconciliation data (simulated discrepancies)
  const reconData = useMemo(() => {
    return items.map((item) => {
      const inbound = transactions.filter((t) => t.itemId === item.id && t.type === 'inbound').reduce((s, t) => s + t.quantity, 0);
      const outbound = transactions.filter((t) => t.itemId === item.id && t.type === 'outbound').reduce((s, t) => s + t.quantity, 0);
      const openingStock = item.stock - inbound + outbound;
      const theoreticalClose = openingStock + inbound - outbound;
      const discrepancy = item.stock - theoreticalClose;
      // Add slight random discrepancy for demo
      const simulatedDisc = item.id === '3' ? -5 : item.id === '5' ? -3 : item.id === '8' ? 2 : 0;
      return {
        id: item.id,
        name: item.name,
        spec: item.spec,
        opening: openingStock,
        inbound,
        outbound,
        theoreticalClose,
        actualClose: item.stock + simulatedDisc,
        discrepancy: simulatedDisc,
      };
    });
  }, [items, transactions]);

  const discChartData = reconData.filter((r) => r.discrepancy !== 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">对账报表</h2>

      <div className="flex items-center gap-1 bg-card rounded-lg p-1 shadow-card w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-card rounded-lg shadow-card p-5">
            <h3 className="text-base font-semibold mb-4">月度进出金额对比（近6月）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="inbound" name="入库金额" fill="hsl(230,55%,30%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" name="出库金额" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg shadow-card p-5">
            <h3 className="text-base font-semibold mb-4">本月每日进出数量趋势</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="inbound" name="入库" stroke="hsl(230,55%,30%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="outbound" name="出库" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-sm text-muted-foreground">本月入库总额</p>
              <p className="text-xl font-bold text-primary mt-1">¥{monthInbound.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-sm text-muted-foreground">本月出库总额</p>
              <p className="text-xl font-bold text-warning mt-1">¥{monthOutbound.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-sm text-muted-foreground">净流入</p>
              <p className={`text-xl font-bold mt-1 ${netFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netFlow >= 0 ? '+' : ''}¥{netFlow.toLocaleString()}
              </p>
            </div>
            <div className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-sm text-muted-foreground">环比增长</p>
              <p className="text-xl font-bold mt-1">{growthRate}%</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'category' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg shadow-card p-5">
              <h3 className="text-base font-semibold mb-4">库存金额品类占比</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} dataKey="totalValue" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category, ratio }) => `${category} ${ratio}%`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-lg shadow-card p-5">
              <h3 className="text-base font-semibold mb-4">Top 5 热销商品</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProducts} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantity" name="出库量" fill="hsl(230,55%,30%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="text-base font-semibold">品类明细</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b-2">
                    <th className="text-left py-3 px-4 font-semibold">品类</th>
                    <th className="text-right py-3 px-4 font-semibold">SKU数</th>
                    <th className="text-right py-3 px-4 font-semibold">库存总量</th>
                    <th className="text-right py-3 px-4 font-semibold">库存金额</th>
                    <th className="text-right py-3 px-4 font-semibold">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((cat, idx) => (
                    <tr key={cat.category} className={`border-b last:border-0 ${idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                      <td className="py-3 px-4 font-medium">{cat.category}</td>
                      <td className="py-3 px-4 text-right">{cat.skuCount}</td>
                      <td className="py-3 px-4 text-right">{cat.totalQty}</td>
                      <td className="py-3 px-4 text-right font-semibold">¥{cat.totalValue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{cat.ratio}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg shadow-card p-5">
              <h3 className="text-base font-semibold mb-4">库存状态分布</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={healthDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}>
                    {healthDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-lg shadow-card p-5">
              <h3 className="text-base font-semibold mb-4">库存总量变化趋势（近30天）</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stockHistory}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" name="库存总量" stroke="hsl(230,55%,30%)" fill="hsl(230,55%,30%)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="text-base font-semibold">预警/告急商品</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b-2">
                    <th className="text-left py-3 px-4 font-semibold">SKU</th>
                    <th className="text-left py-3 px-4 font-semibold">品名</th>
                    <th className="text-right py-3 px-4 font-semibold">当前库存</th>
                    <th className="text-right py-3 px-4 font-semibold">预警阈值</th>
                    <th className="text-right py-3 px-4 font-semibold">缺口</th>
                    <th className="text-center py-3 px-4 font-semibold">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {alertItems.map((item, idx) => (
                    <tr key={item.id} className={`border-b last:border-0 ${idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                      <td className="py-3 px-4 font-mono text-xs">{item.sku}</td>
                      <td className="py-3 px-4">{item.name} <span className="text-muted-foreground">{item.spec}</span></td>
                      <td className="py-3 px-4 text-right font-semibold">{item.stock}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{item.threshold}</td>
                      <td className="py-3 px-4 text-right text-destructive font-semibold">{item.stock - item.threshold}</td>
                      <td className="py-3 px-4 text-center"><StockBadge status={getStockStatus(item.stock, item.threshold)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {alertItems.length === 0 && <p className="text-sm text-muted-foreground py-12 text-center">库存状态良好</p>}
          </div>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          {discChartData.length > 0 && (
            <div className="bg-card rounded-lg shadow-card p-5">
              <h3 className="text-base font-semibold mb-4">差异值分布</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={discChartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <ReferenceLine y={0} stroke="hsl(220,10%,70%)" />
                  <Bar dataKey="discrepancy" name="差异">
                    {discChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.discrepancy > 0 ? 'hsl(160,60%,40%)' : 'hsl(0,72%,51%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="text-base font-semibold">差异对账明细</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b-2">
                    <th className="text-left py-3 px-4 font-semibold">商品</th>
                    <th className="text-right py-3 px-4 font-semibold">期初库存</th>
                    <th className="text-right py-3 px-4 font-semibold">入库</th>
                    <th className="text-right py-3 px-4 font-semibold">出库</th>
                    <th className="text-right py-3 px-4 font-semibold">理论期末</th>
                    <th className="text-right py-3 px-4 font-semibold">实际库存</th>
                    <th className="text-right py-3 px-4 font-semibold">差异</th>
                  </tr>
                </thead>
                <tbody>
                  {reconData.map((row, idx) => (
                    <tr key={row.id} className={`border-b last:border-0 ${row.discrepancy !== 0 ? 'bg-destructive-bg' : idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                      <td className="py-3 px-4 font-medium">{row.name} <span className="text-muted-foreground">{row.spec}</span></td>
                      <td className="py-3 px-4 text-right">{row.opening}</td>
                      <td className="py-3 px-4 text-right text-success">+{row.inbound}</td>
                      <td className="py-3 px-4 text-right text-destructive">-{row.outbound}</td>
                      <td className="py-3 px-4 text-right">{row.theoreticalClose}</td>
                      <td className="py-3 px-4 text-right font-semibold">{row.actualClose}</td>
                      <td className={`py-3 px-4 text-right font-bold ${row.discrepancy !== 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {row.discrepancy > 0 ? `+${row.discrepancy}` : row.discrepancy}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-secondary/50 font-semibold">
                    <td className="py-3 px-4">合计</td>
                    <td className="py-3 px-4 text-right">{reconData.reduce((s, r) => s + r.opening, 0)}</td>
                    <td className="py-3 px-4 text-right text-success">+{reconData.reduce((s, r) => s + r.inbound, 0)}</td>
                    <td className="py-3 px-4 text-right text-destructive">-{reconData.reduce((s, r) => s + r.outbound, 0)}</td>
                    <td className="py-3 px-4 text-right">{reconData.reduce((s, r) => s + r.theoreticalClose, 0)}</td>
                    <td className="py-3 px-4 text-right">{reconData.reduce((s, r) => s + r.actualClose, 0)}</td>
                    <td className={`py-3 px-4 text-right font-bold ${reconData.reduce((s, r) => s + r.discrepancy, 0) !== 0 ? 'text-destructive' : ''}`}>
                      {reconData.reduce((s, r) => s + r.discrepancy, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
