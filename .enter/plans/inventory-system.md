# 方案：三项修复 — 账号登录 + 现金流逻辑 + 报表时间选择

## Context
用户反馈三个核心问题：
1. 三个角色(仓管/采购/老板)应通过账号登录，而非手动切换
2. 入库=花钱(采购成本)，出库=赚钱(销售收入)，净现金流公式写反了
3. 对账报表需要时间段选择器

---

## 修改1：账号登录系统

### 数据库变更
- **新建 `profiles` 表**：`id uuid PK`, `display_name text`, `role text CHECK(仓管/采购/老板)`
- **创建触发器**：`auth.users` 新增用户时自动创建 profile（默认角色为 'warehouse'）
- **RLS 策略**：用户只能读取自己的 profile
- **启用 auto-confirm**：方便测试注册

### 新建文件
- `src/hooks/useAuth.ts` — 封装 auth 状态管理（session/user/profile/role）
  - 使用 `supabase.auth.onAuthStateChange` 监听登录状态
  - 登录后从 `profiles` 表读取 role
  - 导出 `useAuth()` hook
- `src/pages/Login.tsx` — 登录/注册页面
  - 邮箱+密码登录
  - 注册时选择角色（仓管/采购/老板）
  - 注册后自动更新 profile.role

### 修改文件
| 文件 | 变更 |
|------|------|
| `src/router.tsx` | 添加 `/login` 路由，用 AuthGuard 包裹 Layout |
| `src/components/Layout.tsx` | 移除角色切换器 → 显示当前用户名+角色+退出登录按钮 |
| `src/store/inventoryStore.ts` | 删除 role 状态 → 改从 useAuth hook 获取 |
| 所有页面引用 `useInventoryStore.currentRole` | 改为 `useAuth().role` |

---

## 修改2：现金流逻辑修正

### 修改文件
| 文件 | 行号 | 当前 | 修正 |
|------|------|------|------|
| `src/pages/Reports.tsx` | L71 | `netFlow = monthInbound - monthOutbound` | `netFlow = monthOutbound - monthInbound` |
| `src/pages/Reports.tsx` | L205 | 标签"净流入" | 改为"净现金流" |
| `src/pages/Index.tsx` | L78 | 出库额用红色(destructive) | 改为绿色(success)，因为出库=收入 |
| `src/pages/Index.tsx` | L77 | 入库额用蓝色(info) | 改为橙色(warning)，因为入库=支出 |

---

## 修改3：报表时间选择器

### 修改文件
- `src/pages/Reports.tsx`
  - 在标题行右侧添加日期范围选择器（开始日期 + 结束日期）
  - 默认范围：最近30天
  - 所有 Tab（进出总览/品类分析/库存健康/差异对账）共享同一时间筛选
  - 用两个 `<input type="date">` 实现（简洁直观）
  - 根据选中范围过滤 transactions 后再计算所有图表数据

---

## 关键文件清单
- `src/hooks/useAuth.ts` (新建)
- `src/pages/Login.tsx` (新建)
- `src/router.tsx` (修改)
- `src/components/Layout.tsx` (修改)
- `src/components/AppSidebar.tsx` (修改 - 读取 auth role)
- `src/store/inventoryStore.ts` (简化/删除)
- `src/pages/Index.tsx` (修改)
- `src/pages/Reports.tsx` (修改)
- `src/pages/PurchaseOrders.tsx` (修改 - role 来源切换)
- 数据库迁移：profiles 表 + 触发器

## 验证方式
1. 注册3个账号分别选择仓管/采购/老板，验证登录后权限正确
2. 检查报表"净现金流"：入库额>出库额时应显示负值（红色）
3. 报表选择不同日期范围，图表数据应动态更新
