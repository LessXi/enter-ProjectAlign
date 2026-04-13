import { useState } from 'react';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import { useProducts, useTransactions, useAddTransaction } from '@/hooks/useInventoryData';
import { useToast } from '@/hooks/use-toast';

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
        type: 'outbound',
        itemId,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        counterparty: customer,
        date,
        note,
      });
      setItemId(''); setQuantity(''); setUnitPrice(''); setCustomer(''); setNote('');
      setShowForm(false);
      toast({ title: '出库成功', description: '已成功记录出库操作' });
    } catch {
      toast({ title: '操作失败', description: '请稍后重试', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">出库管理</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            新增出库单
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-lg shadow-card p-6">
          <h3 className="text-base font-semibold mb-4">新增出库单</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">商品 *</label>
              <select
                value={itemId}
                onChange={(e) => {
                  setItemId(e.target.value);
                  const item = items.find((i) => i.id === e.target.value);
                  if (item) setUnitPrice(String(item.unitPrice));
                }}
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">选择商品</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} - {item.name} ({item.spec}) [库存: {item.stock}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">数量 *</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="输入数量"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">单价 *</label>
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="输入单价"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">客户 *</label>
              <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="输入客户名称"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">日期</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">备注</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注信息"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-secondary transition-colors">
              取消
            </button>
            <button onClick={handleSubmit} disabled={!itemId || !quantity || !unitPrice || !customer || addTransaction.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {addTransaction.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              确认出库
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-base font-semibold">出库历史</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b-2">
                  <th className="text-left py-3 px-4 font-semibold">商品</th>
                  <th className="text-right py-3 px-4 font-semibold">数量</th>
                  <th className="text-right py-3 px-4 font-semibold">单价</th>
                  <th className="text-right py-3 px-4 font-semibold">金额</th>
                  <th className="text-left py-3 px-4 font-semibold">客户</th>
                  <th className="text-left py-3 px-4 font-semibold">日期</th>
                </tr>
              </thead>
              <tbody>
                {outboundTxs.map((tx, idx) => (
                  <tr key={tx.id} className={`border-b last:border-0 hover:bg-primary/5 transition-colors ${idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                    <td className="py-3 px-4">{getItemName(tx.itemId)}</td>
                    <td className="py-3 px-4 text-right text-destructive font-medium">-{tx.quantity}</td>
                    <td className="py-3 px-4 text-right">¥{tx.unitPrice}</td>
                    <td className="py-3 px-4 text-right font-semibold">¥{(tx.quantity * tx.unitPrice).toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{tx.counterparty}</td>
                    <td className="py-3 px-4 text-muted-foreground">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {outboundTxs.length === 0 && (
              <p className="text-sm text-muted-foreground py-12 text-center">暂无出库记录</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
