# 修复卡片语义配色

## Context
卡片配色未匹配业务语义：入库=花钱应偏冷色(lavender)、出库=赚钱应偏暖绿(mint)、预警应用警告色(amber)。

## Changes

### 1. StatsCard — 新增 warning 变体 (`src/components/StatsCard.tsx`)
- 新增 `warning` variant: amber/orange 背景色
- type 添加 `'warning'`

### 2. Dashboard 语义配色 (`src/pages/Index.tsx`)
| 卡片 | 当前 | 改为 | 原因 |
|---|---|---|---|
| 总SKU数 | mint | default | 中性信息 |
| 预警商品 | lavender | warning | 警告语义 |
| 本月入库额 | default | lavender | 支出/花钱 |
| 本月出库额 | dark | mint | 收入/赚钱 |
| 库存总值 | mint | default | 中性信息 |
| 待审批采购单 | lavender | dark | 紧急待办 |

### 3. Reports 语义配色 (`src/pages/Reports.tsx`)
| 卡片 | 当前 | 改为 |
|---|---|---|
| 入库总额 | bg-mint | bg-lavender (支出) |
| 出库总额 | bg-lavender | bg-mint (收入) |

## Verification
- 入库相关卡片 → 紫色系(lavender)
- 出库相关卡片 → 绿色系(mint)
- 预警 → 橙黄色(warning)
- 中性信息 → 白色(default)
