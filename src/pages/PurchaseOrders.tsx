import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { POBadge } from '@/components/StatusBadge';
import { Plus, Check, X, Eye, Loader2 } from 'lucide-react';
import type { POStatus } from '@/types/inventory';
import { useProducts, usePurchaseOrders, useCreatePO, useUpdatePOStatus, useReceivePO, useAddProduct } from '@/hooks/useInventoryData';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

const inputCls = "w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mint/50";

/* Category → SKU prefix mapping (common garment categories) */
const CATEGORY_PREFIX: Record<string, string> = {
  'T恤': 'TS', 't恤': 'TS', '卫衣': 'HD', '牛仔裤': 'JN', '夹克': 'JK',
  'Polo衫': 'PL', 'polo衫': 'PL', '半裙': 'SK', '连衣裙': 'DR', '衬衫': 'SH',
  '外套': 'CT', '裤子': 'PT', '短裤': 'SP', '羽绒服': 'DW', '风衣': 'TC',
  '针织衫': 'KN', '西装': 'ST', '背心': 'VT', '内衣': 'UW', '袜子': 'SO',
};

export default function PurchaseOrders() {
  const { role: currentRole } = useAuth();
  const { data: items = [], isLoading: loadingItems } = useProducts();
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();
  const createPO = useCreatePO();
  const updatePOStatus = useUpdatePOStatus();
  const receivePO = useReceivePO();
  const addProduct = useAddProduct();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [detailPO, setDetailPO] = useState<string | null>(null);
  const [poItemId, setPOItemId] = useState('');
  const [poQty, setPOQty] = useState('');
  const [poPrice, setPOPrice] = useState('');
  const [poSupplier, setPOSupplier] = useState('');
  const [poNote, setPONote] = useState('');

  // New product form
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [newThreshold, setNewThreshold] = useState('20');

  /* Auto-generate SKU from category + existing product count */
  const generatedSku = useMemo(() => {
    if (!newCategory.trim()) return '';
    const prefix = CATEGORY_PREFIX[newCategory.trim()] || newCategory.trim().slice(0, 2).toUpperCase();
    const samePrefix = items.filter((i) => i.sku.startsWith(prefix + '-'));
    const maxNum = samePrefix.reduce((max, i) => {
      const n = parseInt(i.sku.split('-')[1], 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  }, [newCategory, items]);

  useEffect(() => {
    const prefillId = searchParams.get('prefill');
    if (!prefillId || loadingItems || items.length === 0) return;
    const item = items.find((i) => i.id === prefillId);
    if (!item) return;
    setPOItemId(item.id);
    setPOPrice(String(item.unitPrice));
    const suggestedQty = Math.max(item.threshold - item.stock, 1);
    setPOQty(String(suggestedQty));
    setPONote(`库存预警补货 - ${item.name} ${item.spec}`);
    setShowForm(true);
    setIsNewProduct(false);
    setSearchParams({}, { replace: true });
  }, [searchParams, items, loadingItems, setSearchParams]);

  const isBoss = currentRole === 'boss';
  const isPurchasing = currentRole === 'purchasing';

  const getItemName = (id: string) => {
    const item = items.find((i) => i.id === id);
    return item ? `${item.name} ${item.spec}` : id;
  };

  const resetForm = () => {
    setPOItemId(''); setPOQty(''); setPOPrice(''); setPOSupplier(''); setPONote('');
    setIsNewProduct(false); setNewName(''); setNewCategory(''); setNewSpec(''); setNewThreshold('20');
  };

  const handleCreate = async (status: POStatus) => {
    // Validate fields depending on mode
    if (isNewProduct) {
      if (!newName || !generatedSku || !newCategory || !newSpec || !poQty || !poPrice || !poSupplier) return;
    } else {
      if (!poItemId || !poQty || !poPrice || !poSupplier) return;
    }

    try {
      let productId = poItemId;

      // If new product mode, create product first
      if (isNewProduct) {
        const newProduct = await addProduct.mutateAsync({
          sku: generatedSku,
          name: newName,
          category: newCategory,
          spec: newSpec,
          threshold: Number(newThreshold) || 20,
          unitPrice: Number(poPrice),
        });
        productId = newProduct.id;
      }

      const ts = Date.now().toString(36).toUpperCase();
      const num = purchaseOrders.length + 1;
      await createPO.mutateAsync({
        poNumber: `PO-${ts}-${String(num).padStart(3, '0')}`,
        items: [{ itemId: productId, quantity: Number(poQty), unitPrice: Number(poPrice) }],
        supplier: poSupplier, status, createdDate: new Date().toISOString().split('T')[0],
        expectedDate: '', note: poNote,
      });
      resetForm();
      setShowForm(false);
      toast({ title: status === 'draft' ? '草稿已保存' : '采购单已提交' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请稍后重试';
      toast({ title: '操作失败', description: msg.includes('products_sku_key') ? 'SKU 已存在，请更换' : msg, variant: 'destructive' });
    }
  };

  const handleStatusUpdate = async (poNumber: string, status: POStatus) => {
    try {
      await updatePOStatus.mutateAsync({ poNumber, status });
      const labels: Record<string, string> = { approved: '已批准', rejected: '已驳回', pending: '已提交', draft: '已退回草稿' };
      toast({ title: labels[status] || '状态已更新' });
    } catch {
      toast({ title: '操作失败', description: '请稍后重试', variant: 'destructive' });
    }
  };

  const handleReceive = async (poNumber: string) => {
    try {
      await receivePO.mutateAsync({ poNumber });
      toast({ title: '已收货', description: '商品已自动入库并更新库存' });
    } catch {
      toast({ title: '收货失败', description: '请稍后重试', variant: 'destructive' });
    }
  };

  const sorted = [...purchaseOrders].sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  const selectedPO = detailPO ? purchaseOrders.find((po) => po.poNumber === detailPO) : null;
  const formBusy = createPO.isPending || addProduct.isPending;

  const canSubmit = isNewProduct
    ? !!(newName && generatedSku && newCategory && newSpec && poQty && poPrice && poSupplier)
    : !!(poItemId && poQty && poPrice && poSupplier);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">采购单</h2>
        {isPurchasing && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#2A2A3E] transition-all">
            <Plus className="w-4 h-4" />新建采购单
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">新建采购单</h3>
            <div className="flex bg-muted/50 rounded-lg p-0.5">
              <button
                onClick={() => { setIsNewProduct(false); setPOItemId(''); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!isNewProduct ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                选择已有商品
              </button>
              <button
                onClick={() => { setIsNewProduct(true); setPOItemId(''); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isNewProduct ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                新增商品
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isNewProduct ? (
              /* Existing product selector */
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">商品 *</label>
                <select value={poItemId} onChange={(e) => { setPOItemId(e.target.value); const item = items.find((i) => i.id === e.target.value); if (item) setPOPrice(String(item.unitPrice)); }} className={inputCls}>
                  <option value="">选择商品</option>
                  {items.map((item) => (<option key={item.id} value={item.id}>{item.sku} - {item.name} ({item.spec}) [库存: {item.stock}]</option>))}
                </select>
              </div>
            ) : (
              /* New product fields */
              <>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">商品名称 *</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例: 基础圆领T恤" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">SKU（自动生成）</label>
                  <input type="text" value={generatedSku} readOnly placeholder="填写品类后自动生成" className={`${inputCls} bg-muted/60 cursor-default`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">品类 *</label>
                  <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="例: T恤" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">规格 *</label>
                  <input type="text" value={newSpec} onChange={(e) => setNewSpec(e.target.value)} placeholder="例: 白色/L" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">预警阈值</label>
                  <input type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} placeholder="20" className={inputCls} />
                </div>
              </>
            )}
            <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">数量 *</label><input type="number" value={poQty} onChange={(e) => setPOQty(e.target.value)} placeholder="采购数量" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">预估单价 *</label><input type="number" value={poPrice} onChange={(e) => setPOPrice(e.target.value)} placeholder="单价" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">供应商 *</label><input type="text" value={poSupplier} onChange={(e) => setPOSupplier(e.target.value)} placeholder="供应商名称" className={inputCls} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-muted-foreground mb-1.5">备注</label><input type="text" value={poNote} onChange={(e) => setPONote(e.target.value)} placeholder="备注" className={inputCls} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-all">取消</button>
            <button onClick={() => handleCreate('draft')} disabled={!canSubmit || formBusy}
              className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-all disabled:opacity-40">保存草稿</button>
            <button onClick={() => handleCreate('pending')} disabled={!canSubmit || formBusy}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#2A2A3E] transition-all disabled:opacity-40">
              {formBusy && <Loader2 className="w-3 h-3 animate-spin" />}提交审批
            </button>
          </div>
        </div>
      )}

      {selectedPO && (
        <div className="bg-card rounded-3xl shadow-card p-6 border border-border/50 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">采购单详情 - {selectedPO.poNumber}</h3>
            <button onClick={() => setDetailPO(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">关闭</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">供应商：</span><span className="text-card-foreground">{selectedPO.supplier}</span></div>
            <div className="flex gap-1 items-center"><span className="text-muted-foreground">状态：</span><POBadge status={selectedPO.status} /></div>
            <div><span className="text-muted-foreground">创建日期：</span><span className="text-card-foreground">{selectedPO.createdDate}</span></div>
            <div><span className="text-muted-foreground">备注：</span><span className="text-card-foreground">{selectedPO.note || '-'}</span></div>
          </div>
          <table className="w-full text-sm mt-4">
            <thead><tr className="border-b border-border"><th className="text-left py-2.5 text-muted-foreground text-xs">商品</th><th className="text-right py-2.5 text-muted-foreground text-xs">数量</th><th className="text-right py-2.5 text-muted-foreground text-xs">单价</th><th className="text-right py-2.5 text-muted-foreground text-xs">小计</th></tr></thead>
            <tbody>
              {selectedPO.items.map((pi, idx) => (
                <tr key={idx} className="border-b border-border/50"><td className="py-2.5 text-card-foreground">{getItemName(pi.itemId)}</td><td className="py-2.5 text-right">{pi.quantity}</td><td className="py-2.5 text-right">¥{pi.unitPrice}</td><td className="py-2.5 text-right font-semibold">¥{(pi.quantity * pi.unitPrice).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">采购单号</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">商品明细</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground text-xs">总金额</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">供应商</th>
                  <th className="text-center py-3 px-5 font-medium text-muted-foreground text-xs">状态</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs">日期</th>
                  <th className="text-center py-3 px-5 font-medium text-muted-foreground text-xs">操作</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((po) => {
                  const total = po.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                  const summary = po.items.map((i) => `${getItemName(i.itemId)}x${i.quantity}`).join(', ');
                  return (
                    <tr key={po.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-5 font-mono text-xs text-muted-foreground">{po.poNumber}</td>
                      <td className="py-3 px-5 truncate max-w-[200px] text-card-foreground">{summary}</td>
                      <td className="py-3 px-5 text-right font-semibold text-card-foreground">¥{total.toLocaleString()}</td>
                      <td className="py-3 px-5 text-muted-foreground">{po.supplier}</td>
                      <td className="py-3 px-5 text-center"><POBadge status={po.status} /></td>
                      <td className="py-3 px-5 text-muted-foreground">{po.createdDate}</td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailPO(po.poNumber)} className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors" title="查看">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {isBoss && po.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusUpdate(po.poNumber, 'approved')} className="p-1.5 hover:bg-success-bg rounded-lg transition-colors" title="批准">
                                <Check className="w-4 h-4 text-success" />
                              </button>
                              <button onClick={() => handleStatusUpdate(po.poNumber, 'rejected')} className="p-1.5 hover:bg-destructive-bg rounded-lg transition-colors" title="驳回">
                                <X className="w-4 h-4 text-destructive" />
                              </button>
                            </>
                          )}
                          {isPurchasing && po.status === 'draft' && (
                            <button onClick={() => handleStatusUpdate(po.poNumber, 'pending')} className="px-3 py-1 text-xs bg-[#1A1A2E] text-white rounded-full font-medium hover:bg-[#2A2A3E] transition-all">提交</button>
                          )}
                          {isPurchasing && po.status === 'approved' && (
                            <button onClick={() => handleReceive(po.poNumber)} disabled={receivePO.isPending} className="px-3 py-1 text-xs bg-mint text-foreground rounded-full font-medium hover:brightness-95 transition-all disabled:opacity-40">
                              {receivePO.isPending ? '处理中...' : '收货'}
                            </button>
                          )}
                          {isPurchasing && po.status === 'rejected' && (
                            <button onClick={() => handleStatusUpdate(po.poNumber, 'draft')} className="px-3 py-1 text-xs border border-border text-foreground rounded-full font-medium hover:bg-muted/50 transition-all">重新编辑</button>
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
