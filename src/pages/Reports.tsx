import { useMemo, useState } from 'react';
import { StockBadge } from '@/components/StatusBadge';
import { getStockStatus } from '@/lib/stockStatus';
import { Loader2, Calendar } from 'lucide-react';
import { useProducts, useTransactions } from '@/hooks/useInventoryData';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts';

const COLORS = ['hsl(230,55%,30%)', 'hsl(38,92%,50%)', 'hsl(160,60%,40%)', 'hsl(0,72%,51%)', 'hsl(270,50%,55%)', 'hsl(190,60%,45%)', 'hsl(340,60%,50%)'];

type TabKey = 'overview' | 'category' | 'health' | 'reconciliation';
type PresetKey = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '进出总览' },
  { key: 'category', label: '品类分析' },
  { key: 'health', label: '库存健康' },
  { key: 'reconciliation', label: '差异对账' },
];

const presets: { key: PresetKey; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
  { key: 'custom', label: '自定义' },
];

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getPresetRange(preset: PresetKey): { start: string; end: string } {
  const now = new Date();
  const today = toDateStr(now);

  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'week': {
      const d = new Date(now);
      const day = d.getDay() || 7; // Monday = 1
      d.setDate(d.getDate() - day + 1);
      return { start: toDateStr(d), end: today };
    }
    case 'month':
      return { start: `${today.slice(0, 7)}-01`, end: today };
    case 'quarter': {
      const month = now.getMonth();
      const quarterStart = new Date(now.getFullYear(), Math.floor(month / 3) * 3, 1);
      return { start: toDateStr(quarterStart), end: today };
    }
    case 'year':
      return { start: `${now.getFullYear()}-01-01`, end: today };
    default:
      return { start: `${today.slice(0, 7)}-01`, end: today };
  }
}

