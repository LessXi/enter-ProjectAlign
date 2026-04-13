# UI Redesign: Pastel Bento Layout

## Context
Current design has correct pastel colors (sage background, mint/lavender accents) but the **layout is ugly** — flat ERP-style rows with dark cards on sage green looks harsh. The user wants the **bento grid aesthetic** from the pastel-crypto-data reference component: rounded cards with mixed sizing, white/light cards (not dark), visual hierarchy, and engaging layouts.

## Core Design Direction Change
**FROM**: Dark cards (#1A1A1A) on sage background → harsh, low-contrast, ugly  
**TO**: White cards on soft sage background, with **mint** and **lavender accent cards** for visual interest — matching the reference component's light, airy, premium feel

## Files to Modify

### 1. `src/index.css` — Color System Fix
- **card**: Change from dark (`0 0% 10%`) to **white** (`0 0% 100%`)
- **card-foreground**: Change from light (`0 0% 96%`) to **dark** (`0 0% 10%`)
- **input/border**: Lighten for white card context
- **sidebar**: Keep dark for contrast (matches reference sidebar feel)
- **popover**: Switch to white

### 2. `src/components/Layout.tsx` — Header Redesign
- White header with subtle bottom border
- Clean minimal design to match light card aesthetic

### 3. `src/components/AppSidebar.tsx` — Keep dark sidebar (good contrast with light content area)
- Minor polish: slightly softer active state

### 4. `src/pages/Index.tsx` — **BENTO GRID LAYOUT** (biggest change)
Current: flat rows of StatsCards + 2-col tables  
New layout:
- **Bento grid** with mixed-size cards
- Featured stat cards with **mint** or **lavender backgrounds** (like reference)
- Mini bar chart in a tall card (like SalesStatisticsCard)
- Inventory warnings in a prominent card
- Recent transactions in a compact card
- Boss gets extra approval card
- Use `grid-rows-*` and `row-span-*` for varied heights

### 5. `src/components/StatsCard.tsx` — Enhanced Card Variants
- Add `variant` prop: 'default' | 'mint' | 'lavender' | 'dark'
- 'mint': bg-[#A4F5A6] with dark text (like reference BTC card)
- 'lavender': bg-[#B3A1FF] with white text (like reference Market Cap card)
- 'dark': bg-[#1A1A1A] with white text (like reference Sales card)
- Larger font for value, more padding for bento feel

### 6. `src/pages/Inventory.tsx` — Light card tables
- White card with proper contrast for table content
- Search bar and filter styled for light theme

### 7. `src/pages/Inbound.tsx` + `src/pages/Outbound.tsx`
- White card forms and tables
- Form labels in dark text, inputs with light borders

### 8. `src/pages/PurchaseOrders.tsx`
- Same white card treatment for forms/tables

### 9. `src/pages/Reports.tsx`
- White chart cards
- KPI cards with mint/lavender accent versions
- Chart tooltip style unchanged (dark works well for contrast)

### 10. `src/pages/StaffManagement.tsx`
- White card table, white dialog backgrounds
- Light form inputs

### 11. `src/pages/Login.tsx`
- White card on sage background (clean, premium look)
- Tab switcher with mint accent
- Input fields with light borders

### 12. `src/components/StatusBadge.tsx`
- Adjust for light card background context

### 13. `tailwind.config.ts`
- Add `mint` and `lavender` color tokens
- Keep existing shadow/animation configs

## Key Bento Grid Layout for Dashboard (Index.tsx)

```
┌──────────────┬──────────────┬──────────────┐
│   SKU Count  │  Warning     │   Monthly    │
│   (mint bg)  │  Count       │   Trend      │
│              │  (lavender)  │   Bar Chart  │
├──────────────┼──────────────┤   (dark bg,  │
│  Inbound $   │  Outbound $  │   tall card) │
│  (white)     │  (white)     │              │
├──────────────┴──────────────┼──────────────┤
│   Inventory Warnings        │  Recent Txs  │
│   (white, full table)       │  (white)     │
└─────────────────────────────┴──────────────┘
```

Boss gets additional row: Inventory Value (mint), Pending POs card

## Verification
1. Login page: white card should be clearly readable on sage background
2. Dashboard: bento grid with mixed card sizes and accent colors
3. All tables: dark text on white card background — proper contrast
4. Chart tooltips: keep dark style (good contrast on hover)
5. Sidebar: remains dark for visual anchor
6. Forms: white cards with properly visible input fields
7. No white-on-white or dark-on-dark contrast issues
