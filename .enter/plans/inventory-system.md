# Plan: 功能完整性修复 + 配色优化 + 滚动

## Context
审查发现5个问题，其中3个是必修bug/功能缺失，2个是数据模拟（暂可接受）。
同时还需修复用户之前提出的：配色对比度太高 + 最近流水加滚动。

---

## 修复清单

### BUG1: StaffManagement `setCopied` 不存在
- **文件**: `src/pages/StaffManagement.tsx` 第88行
- **问题**: `resetForm()` 中调用了 `setCopied(false)` 但该 state 已改名为 `copiedId`
- **修复**: 改为 `setCopiedId(null)`

### BUG2: 采购单"收货"不联动入库
- **文件**: `src/pages/PurchaseOrders.tsx`
- **问题**: 点击收货只更新PO状态，不创建入库记录
- **修复**: 新增 `handleReceive(poNumber)` 函数:
  1. 找到该PO及其items
  2. 对每个item调用 `supabase.rpc('add_transaction', ...)` 创建入库记录
     - type='inbound', counterparty=供应商, note=`采购收货 ${poNumber}`
  3. 然后更新PO状态为received
  4. invalidate products + transactions + purchase_orders 缓存
- 收货按钮的onClick改为调用 `handleReceive`

### 功能3: 采购单"重新编辑"功能增强（小改进）
- **现状**: 驳回后点"重新编辑"只退回draft状态，无法修改内容
- **修复**: 暂不改，因为当前PO只有单个item，用户可以新建替代。真正的编辑功能涉及较大重构，留到后续。

### 数据4+5: 模拟数据说明
- 差异对账的 `simulatedDisc` 和 库存趋势的 `stockHistory` 用的是模拟数据
- 这是合理的，因为还没有盘点(stocktake)功能。后续可加盘点模块来产生真实差异数据。

---

### 配色优化: 降低对比度
- **文件**: `src/index.css`
- 调整:
  - `--mint`: `125 85% 81%` → `145 35% 88%` (灰绿，更柔和)
  - `--lavender`: `255 48% 81%` → `250 30% 88%` (灰紫，更柔和)
  - `--primary`: 同步mint
  - `--background`: `100 12% 83%` → `100 6% 93%` (更浅灰白)
  - `--muted` / `--border` / `--input`: 同步调整匹配新背景
  - 按钮深色 `#1A1A2E` → `#2D2B3D` (微暖深紫，降低对比)
- **文件**: 所有页面中的 `#1A1A2E` → `#2D2B3D`，`#2A2A3E` → `#3D3B4D`
- **文件**: `src/components/StatsCard.tsx` — dark variant同步
- **文件**: `src/components/AppSidebar.tsx` — active项颜色同步

### 最近流水滚动
- **文件**: `src/pages/Index.tsx`
- `recentTxs` 从 `.slice(0, 6)` 改为 `.slice(0, 20)`
- 最近流水容器加 `max-h-[420px] overflow-y-auto` + 自定义滚动条
- **文件**: `src/index.css` — 添加 `.scrollbar-thin` 自定义滚动条样式

---

## 涉及文件
1. `src/pages/StaffManagement.tsx` — 修 setCopied bug
2. `src/pages/PurchaseOrders.tsx` — 收货联动入库
3. `src/index.css` — 配色调整 + 滚动条样式
4. `src/pages/Index.tsx` — 最近流水滚动
5. `src/components/StatsCard.tsx` — dark variant颜色
6. `src/components/AppSidebar.tsx` — active颜色
7. 所有含 `#1A1A2E` 的页面 — 批量替换

## 验证
1. 创建采购单→批准→收货 → 确认库存增加、入库记录新增
2. 查看配色是否更柔和
3. 工作台最近流水可滚动、显示更多
4. StaffManagement 创建/编辑 dialog 正常工作无报错
