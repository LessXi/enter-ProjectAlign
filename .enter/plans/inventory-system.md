# 方案：三项修复 — 账号登录 + 现金流逻辑 + 报表时间选择

## 出入库逻辑全面审查结果

### 业务定义
- **入库** = 从供应商进货 = 花钱（采购成本）→ 库存增加
- **出库** = 向客户发货 = 赚钱（销售收入）→ 库存减少

### 审查通过（无需修改）

| 位置 | 逻辑 | 状态 |
|------|------|------|
| 数据库 `add_transaction` 函数 | inbound→stock+qty, outbound→stock-qty | 正确 |
| `Inbound.tsx` 表单 | counterparty 标记为"供应商"，type='inbound' | 正确 |
| `Outbound.tsx` 表单 | counterparty 标记为"客户"，type='outbound' | 正确 |
| `Inbound.tsx` 历史表 | 数量显示 `+N`(绿色) = 库存维度正确 | 正确 |
| `Outbound.tsx` 历史表 | 数量显示 `-N`(红色) = 库存维度正确 | 正确 |
| `Index.tsx` 最近流水表 | 入库+绿/出库-红 = 库存维度正确 | 正确 |
| `Reports.tsx` 差异对账表 | 入库+绿/出库-红 = 库存盘点视角正确 | 正确 |
| `useInventoryData.ts` RPC调用 | 参数映射正确 | 正确 |

### 需要修复的问题

| # | 文件 | 行号 | 问题 | 修正 |
|---|------|------|------|------|
| 1 | `Reports.tsx` | L71 | `netFlow = monthInbound - monthOutbound` | → `monthOutbound - monthInbound`（出库收入-入库成本=净现金流） |
| 2 | `Reports.tsx` | L205 | 标签"净流入" | → "净现金流" |
| 3 | `Index.tsx` | L78 | 出库额用红色(destructive) | → 绿色(success)，因为出库=销售收入 |
| 4 | `Index.tsx` | L77 | 入库额用蓝色(info) | → 橙色(warning)，因为入库=采购支出 |

### 备注
- 库存页面的 +/- 和红/绿 是**库存数量**视角，入库=+绿(库存增)、出库=-红(库存减)，**正确不改**
- 报表统计金额卡片和净现金流是**资金**视角，需要修正颜色和公式
- 图表中入库/出库柱状图使用中性色(靛蓝/琥珀)做区分，不带正负语义，**正确不改**

---

## 修改1：账号登录系统

### 数据库变更
- **新建 `profiles` 表**：`id uuid PK = auth.uid()`, `display_name text`, `role text CHECK('warehouse','purchasing','boss')`
- **创建触发器**：`auth.users` 新用户自动创建 profile（默认 role='warehouse'）
- **RLS**：用户只能读写自己的 profile
- **启用 auto-confirm email**

### 新建文件
- `src/hooks/useAuth.ts` — auth 状态 hook
  - `onAuthStateChange` 监听 → 查询 profile → 提供 `{user, session, role, loading, signIn, signUp, signOut}`
- `src/pages/Login.tsx` — 登录/注册页
  - 登录 Tab：邮箱+密码
  - 注册 Tab：邮箱+密码+角色选择(仓管/采购/老板)
  - 注册后更新 profile.role

### 修改文件
| 文件 | 变更 |
|------|------|
| `src/router.tsx` | 添加 `/login`; Layout 包裹 AuthGuard（未登录→重定向login） |
| `src/components/Layout.tsx` | 角色切换器 → 用户名+角色标签+退出按钮 |
| `src/components/AppSidebar.tsx` | `currentRole` 改从 useAuth 读取 |
| `src/pages/Index.tsx` | `currentRole` 改从 useAuth 读取 |
| `src/pages/PurchaseOrders.tsx` | `currentRole` 改从 useAuth 读取 |
| `src/store/inventoryStore.ts` | 可删除（role不再本地管理） |

---

## 修改3：报表时间选择器

### 修改文件：`src/pages/Reports.tsx`
- 标题行右侧添加：开始日期 + 结束日期（`<input type="date">`）
- 默认：开始=90天前，结束=今天
- 新增 `filteredTransactions = transactions.filter(t => t.date >= start && t.date <= end)`
- 所有 Tab 的图表/计算统一使用 filteredTransactions 而非 transactions
- 月度图表动态生成月份列表（根据选中范围）
- 每日趋势图动态生成日期列表（根据选中范围）

---

## 执行顺序
1. 修复现金流逻辑（最小改动，立即见效）
2. 添加报表时间选择器
3. 实现账号登录系统（最大改动）

## 验证方式
1. 现金流：入库额>出库额时净现金流为负（红色），反之为正（绿色）
2. 时间选择：切换日期范围后图表数据即时更新
3. 登录：3个不同角色账号登录后权限菜单不同
