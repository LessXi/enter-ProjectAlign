import { useState } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { POBadge } from '@/components/StatusBadge';
import { Plus, Check, X, Eye, Loader2 } from 'lucide-react';
import type { POStatus } from '@/types/inventory';
import { useProducts, usePurchaseOrders, useCreatePO, useUpdatePOStatus } from '@/hooks/useInventoryData';
import { useToast } from '@/hooks/use-toast';

export default function PurchaseOrders() {
  const { currentRole } = useInventoryStore();
  const { data: items = [] } = useProducts();
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();
  const createPO = useCreatePO();
  const updatePOStatus = useUpdatePOStatus();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [detailPO, setDetailPO] = useState<string | null>(null);
  const [poItemId, setPOItemId] = useState('');
  const [poQty, setPOQty] = useState('');
  const [poPrice, setPOPrice] = useState('');
  const [poSupplier, setPOSupplier] = useState('');
  const [poNote, setPONote] = useState('');

  const isBoss = currentRole === 'boss';
  const isPurchasing = currentRole === 'purchasing';

  const getItemName = (id: string) => {
    const item = items.find((i) => i.id === id);
    return item ? `${item.name} ${item.spec}` : id;
  };

  const handleCreate = async (status: POStatus) => {
    if (!poItemId || !poQty || !poPrice || !poSupplier) return;
    try {
      const num = purchaseOrders.length + 1;
      await createPO.mutateAsync({
        poNumber: `PO-2026-${String(num).padStart(3, '0')}`,
        items: [{ itemId: poItemId, quantity: Number(poQty), unitPrice: Number(poPrice) }],
        supplier: poSupplier,
        status,
        createdDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        note: poNote,
      });
      setPOItemId(''); setPOQty(''); setPOPrice(''); setPOSupplier(''); setPONote('');
      setShowForm(false);
      toast({ title: status === 'draft' ? '草稿已保存' : '采购单已提交', description: '操作成功' });
    } catch {
      toast({ title: '操作失败', description: '请稍后重试', variant: 'destructive' });
    }
  };

  const handleStatusUpdate = async (poNumber: string, status: POStatus) => {
    try {
      await updatePOStatus.mutateAsync({ poNumber, status });
      const labels: Record<string, string> = { approved: '已批准', rejected: '已驳回', pending: '已提交', received: '已收货', draft: '已退回草稿' };
      toast({ title: labels[status] || '状态已更新' });
    } catch {
      toast({ title: '操作失败', description: '请稍后重试', variant: 'destructive' });
    }
  };

  const sorted = [...purchaseOrders].sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  const selectedPO = detailPO ? purchaseOrders.find((po) => po.poNumber === detailPO) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">采购单</h2>
        {isPurchasing && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建采购单
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-lg shadow-card p-6">
          <h3 className="text-base font-semibold mb-4">新建采购单</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">商品 *</label>
              <select value={poItemId} onChange={(e) => { setPOItemId(e.target.value); const item = items.find((i) => i.id === e.target.value); if (item) setPOPrice(String(item.unitPrice)); }}
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">选择商品</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.sku} - {item.name} ({item.spec}) [库存: {item.stock}]</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">数量 *</label>
              <input type="number" value={poQty} onChange={(e) => setPOQty(e.target.value)} placeholder="采购数量"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">预估单价 *</label>
              <input type="number" value={poPrice} onChange={(e) => setPOPrice(e.target.value)} placeholder="单价"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">供应商 *</label>
              <input type="text" value={poSupplier} onChange={(e) => setPOSupplier(e.target.value)} placeholder="供应商名称"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">备注</label>
              <input type="text" value={poNote} onChange={(e) => setPONote(e.target.value)} placeholder="备注"
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-secondary transition-colors">取消</button>
            <button onClick={() => handleCreate('draft')} disabled={!poItemId || !poQty || !poPrice || !poSupplier || createPO.isPending}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50">
              {createPO.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              保存草稿
            </button>
            <button onClick={() => handleCreate('pending')} disabled={!poItemId || !poQty || !poPrice || !poSupplier || createPO.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {createPO.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              提交审批
            </button>
          </div>
        </div>
      )}

      {selectedPO && (
        <div className="bg-card rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">采购单详情 - {selectedPO.poNumber}</h3>
            <button onClick={() => setDetailPO(null)} className="text-sm text-muted-foreground hover:text-foreground">关闭</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">供应商：</span>{selectedPO.supplier}</div>
            <div className="flex gap-1 items-center"><span className="text-muted-foreground">状态：</span><POBadge status={selectedPO.status} /></div>
            <div><span className="text-muted-foreground">创建日期：</span>{selectedPO.createdDate}</div>
            <div><span className="text-muted-foreground">备注：</span>{selectedPO.note || '-'}</div>
          </div>
          <table className="w-full text-sm mt-4">
            <thead><tr className="border-b"><th className="text-left py-2">商品</th><th className="text-right py-2">数量</th><th className="text-right py-2">单价</th><th className="text-right py-2">小计</th></tr></thead>
            <tbody>
              {selectedPO.items.map((pi, idx) => (
                <tr key={idx} className="border-b"><td className="py-2">{getItemName(pi.itemId)}</td><td className="py-2 text-right">{pi.quantity}</td><td className="py-2 text-right">¥{pi.unitPrice}</td><td className="py-2 text-right font-semibold">¥{(pi.quantity * pi.unitPrice).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b-2">
                  <th className="text-left py-3 px-4 font-semibold">采购单号</th>
                  <th className="text-left py-3 px-4 font-semibold">商品明细</th>
                  <th className="text-right py-3 px-4 font-semibold">总金额</th>
                  <th className="text-left py-3 px-4 font-semibold">供应商</th>
                  <th className="text-center py-3 px-4 font-semibold">状态</th>
                  <th className="text-left py-3 px-4 font-semibold">日期</th>
                  <th className="text-center py-3 px-4 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((po, idx) => {
                  const total = po.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                  const summary = po.items.map((i) => `${getItemName(i.itemId)}x${i.quantity}`).join(', ');
                  return (
                    <tr key={po.id} className={`border-b last:border-0 hover:bg-primary/5 transition-colors ${idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                      <td className="py-3 px-4 font-mono text-xs">{po.poNumber}</td>
                      <td className="py-3 px-4 truncate max-w-[200px]">{summary}</td>
                      <td className="py-3 px-4 text-right font-semibold">¥{total.toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground">{po.supplier}</td>
                      <td className="py-3 px-4 text-center"><POBadge status={po.status} /></td>
                      <td className="py-3 px-4 text-muted-foreground">{po.createdDate}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailPO(po.poNumber)} className="p-1.5 hover:bg-secondary rounded" title="查看">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {isBoss && po.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusUpdate(po.poNumber, 'approved')} className="p-1.5 hover:bg-success-bg rounded" title="批准">
                                <Check className="w-4 h-4 text-success" />
                              </button>
                              <button onClick={() => handleStatusUpdate(po.poNumber, 'rejected')} className="p-1.5 hover:bg-destructive-bg rounded" title="驳回">
                                <X className="w-4 h-4 text-destructive" />
                              </button>
                            </>
                          )}
                          {isPurchasing && po.status === 'draft' && (
                            <button onClick={() => handleStatusUpdate(po.poNumber, 'pending')} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
                              提交
                            </button>
                          )}
                          {isPurchasing && po.status === 'approved' && (
                            <button onClick={() => handleStatusUpdate(po.poNumber, 'received')} className="px-2 py-1 text-xs bg-success text-success-foreground rounded hover:bg-success/90">
                              收货
                            </button>
                          )}
                          {isPurchasing && po.status === 'rejected' && (
                            <button onClick={() => handleStatusUpdate(po.poNumber, 'draft')} className="px-2 py-1 text-xs border rounded hover:bg-secondary">
                              重新编辑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