export default function Reports() {
  const { data: items = [], isLoading: loadingItems } = useProducts();
  const { data: transactions = [], isLoading: loadingTx } = useTransactions();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Date range state — default: 本月
  const [preset, setPreset] = useState<PresetKey>('month');
  const defaultRange = getPresetRange('month');
  const [customStart, setCustomStart] = useState(defaultRange.start);
  const [customEnd, setCustomEnd] = useState(defaultRange.end);

  const dateRange = useMemo(() =>
    preset === 'custom'
      ? { start: customStart, end: customEnd }
      : getPresetRange(preset),
    [preset, customStart, customEnd]
  );

  const isLoading = loadingItems || loadingTx;

  // Filter transactions by date range
  const filteredTx = useMemo(() =>
    transactions.filter((t) => t.date >= dateRange.start && t.date <= dateRange.end),
    [transactions, dateRange]
  );

  // Build month buckets for the selected range
  const monthlyData = useMemo(() => {
    const result: { month: string; key: string; inbound: number; outbound: number }[] = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const key = toDateStr(cursor).slice(0, 7);
      result.push({ month: `${cursor.getMonth() + 1}月`, key, inbound: 0, outbound: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    filteredTx.forEach((t) => {
      const k = t.date.slice(0, 7);
      const entry = result.find((r) => r.key === k);
      if (entry) {
        const val = t.quantity * t.unitPrice;
        if (t.type === 'inbound') entry.inbound += val;
        else entry.outbound += val;
      }
    });
    return result;
  }, [filteredTx, dateRange]);

  // Build daily buckets for the selected range
  const dailyData = useMemo(() => {
    const result: { day: string; date: string; inbound: number; outbound: number }[] = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const dateKey = toDateStr(new Date(cursor));
      result.push({ date: dateKey, day: `${cursor.getMonth() + 1}/${cursor.getDate()}`, inbound: 0, outbound: 0 });
    }
    filteredTx.forEach((t) => {
      const entry = result.find((r) => r.date === t.date);
      if (entry) {
        if (t.type === 'inbound') entry.inbound += t.quantity;
        else entry.outbound += t.quantity;
      }
    });
    return result;
  }, [filteredTx, dateRange]);

  const periodInbound = filteredTx.filter((t) => t.type === 'inbound').reduce((s, t) => s + t.quantity * t.unitPrice, 0);
  const periodOutbound = filteredTx.filter((t) => t.type === 'outbound').reduce((s, t) => s + t.quantity * t.unitPrice, 0);
  // 净现金流 = 出库收入 - 入库成本（出库赚钱，入库花钱）
  const netCashFlow = periodOutbound - periodInbound;
  const txCount = filteredTx.length;

  const categoryData = useMemo(() => {
    const cats: Record<string, { category: string; skuCount: number; totalQty: number; totalValue: number }> = {};
    items.forEach((item) => {
      if (!cats[item.category]) cats[item.category] = { category: item.category, skuCount: 0, totalQty: 0, totalValue: 0 };
      cats[item.category].skuCount++;
      cats[item.category].totalQty += item.stock;
      cats[item.category].totalValue += item.stock * item.unitPrice;
    });
    const arr = Object.values(cats);
    const totalVal = arr.reduce((s, c) => s + c.totalValue, 0);
    return arr.map((c) => ({ ...c, ratio: totalVal > 0 ? ((c.totalValue / totalVal) * 100).toFixed(1) : '0' }));
  }, [items]);

  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTx.filter((t) => t.type === 'outbound').forEach((t) => {
      counts[t.itemId] = (counts[t.itemId] || 0) + t.quantity;
    });
    return Object.entries(counts)
      .map(([id, qty]) => ({ name: items.find((i) => i.id === id)?.name || id, quantity: qty }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [items, filteredTx]);

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

  const stockHistory = useMemo(() => {
    const base = items.reduce((s, i) => s + i.stock, 0);
    return Array.from({ length: 31 }, (_, i) => ({
      day: `${i}`,
      total: Math.max(0, base + (30 - i) * 3 + Math.round((Math.random() - 0.5) * base * 0.05)),
    }));
  }, [items]);

  const reconData = useMemo(() => {
    return items.map((item) => {
      const inbound = filteredTx.filter((t) => t.itemId === item.id && t.type === 'inbound').reduce((s, t) => s + t.quantity, 0);
      const outbound = filteredTx.filter((t) => t.itemId === item.id && t.type === 'outbound').reduce((s, t) => s + t.quantity, 0);
      const openingStock = item.stock - inbound + outbound;
      const theoreticalClose = openingStock + inbound - outbound;
      const simulatedDisc = item.sku === 'HD-001' ? -5 : item.sku === 'JN-001' ? -3 : item.sku === 'PL-001' ? 2 : 0;
      return {
        id: item.id, name: item.name, spec: item.spec,
        opening: openingStock, inbound, outbound,
        theoreticalClose, actualClose: item.stock + simulatedDisc, discrepancy: simulatedDisc,
      };
    });
  }, [items, filteredTx]);

  const discChartData = reconData.filter((r) => r.discrepancy !== 0);

  const periodLabel = preset === 'custom'
    ? `${dateRange.start} ~ ${dateRange.end}`
    : presets.find((p) => p.key === preset)?.label ?? '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + date range */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">对账报表</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-card rounded-lg p-1 shadow-card">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  preset === p.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-1.5 shadow-card">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-xs border-none outline-none text-foreground"
              />
              <span className="text-muted-foreground text-xs">至</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-xs border-none outline-none text-foreground"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-card rounded-lg p-1 shadow-card w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-sm text-muted-foreground">{periodLabel} 入库总额</p>
              <p className="text-xl font-bold text-warning mt-1">¥{periodInbound.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">采购支出</p>
            </div>
            <div className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-sm text-muted-foreground">{periodLabel} 出库总额</p>
              <p className="text-xl font-bold text-success mt-1">¥{periodOutbound.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">销售收入</p>
            </div>
            <div className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-sm text-muted-foreground">净现金流</p>
              <p className={`text-xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netCashFlow >= 0 ? '+' : ''}¥{netCashFlow.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">收入 − 支出</p>
            </div>
            <div className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-sm text-muted-foreground">交易笔数</p>
              <p className="text-xl font-bold text-primary mt-1">{txCount}</p>
              <p className="text-xs text-muted-foreground mt-1">笔入/出库记录</p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card p-5">
            <h3 className="text-base font-semibold mb-4">月度进出金额对比</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="inbound" name="入库金额（支出）" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" name="出库金额（收入）" fill="hsl(160,60%,40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg shadow-card p-5">
            <h3 className="text-base font-semibold mb-4">每日进出数量趋势</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                  interval={Math.max(0, Math.floor(dailyData.length / 15) - 1)}
                  padding={{ left: 10, right: 30 }} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="inbound" name="入库量" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="outbound" name="出库量" stroke="hsl(160,60%,40%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
                  <Pie data={categoryData} dataKey="totalValue" nameKey="category" cx="50%" cy="50%" outerRadius={100}
                    label={({ category, ratio }) => `${category} ${ratio}%`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-lg shadow-card p-5">
              <h3 className="text-base font-semibold mb-4">Top 5 热销商品（{periodLabel}）</h3>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProducts} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="quantity" name="出库量" fill="hsl(160,60%,40%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-20 text-center">所选时段暂无出库记录</p>
              )}
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b"><h3 className="text-base font-semibold">品类明细</h3></div>
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
            <div className="px-5 py-4 border-b"><h3 className="text-base font-semibold">预警/告急商品</h3></div>
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
              {alertItems.length === 0 && <p className="text-sm text-muted-foreground py-12 text-center">库存状态良好</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          {discChartData.length > 0 && (
            <div className="bg-card rounded-lg shadow-card p-5">
              <h3 className="text-base font-semibold mb-4">差异值分布（{periodLabel}）</h3>
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
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-base font-semibold">差异对账明细</h3>
              <span className="text-xs text-muted-foreground">{periodLabel}</span>
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
                    <tr key={row.id} className={`border-b last:border-0 ${row.discrepancy !== 0 ? 'bg-destructive/5' : idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                      <td className="py-3 px-4 font-medium">{row.name} <span className="text-muted-foreground">{row.spec}</span></td>
                      <td className="py-3 px-4 text-right">{row.opening}</td>
                      <td className="py-3 px-4 text-right text-warning">+{row.inbound}</td>
                      <td className="py-3 px-4 text-right text-success">-{row.outbound}</td>
                      <td className="py-3 px-4 text-right">{row.theoreticalClose}</td>
                      <td className="py-3 px-4 text-right font-semibold">{row.actualClose}</td>
                      <td className={`py-3 px-4 text-right font-bold ${row.discrepancy !== 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {row.discrepancy > 0 ? `+${row.discrepancy}` : row.discrepancy}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-secondary/50 font-semibold border-t-2">
                    <td className="py-3 px-4">合计</td>
                    <td className="py-3 px-4 text-right">{reconData.reduce((s, r) => s + r.opening, 0)}</td>
                    <td className="py-3 px-4 text-right text-warning">+{reconData.reduce((s, r) => s + r.inbound, 0)}</td>
                    <td className="py-3 px-4 text-right text-success">-{reconData.reduce((s, r) => s + r.outbound, 0)}</td>
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
