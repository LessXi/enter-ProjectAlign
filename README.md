# 衣仓管家 — 服装批发进销存管理系统

一套面向服装批发公司的进销存管理系统，覆盖库存管理、出入库登记、采购审批、对账报表、员工管理等核心业务流程，支持多角色权限控制。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| UI 组件 | shadcn/ui + Radix UI |
| 样式 | Tailwind CSS 3 |
| 图表 | Recharts 3 |
| 状态管理 | @tanstack/react-query（服务端状态）、React Context（认证） |
| 后端 | Enter Cloud (Supabase)：PostgreSQL + Edge Functions + Auth |
| 图标 | lucide-react |

## 功能模块

### 工作台 (Dashboard)
- Bento Grid 布局，展示 KPI 卡片（SKU 数、预警商品、入库额、出库额、库存总值、待审批）
- 近 6 月进出趋势柱状图
- 库存预警表（采购角色可一键跳转补货）
- 最近 20 条流水（商品名、对手方、数量、金额）
- 老板可见待审批采购单列表

### 库存管理
- 全商品列表，支持搜索（品名/SKU/规格）和状态筛选（正常/预警/告急）

### 入库/出库登记
- 表单录入：商品、数量、单价、对手方、日期、备注
- 通过数据库 RPC `add_transaction` 原子更新库存
- 历史记录列表

### 采购单管理
- 创建采购单（支持从预警商品预填信息）
- 状态流转：草稿 → 待审批 → 已批准 → 已收货 / 已驳回
- 收货操作联动入库：自动为每个采购项创建入库交易并更新库存

### 对账报表
- 时间段筛选：今日/本周/本月/本季度/本年/自定义
- 智能粒度：<=62 天按日、>62 天按月
- 四个分析维度：
  - **进出总览**：金额柱状图 + 数量趋势线
  - **品类分析**：饼图占比 + Top 5 热销 + 品类明细表
  - **库存健康**：状态分布饼图 + 库存总量变化趋势 + 预警商品表
  - **差异对账**：差异值分布图 + 对账明细表

### 员工管理（仅老板）
- 创建/编辑/删除员工账号
- 支持密码查看、一键复制账号信息
- 三种角色分配：仓管/采购/老板

## 角色权限

| 功能 | 仓管 | 采购 | 老板 |
|------|:----:|:----:|:----:|
| 工作台 | O | O | O |
| 库存管理 | O | O | O |
| 入库登记 | O | - | O |
| 出库登记 | O | - | O |
| 采购单 | - | O | O |
| 对账报表 | O | O | O |
| 员工管理 | - | - | O |
| 审批采购单 | - | - | O |
| 收货入库 | - | O | - |

## 数据库结构

```
products          — 商品表（SKU、名称、品类、规格、库存、阈值、单价）
transactions      — 出入库流水表（类型、商品、数量、单价、对手方、日期）
purchase_orders   — 采购单表（单号、供应商、状态、日期）
purchase_order_items — 采购单明细（关联采购单、商品、数量、单价）
profiles          — 用户档案表（角色、显示名、密码明文备份）
```

所有表均启用 RLS (Row Level Security)。库存变更通过 `add_transaction` RPC 函数原子执行。

## 设计系统

- **背景**：Sage Green（`hsl(100, 8%, 88%)`）
- **卡片**：纯白圆角（3xl = 1.5rem），柔和阴影
- **语义色**：
  - 入库（支出） = Lavender 紫色（`#B3A1FF` / `hsl(255, 80%, 82%)`）
  - 出库（收入） = Mint 绿色（`#A4F5A6` / `hsl(145, 55%, 78%)`）
  - 预警 = Amber 琥珀色
  - 深色强调 = `#1A1A2E`
- **字体**：系统默认字体栈
- **动画**：fadeInUp、scaleIn、pulseSlow

## 项目结构

```
src/
  App.tsx                  — 根组件（Provider 树）
  router.tsx               — 路由配置
  main.tsx                 — 入口文件
  index.css                — 设计系统 Token + 动画 + 自定义滚动条
  pages/
    Index.tsx              — 工作台/Dashboard
    Inventory.tsx          — 库存管理
    Inbound.tsx            — 入库登记
    Outbound.tsx           — 出库登记
    PurchaseOrders.tsx     — 采购单管理
    Reports.tsx            — 对账报表
    StaffManagement.tsx    — 员工管理
    Login.tsx              — 登录/注册
    NotFound.tsx           — 404 页面
  components/
    Layout.tsx             — 认证守卫 + 页面布局
    AppSidebar.tsx         — 侧边栏导航
    StatsCard.tsx          — 统计卡片（5 种变体）
    StatusBadge.tsx        — 状态徽章（库存状态 + 采购单状态）
    ui/                    — shadcn/ui 基础组件
  hooks/
    useAuth.tsx            — 认证 Context（登录/注册/登出/角色）
    useInventoryData.ts    — 数据 Hooks（React Query + Supabase）
    use-toast.ts           — Toast 通知
    use-mobile.tsx         — 移动端检测
  types/
    inventory.ts           — 业务类型定义
  lib/
    stockStatus.ts         — 库存状态计算
    utils.ts               — 工具函数
  integrations/supabase/
    client.ts              — Supabase 客户端（自动生成，勿改）
    types.ts               — 数据库类型（自动生成，勿改）
  store/
    inventoryStore.ts      — Zustand store（已弃用，保留兼容）

supabase/
  functions/
    admin-create-user/     — 创建用户
    admin-list-users/      — 列出所有用户
    admin-manage-user/     — 编辑/删除用户
    bootstrap-boss/        — 初始化老板账号
  migrations/              — 数据库迁移文件

tailwind.config.ts         — Tailwind 扩展配置
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 代码检查
pnpm lint
```
