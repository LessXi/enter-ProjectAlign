# AGENTS.md — AI Agent 技术导航

> 本文件供 AI Agent 快速理解项目架构和编码规范，修改代码前必读。

## 项目概述

服装批发进销存系统。前端 React + TypeScript + Vite + Tailwind + shadcn/ui，后端 Supabase（PostgreSQL + Edge Functions + Auth）。三种角色：`warehouse`（仓管）、`purchasing`（采购）、`boss`（老板）。

## 关键文件索引

### 页面组件
| 文件 | 功能 | 角色限制 |
|------|------|----------|
| `src/pages/Index.tsx` | 工作台 Dashboard（Bento Grid、图表、预警、流水） | 全部 |
| `src/pages/Inventory.tsx` | 库存管理（搜索、筛选） | 全部 |
| `src/pages/Inbound.tsx` | 入库登记（表单 + 历史） | 仓管/老板 |
| `src/pages/Outbound.tsx` | 出库登记（表单 + 历史） | 仓管/老板 |
| `src/pages/PurchaseOrders.tsx` | 采购单管理（创建/审批/收货） | 采购/老板 |
| `src/pages/Reports.tsx` | 对账报表（四维度分析） | 全部 |
| `src/pages/StaffManagement.tsx` | 员工管理（CRUD） | 仅老板 |
| `src/pages/Login.tsx` | 登录（仅登录，无注册） | 未登录 |

### 核心组件
| 文件 | 说明 |
|------|------|
| `src/components/Layout.tsx` | 认证守卫 + 布局（Header + Sidebar + Outlet） |
| `src/components/AppSidebar.tsx` | 侧边栏导航（按角色过滤菜单项） |
| `src/components/StatsCard.tsx` | 统计卡片，5 种变体：`default`/`mint`/`lavender`/`dark`/`warning` |
| `src/components/StatusBadge.tsx` | 状态徽章：`StockBadge`（库存）、`POBadge`（采购单） |

### Hooks
| 文件 | 说明 |
|------|------|
| `src/hooks/useAuth.tsx` | React Context 认证。提供 `user`/`session`/`role`/`displayName`/`signIn`/`signOut`。支持姓名登录（通过 RPC `lookup_email_by_name`） |
| `src/hooks/useInventoryData.ts` | 数据层。所有 Supabase 查询/变更封装为 React Query hooks |

### Hooks 详情 (`useInventoryData.ts`)
| Hook | 类型 | 说明 |
|------|------|------|
| `useProducts()` | Query | 商品列表 |
| `useTransactions()` | Query | 流水列表（按日期+创建时间倒序） |
| `usePurchaseOrders()` | Query | 采购单 + 明细（join） |
| `useAddTransaction()` | Mutation | 调用 RPC `add_transaction` 原子入库/出库 |
| `useAddProduct()` | Mutation | 创建新商品（name, sku, category, spec, threshold, unit_price） |
| `useCreatePO()` | Mutation | 创建采购单 + 明细 |
| `useUpdatePOStatus()` | Mutation | 更新采购单状态 |
| `useReceivePO()` | Mutation | 收货：为每个采购项创建入库交易 + 更新状态为 `received` |

### 类型定义
| 文件 | 关键类型 |
|------|----------|
| `src/types/inventory.ts` | `Role`、`StockStatus`、`POStatus`、`TransactionType`、`InventoryItem`、`Transaction`、`PurchaseOrder`、`POItem` |

### 样式/设计系统
| 文件 | 说明 |
|------|------|
| `src/index.css` | CSS 变量（颜色 Token、阴影、动画 keyframes、自定义滚动条） |
| `tailwind.config.ts` | 扩展颜色（mint/lavender/success/warning 等）、阴影、动画 |

### 后端 Edge Functions
| 函数 | 端点 | 说明 |
|------|------|------|
| `admin-create-user` | POST | 创建用户（含密码明文存储到 profiles） |
| `admin-list-users` | POST | 列出所有用户及 profile |
| `admin-manage-user` | POST | 更新/删除用户 |
| `bootstrap-boss` | POST | 初始化老板账号 |

所有 Edge Function 统一返回 HTTP 200，错误信息放在 `response.body.error` 中。

### 自动生成文件（勿手动修改）
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`

## 数据流

```
Supabase DB
    ↕ (supabase-js client)
React Query Hooks (useProducts / useTransactions / usePurchaseOrders)
    ↕
