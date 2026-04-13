import { useState } from 'react';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import { useProducts, useTransactions, useAddTransaction } from '@/hooks/useInventoryData';
import { useToast } from '@/hooks/use-toast';

const inputCls = "w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mint/50";

export default function Outbound() {
  const { data: items = [] } = useProducts();
  const { data: transactions = [], isLoading } = useTransactions();
  const addTransaction = useAddTransaction();
  const { toast } = useToast();

  const outboundTxs = transactions.filter((t) => t.type === 'outbound');

  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [showForm, setShowForm] = useState(false);

  const getItemName = (id: string) => {
    const item = items.find((i) => i.id === id);
    return item ? `${item.name} ${item.spec}` : id;
  };

  const handleSubmit = async () => {
    if (!itemId || !quantity || !unitPrice || !customer) return;
    try {
      await addTransaction.mutateAsync({
        type: 'outbound', itemId, quantity: Number(quantity), unitPrice: Number(unitPrice),
        counterparty: customer, date, note,
      });
      setItemId(''); setQuantity(''); setUnitPrice(''); setCustomer(''); setNote('');
      setShowForm(false);
      toast({ title: '出库成功', description: '已成功记录出库操作' });
    } catch {
      toast({ title: '操作失败', description: '请稍后重试', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">出库管理</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#2A2A3E] transition-all">
            <ArrowUpFromLine className="w-4 h-4" />
            新增出库单
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50 animate-scale-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">新增出库单</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">商品 *</label>
              <select value={itemId} onChange={(e) => { setItemId(e.target.value); const item = items.find((i) => i.id === e.target.value); if (item) setUnitPrice(String(item.unitPrice)); }} className={inputCls}>
                <option value="">选择商品</option>
                {items.map((item) => (<option key={item.id} value={item.id}>{item.sku} - {item.name} ({item.spec}) [库存: {item.stock}]</option>))}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">数量 *</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="输入数量" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">单价 *</label><input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="输入单价" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">客户 *</label><input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="输入客户名称" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">备注</label><input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注信息" className={inputCls} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-all">取消</button>
            <button onClick={handleSubmit} disabled={!itemId || !quantity || !unitPrice || !customer || addTransaction.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#2A2A3E] transition-all disabled:opacity-40">
              {addTransaction.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              确认出库
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/50">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">出库历史</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">商品</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground text-xs">数量</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground text-xs">单价</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground text-xs">金额</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">客户</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">日期</th>
                </tr>
              </thead>
              <tbody>
                {outboundTxs.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-5 text-card-foreground">{getItemName(tx.itemId)}</td>
                    <td className="py-3 px-5 text-right text-destructive font-medium">-{tx.quantity}</td>
                    <td className="py-3 px-5 text-right text-card-foreground">¥{tx.unitPrice}</td>
                    <td className="py-3 px-5 text-right font-semibold text-card-foreground">¥{(tx.quantity * tx.unitPrice).toLocaleString()}</td>
                    <td className="py-3 px-5 text-muted-foreground">{tx.counterparty}</td>
                    <td className="py-3 px-5 text-muted-foreground">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {outboundTxs.length === 0 && <p className="text-sm text-muted-foreground py-12 text-center">暂无出库记录</p>}
          </div>
        )}
      </div>
    </div>
  );
}
