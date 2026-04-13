import { useState } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { ArrowDownToLine } from 'lucide-react';

export default function Inbound() {
  const { items, transactions, addTransaction } = useInventoryStore();
  const inboundTxs = [...transactions].filter((t) => t.type === 'inbound').sort((a, b) => b.date.localeCompare(a.date));

  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [showForm, setShowForm] = useState(false);

  const getItemName = (id: string) => {
    const item = items.find((i) => i.id === id);
    return item ? `${item.name} ${item.spec}` : id;
  };

  const handleSubmit = () => {
    if (!itemId || !quantity || !unitPrice || !supplier) return;
    addTransaction({
      type: 'inbound',
      itemId,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      counterparty: supplier,
      date,
      note,
    });
    setItemId('');
    setQuantity('');
    setUnitPrice('');
    setSupplier('');
    setNote('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">入库管理</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            新增入库单
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-lg shadow-card p-6">
          <h3 className="text-base font-semibold mb-4">新增入库单</h3>
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
                    {item.sku} - {item.name} ({item.spec})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">数量 *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="输入数量"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">单价 *</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="输入单价"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">供应商 *</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="输入供应商名称"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">备注</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="备注信息"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-secondary transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!itemId || !quantity || !unitPrice || !supplier}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              确认入库
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-base font-semibold">入库历史</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 border-b-2">
                <th className="text-left py-3 px-4 font-semibold">单号</th>
                <th className="text-left py-3 px-4 font-semibold">商品</th>
                <th className="text-right py-3 px-4 font-semibold">数量</th>
                <th className="text-right py-3 px-4 font-semibold">单价</th>
                <th className="text-right py-3 px-4 font-semibold">金额</th>
                <th className="text-left py-3 px-4 font-semibold">供应商</th>
                <th className="text-left py-3 px-4 font-semibold">日期</th>
              </tr>
            </thead>
            <tbody>
              {inboundTxs.map((tx, idx) => (
                <tr key={tx.id} className={`border-b last:border-0 hover:bg-primary/5 transition-colors ${idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                  <td className="py-3 px-4 font-mono text-xs">{tx.id.toUpperCase()}</td>
                  <td className="py-3 px-4">{getItemName(tx.itemId)}</td>
                  <td className="py-3 px-4 text-right text-success font-medium">+{tx.quantity}</td>
                  <td className="py-3 px-4 text-right">¥{tx.unitPrice}</td>
                  <td className="py-3 px-4 text-right font-semibold">¥{(tx.quantity * tx.unitPrice).toLocaleString()}</td>
                  <td className="py-3 px-4 text-muted-foreground">{tx.counterparty}</td>
                  <td className="py-3 px-4 text-muted-foreground">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inboundTxs.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">暂无入库记录</p>
        )}
      </div>
    </div>
  );
}