Page Components (Index / Reports / Inbound / Outbound / ...)
```

写操作（入库/出库/采购单）通过 Mutation hooks → 成功后 `invalidateQueries` 自动刷新相关数据。

## 数据库

### 表结构
- **products**: id(uuid PK), sku(unique), name, category, spec, stock(int), threshold(int), unit_price(numeric)
- **transactions**: id(uuid PK), type('inbound'|'outbound'), product_id(FK→products), quantity, unit_price, counterparty, date, note
- **purchase_orders**: id(uuid PK), po_number(unique), supplier, status('draft'|'pending'|'approved'|'received'|'rejected'), created_date, expected_date, note
- **purchase_order_items**: id(uuid PK), po_id(FK→purchase_orders), product_id(FK→products), quantity, unit_price
- **profiles**: id(uuid PK, FK→auth.users), role, display_name, password_plain

### 关键 RPC
- `add_transaction(p_type, p_product_id, p_quantity, p_unit_price, p_counterparty, p_date, p_note)`: 原子插入流水 + 更新商品库存
- `lookup_email_by_name(p_name)`: 根据 display_name 查 email（支持姓名登录）

### RLS
所有表均启用 RLS。当前策略为宽松模式（`USING true`），适合内部管理系统。profiles 表限制用户只能读写自己的记录。

## 设计规范

### 颜色语义（全局统一）
| 业务含义 | 颜色名 | Hex | HSL | 使用场景 |
|----------|--------|-----|-----|----------|
| 入库（支出） | Lavender | `#B3A1FF` | `hsl(255, 80%, 82%)` | 图表 fill/stroke、图标背景、数字颜色 |
| 出库（收入） | Mint | `#A4F5A6` | `hsl(145, 55%, 78%)` | 同上 |
| 预警 | Warning | — | `hsl(38, 75%, 52%)` | 预警卡片、预警徽章 |
| 告急 | Destructive | — | `hsl(0, 65%, 52%)` | 告急徽章、错误提示 |
| 深色强调 | Dark | `#1A1A2E` | — | 按钮、侧边栏激活、图表暗色卡片 |

**重要**：修改图表或流水列表时，必须遵守入库=lavender、出库=mint 的规则，不可混淆。

### 卡片变体 (StatsCard)
- `default`: 白底 + 边框
- `mint`: 绿底（出库/收入语义）
- `lavender`: 紫底（入库/支出语义）
- `dark`: 深色底（强调/特殊信息）
- `warning`: 琥珀色底（预警语义）

### CSS Token
定义在 `src/index.css` 的 `:root` 中，使用 HSL 格式（无 `hsl()` 包裹），由 `tailwind.config.ts` 通过 `hsl(var(--xxx))` 引用。

### 动画
- `animate-fade-in-up`: 页面进入动画
- `animate-scale-in`: 弹窗/卡片出现
- `animate-pulse-slow`: 缓慢脉冲

## 业务规则

1. **现金流方向**：入库 = 花钱（成本/支出），出库 = 赚钱（收入）。利润 = 出库金额 - 入库金额。
2. **库存状态算法** (`src/lib/stockStatus.ts`)：
   - stock <= threshold * 0.3 → `critical`（告急）
   - stock <= threshold → `warning`（预警）
   - 其他 → `normal`（正常）
3. **采购单收货联动**：`useReceivePO` 遍历采购单每个明细项，调用 `add_transaction` RPC 创建入库流水，最后更新采购单状态为 `received`。
4. **采购单号生成**：`PO-{timestamp_base36}-{序号}`，避免并发冲突。
5. **报表粒度**：日期范围 <= 62 天用日粒度，> 62 天用月粒度。
6. **库存历史计算**：从当前总库存反向推算，逐日减去每日净变动量。
7. **认证**：支持邮箱和姓名登录。无自助注册，所有账号由老板在员工管理中创建。
8. **采购单新增商品**：采购单表单支持选择已有商品或新建商品，新建时 SKU 根据品类自动生成（品类前缀 + 递增编号）。
9. **Dashboard 图表**：本月进出按周汇总柱状图 + 利润折线（ComposedChart + 右侧 Y 轴）。
10. **移动端适配**：侧边栏手机端为抽屉式（点击汉堡按钮展开），Dashboard 网格响应式（1/2/4 列）。

## 注意事项

- 前端调用 Edge Function 必须用 `supabase.functions.invoke()`，不要直接 HTTP 请求。
- Edge Function 始终返回 HTTP 200，错误放在 body 的 `error` 字段。
- 不要直接修改 `src/integrations/supabase/` 下的文件。
- `src/store/inventoryStore.ts` 是遗留代码，实际认证使用 `useAuth` Context。
- 剪贴板操作使用 `document.execCommand('copy')` 而非 Clipboard API（因为 iframe 限制）。
- Toast 通知使用 `useToast` hook（来自 shadcn）。
- 用户操作指导见 `docs/USER_GUIDE.md`。
