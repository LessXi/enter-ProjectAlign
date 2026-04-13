# Plan: PO收货联动 + 配色优化 + 最近流水滚动

## Context
三个独立问题需要修复：
1. 采购单点"收货"后只更新了状态，没有自动创建入库记录和增加库存
2. 整体配色对比度太高（mint绿太亮、lavender紫饱和度太高）
3. 工作台"最近流水"只显示6条，需要滚动显示更多

## 修改方案

### 1. 采购单收货联动入库 (业务逻辑修复)

**问题**: `useUpdatePOStatus` 只做了 `update status`，收货(received)时没有自动调用 `add_transaction` 来创建入库记录。

**方案**: 修改 `PurchaseOrders.tsx` 中的收货逻辑，在状态更新为 `received` 后，遍历采购单的所有商品明细，逐条调用 `add_transaction` RPC 创建入库记录。

**修改文件**:
- `src/pages/PurchaseOrders.tsx` — 新增 `handleReceive` 函数:
  1. 先调用 `updatePOStatus` 更新状态为 received
  2. 找到该采购单的 items 数组
  3. 对每个 item 调用 `supabase.rpc('add_transaction', {...})` 创建入库记录
  4. type='inbound', counterparty=供应商名称, note=`采购单收货 ${poNumber}`
  5. invalidate products 和 transactions 查询缓存

### 2. 配色柔和化 (对比度降低)

**问题**: mint(#A4F5A6, hsl 125 85% 81%) 太亮，lavender(#B3A1FF, hsl 255 48% 81%) 在白卡上也偏突兀。

**方案**: 整体降低饱和度，提高柔和感:
- mint: `125 85% 81%` → `140 40% 85%` (偏灰绿，更柔和)
- lavender: `255 48% 81%` → `250 35% 86%` (偏灰紫，更柔和)
- background: `100 12% 83%` → `100 8% 92%` (更浅的灰白背景)
- muted: 调整匹配新背景
- 按钮深色 `#1A1A2E` 保留但偏柔 → `#2D2B3D`
- StatsCard 的 dark variant 同步更新
- Dashboard 深色图表卡同步更新

**修改文件**:
- `src/index.css` — 调整 :root 下的 HSL 值
- `src/components/StatsCard.tsx` — dark variant 的颜色
- `src/pages/Index.tsx` — 深色图表卡颜色
- `src/pages/Login.tsx` — 按钮/标签颜色
- 所有页面中 `bg-[#1A1A2E]` → `bg-[#2D2B3D]`, `bg-[#2A2A3E]` → `bg-[#3D3B4D]`
- `src/components/AppSidebar.tsx` — active 导航项颜色

### 3. 最近流水加滚动 + 显示更多

**修改文件**: `src/pages/Index.tsx`
- `recentTxs` 从 6 条改为 20 条
- 外层 div 加 `max-h-[400px] overflow-y-auto` 滚动容器（带自定义滚动条样式）
- 在 index.css 加简洁的自定义滚动条

## 验证
1. 创建采购单 → 老板批准 → 采购点"收货" → 检查库存是否增加、入库记录是否新增
2. 查看整体配色是否更柔和协调
3. 工作台最近流水是否可滚动、显示更多条目
