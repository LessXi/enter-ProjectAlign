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

const COLORS = ['hsl(125,85%,81%)', 'hsl(255,48%,81%)', 'hsl(38,92%,55%)', 'hsl(0,72%,56%)', 'hsl(190,60%,60%)', 'hsl(330,50%,70%)', 'hsl(60,70%,60%)'];

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
  // 利润 = 出库收入 - 入库成本（出库赚钱，入库花钱）
  const profit = periodOutbound - periodInbound;
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
      { name: '正常', value: normal, fill: 'hsl(125,85%,81%)' },
      { name: '预警', value: warning, fill: 'hsl(38,92%,55%)' },
      { name: '告急', value: critical, fill: 'hsl(0,72%,56%)' },
    ];
  }, [items]);

  const alertItems = items.filter((i) => getStockStatus(i.stock, i.threshold) !== 'normal');

  // Stock history: compute daily total stock within date range from real transactions
  const stockHistory = useMemo(() => {
    // Current total stock
    const currentTotal = items.reduce((s, i) => s + i.stock, 0);
    const today = toDateStr(new Date());

    // Build a map of daily net stock change (inbound adds, outbound subtracts)
    const dailyDelta: Record<string, number> = {};
    transactions.forEach((t) => {
      const d = t.date;
      if (!dailyDelta[d]) dailyDelta[d] = 0;
      dailyDelta[d] += t.type === 'inbound' ? t.quantity : -t.quantity;
    });

    // Walk backwards from today to build total stock at each date
    const allDates: string[] = [];
    const cursor = new Date(today);
    const earliest = new Date(dateRange.start);
    earliest.setDate(earliest.getDate() - 1); // one day before range start
    while (cursor >= earliest) {
      allDates.push(toDateStr(new Date(cursor)));
      cursor.setDate(cursor.getDate() - 1);
    }

    // Compute stock at each date (going backwards: subtract net delta of future dates)
    const stockByDate: Record<string, number> = {};
    let running = currentTotal;
    for (const d of allDates) {
      stockByDate[d] = running;
      // Undo the delta of this date to get previous day's stock
      running -= (dailyDelta[d] || 0);
    }

    // Build chart data only for dates within the selected range
    const result: { day: string; total: number }[] = [];
    const startD = new Date(dateRange.start);
    const endD = new Date(dateRange.end);
    for (const c = new Date(startD); c <= endD; c.setDate(c.getDate() + 1)) {
      const key = toDateStr(new Date(c));
      result.push({
        day: `${c.getMonth() + 1}/${c.getDate()}`,
        total: Math.max(0, stockByDate[key] ?? currentTotal),
      });
    }
    return result;
  }, [items, transactions, dateRange]);

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

  // Determine whether to show daily or monthly granularity for the amount chart
  const useDaily = useMemo(() => {
    const diffMs = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // Use daily granularity for ranges up to ~62 days (about 2 months)
    return diffDays <= 62;
  }, [dateRange]);

  const dailyAmountData = useMemo(() => {
    const result: { label: string; date: string; inbound: number; outbound: number }[] = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const dateKey = toDateStr(new Date(cursor));
      result.push({ date: dateKey, label: `${cursor.getMonth() + 1}/${cursor.getDate()}`, inbound: 0, outbound: 0 });
    }
    filteredTx.forEach((t) => {
      const entry = result.find((r) => r.date === t.date);
      if (entry) {
        const val = t.quantity * t.unitPrice;
        if (t.type === 'inbound') entry.inbound += val;
        else entry.outbound += val;
      }
    });
    return result;
  }, [filteredTx, dateRange]);

  const amountChartData = (useDaily
    ? dailyAmountData
    : monthlyData.map((m) => ({ ...m, label: m.month }))
  ).map((d) => ({ ...d, profit: d.outbound - d.inbound }));

  const amountChartTitle = useMemo(() => {
    const granularity = useDaily ? '每日' : '月度';
    return `${granularity}进出金额对比（${periodLabel}）`;
  }, [useDaily, periodLabel]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header + date range */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">对账报表</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-card rounded-xl p-1 shadow-card border border-border/50">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  preset === p.key
                    ? 'bg-[#1A1A2E] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-1.5 shadow-card border border-border/50">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-xs border-none outline-none text-foreground" />
              <span className="text-muted-foreground text-xs">至</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-xs border-none outline-none text-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-card rounded-xl p-1 shadow-card border border-border/50 w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key ? 'bg-[#1A1A2E] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-lavender rounded-3xl p-5 text-center shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5">
              <p className="text-xs text-white/60">{periodLabel} 入库总额</p>
              <p className="text-xl font-bold text-white mt-1">¥{periodInbound.toLocaleString()}</p>
              <p className="text-[10px] text-white/50 mt-1">采购支出</p>
            </div>
            <div className="bg-mint rounded-3xl p-5 text-center shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5">
              <p className="text-xs text-black/50">{periodLabel} 出库总额</p>
              <p className="text-xl font-bold text-black mt-1">¥{periodOutbound.toLocaleString()}</p>
              <p className="text-[10px] text-black/40 mt-1">销售收入</p>
            </div>
            <div className="bg-[#1A1A2E] rounded-3xl p-5 text-center shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5">
              <p className="text-xs text-white/50">利润</p>
              <p className={`text-xl font-bold mt-1 ${profit >= 0 ? 'text-[#A4F5A6]' : 'text-red-400'}`}>
                {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
              </p>
              <p className="text-[10px] text-white/40 mt-1">收入 - 支出</p>
            </div>
            <div className="bg-card rounded-3xl p-5 text-center shadow-card border border-border/50 transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5">
              <p className="text-xs text-muted-foreground">交易笔数</p>
              <p className="text-xl font-bold text-foreground mt-1">{txCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">笔入/出库记录</p>
            </div>
          </div>

          <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">{amountChartTitle}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={amountChartData}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }}
                  interval={amountChartData.length > 15 ? Math.floor(amountChartData.length / 12) : 0}
                  padding={{ left: 10, right: 30 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(0,0%,50%)' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} formatter={(value: number) => `¥${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="inbound" name="入库金额（支出）" fill="hsl(255,80%,82%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="outbound" name="出库金额（收入）" fill="hsl(125,85%,81%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">利润趋势（{periodLabel}）</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={amountChartData}>
                <defs>
                  <linearGradient id="profitGradientPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A4F5A6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#A4F5A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }}
                  interval={amountChartData.length > 15 ? Math.floor(amountChartData.length / 12) : 0}
                  padding={{ left: 10, right: 30 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(0,0%,50%)' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '利润']}
                  contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="profit" name="利润" stroke="#FFD666" strokeWidth={2} fill="url(#profitGradientPos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }}
                  interval={Math.max(0, Math.floor(dailyData.length / 15) - 1)}
                  padding={{ left: 10, right: 30 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(0,0%,50%)' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="inbound" name="入库量" stroke="hsl(255,80%,82%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="outbound" name="出库量" stroke="hsl(125,85%,81%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'category' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4">库存金额品类占比</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} dataKey="totalValue" nameKey="category" cx="50%" cy="50%" outerRadius={100}
                    label={({ category, ratio }) => `${category} ${ratio}%`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} formatter={(value: number) => `¥${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4">Top 5 热销商品（{periodLabel}）</h3>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProducts} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0,0%,50%)' }} />
                    <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(0,0%,70%)' }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="quantity" name="出库量" fill="hsl(125,85%,81%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-card-foreground py-20 text-center">所选时段暂无出库记录</p>
              )}
            </div>
          </div>
          <div className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/50">
            <div className="px-6 py-4 border-b border-border"><h3 className="text-sm font-semibold text-foreground">品类明细</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3.5 px-5 font-semibold text-muted-foreground text-xs">品类</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">SKU数</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">库存总量</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">库存金额</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((cat, idx) => (
                    <tr key={cat.category} className={`border-b border-border/50 last:border-0 ${idx % 2 === 1 ? 'bg-card-foreground/[0.02]' : ''}`}>
                      <td className="py-3.5 px-5 font-medium text-card-foreground">{cat.category}</td>
                      <td className="py-3.5 px-5 text-right text-card-foreground">{cat.skuCount}</td>
                      <td className="py-3.5 px-5 text-right text-card-foreground">{cat.totalQty}</td>
                      <td className="py-3.5 px-5 text-right font-semibold text-card-foreground">¥{cat.totalValue.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right text-card-foreground">{cat.ratio}%</td>
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
            <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4">库存状态分布</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={healthDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}>
                    {healthDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4">库存总量变化趋势（{periodLabel}）</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stockHistory}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(0,0%,50%)' }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="total" name="库存总量" stroke="hsl(125,85%,81%)" fill="hsl(125,85%,81%)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/50">
            <div className="px-6 py-4 border-b border-border"><h3 className="text-sm font-semibold text-foreground">预警/告急商品</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3.5 px-5 font-semibold text-muted-foreground text-xs">SKU</th>
                    <th className="text-left py-3.5 px-5 font-semibold text-muted-foreground text-xs">品名</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">当前库存</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">预警阈值</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">缺口</th>
                    <th className="text-center py-3.5 px-5 font-semibold text-muted-foreground text-xs">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {alertItems.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-border/50 last:border-0 ${idx % 2 === 1 ? 'bg-card-foreground/[0.02]' : ''}`}>
                      <td className="py-3.5 px-5 font-mono text-xs text-card-foreground/60">{item.sku}</td>
                      <td className="py-3.5 px-5 text-card-foreground">{item.name} <span className="text-card-foreground">{item.spec}</span></td>
                      <td className="py-3.5 px-5 text-right font-semibold text-card-foreground">{item.stock}</td>
                      <td className="py-3.5 px-5 text-right text-card-foreground">{item.threshold}</td>
                      <td className="py-3.5 px-5 text-right text-destructive font-semibold">{item.stock - item.threshold}</td>
                      <td className="py-3.5 px-5 text-center"><StockBadge status={getStockStatus(item.stock, item.threshold)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {alertItems.length === 0 && <p className="text-sm text-card-foreground py-12 text-center">库存状态良好</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          {discChartData.length > 0 && (
            <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4">差异值分布（{periodLabel}）</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={discChartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0,0%,50%)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(0,0%,50%)' }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <ReferenceLine y={0} stroke="hsl(0,0%,30%)" />
                  <Bar dataKey="discrepancy" name="差异">
                    {discChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.discrepancy > 0 ? 'hsl(125,85%,81%)' : 'hsl(0,72%,56%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/50">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">差异对账明细</h3>
              <span className="text-xs text-card-foreground">{periodLabel}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3.5 px-5 font-semibold text-muted-foreground text-xs">商品</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">期初库存</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">入库</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">出库</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">理论期末</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">实际库存</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-muted-foreground text-xs">差异</th>
                  </tr>
                </thead>
                <tbody>
                  {reconData.map((row, idx) => (
                    <tr key={row.id} className={`border-b border-border/50 last:border-0 ${row.discrepancy !== 0 ? 'bg-destructive/5' : idx % 2 === 1 ? 'bg-card-foreground/[0.02]' : ''}`}>
                      <td className="py-3.5 px-5 font-medium text-card-foreground">{row.name} <span className="text-card-foreground">{row.spec}</span></td>
                      <td className="py-3.5 px-5 text-right text-card-foreground">{row.opening}</td>
                      <td className="py-3.5 px-5 text-right" style={{ color: 'hsl(255,80%,65%)' }}>+{row.inbound}</td>
                      <td className="py-3.5 px-5 text-right" style={{ color: 'hsl(145,55%,45%)' }}>-{row.outbound}</td>
                      <td className="py-3.5 px-5 text-right text-card-foreground">{row.theoreticalClose}</td>
                      <td className="py-3.5 px-5 text-right font-semibold text-card-foreground">{row.actualClose}</td>
                      <td className={`py-3.5 px-5 text-right font-bold ${row.discrepancy !== 0 ? 'text-destructive' : 'text-card-foreground'}`}>
                        {row.discrepancy > 0 ? `+${row.discrepancy}` : row.discrepancy}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-semibold">
                    <td className="py-3.5 px-5 text-card-foreground">合计</td>
                    <td className="py-3.5 px-5 text-right text-card-foreground">{reconData.reduce((s, r) => s + r.opening, 0)}</td>
                    <td className="py-3.5 px-5 text-right" style={{ color: 'hsl(255,80%,65%)' }}>+{reconData.reduce((s, r) => s + r.inbound, 0)}</td>
                    <td className="py-3.5 px-5 text-right" style={{ color: 'hsl(145,55%,45%)' }}>-{reconData.reduce((s, r) => s + r.outbound, 0)}</td>
                    <td className="py-3.5 px-5 text-right text-card-foreground">{reconData.reduce((s, r) => s + r.theoreticalClose, 0)}</td>
                    <td className="py-3.5 px-5 text-right text-card-foreground">{reconData.reduce((s, r) => s + r.actualClose, 0)}</td>
                    <td className={`py-3.5 px-5 text-right font-bold ${reconData.reduce((s, r) => s + r.discrepancy, 0) !== 0 ? 'text-destructive' : ''}`}>
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
