# UI Redesign: Pastel-Crypto Style

## Context
The current UI uses a corporate indigo/dark sidebar design. The user wants the visual style of the "pastel-crypto-data" component: sage green backgrounds, dark (#1A1A1A) cards, mint green (#A4F5A6) accents, purple (#B3A1FF) highlights, large rounded corners (24-32px), and premium hover animations.

## Design System Changes

### 1. `src/index.css` — New Color Tokens
Remap all CSS variables to the pastel-crypto palette:
- **background**: sage green `~100 12% 83%` (#D5DCD4)
- **card**: dark `0 0% 10%` (#1A1A1A), foreground: white
- **primary**: mint green `125 85% 81%` (#A4F5A6), foreground: dark
- **secondary**: light gray `0 0% 96%` (#F5F5F5)
- **accent**: purple `255 48% 81%` (#B3A1FF), foreground: white
- **sidebar**: dark `0 0% 10%`, active: mint green
- **success**: mint green, **warning**: amber, **destructive**: coral red
- **border**: subtle dark transparent
- **radius**: `1.5rem` (24px) for large roundedness
- **shadow-card**: subtle dark shadow, **shadow-elevated**: deeper
- Add keyframe animations: fadeInUp, scaleIn, pulse-slow
- Dark mode: deeper sage/black variants

### 2. `tailwind.config.ts` — Animation Utilities
- Add `fadeInUp`, `scaleIn`, `pulse-slow` keyframes & animation classes
- borderRadius `lg` = 1.5rem, `xl` = 2rem (32px)

### 3. Component Updates

#### `src/components/AppSidebar.tsx`
- Dark bg (#1A1A1A) stays via `bg-sidebar`
- Active link: mint green bg with dark text
- Logo icon: mint green circle instead of indigo square
- Rounder items (rounded-xl)

#### `src/components/Layout.tsx`
- Header: dark bg (`bg-card`) with white text
- Role badges: mint/purple/amber pill styles
- Logout button: ghost on dark

#### `src/components/StatsCard.tsx`
- Dark card bg (auto from `bg-card`), white text (auto from `card-foreground`)
- Icon containers: mint/purple/amber circles (rounded-full)
- Hover: subtle lift + scale

#### `src/components/StatusBadge.tsx`
- Badges: mint green for "normal", amber for "warning", coral for "critical"
- More rounded (rounded-full pills)

#### `src/pages/Login.tsx`
- Sage green full-page bg (auto)
- Card: dark bg with white text
- Input: dark bg with lighter border
- Tab switcher: mint green active
- Role buttons: dark border, mint accent on select
- Primary button: mint green

#### `src/pages/Index.tsx`
- Stats cards auto-styled via design system
- Chart colors: mint green + purple bars
- Warning table: dark rows, mint/purple accents

#### `src/pages/Inventory.tsx`, `Inbound.tsx`, `Outbound.tsx`, `PurchaseOrders.tsx`
- Tables: dark header, alternating dark rows (via secondary)
- Inputs/selects: dark bg, light border, mint focus ring
- Buttons: mint primary, purple secondary

#### `src/pages/Reports.tsx`
- Chart colors: mint green + purple (instead of indigo + amber)
- Pill switchers: dark bg, mint active
- KPI cards: auto from design system

#### `src/pages/StaffManagement.tsx`
- Dialog: dark bg with white text
- Table: same dark theme

### Files to Modify
1. `src/index.css` — Complete token overhaul
2. `tailwind.config.ts` — Animations, larger radius
3. `src/components/AppSidebar.tsx` — Rounder, mint active state
4. `src/components/Layout.tsx` — Dark header
5. `src/components/StatsCard.tsx` — Icon circles, hover animation
6. `src/components/StatusBadge.tsx` — Rounded-full pills
7. `src/pages/Login.tsx` — Dark card, mint accents
8. `src/pages/Index.tsx` — Chart colors
9. `src/pages/Inventory.tsx` — Input/table styling
10. `src/pages/Inbound.tsx` — Form styling
11. `src/pages/Outbound.tsx` — Form styling
12. `src/pages/PurchaseOrders.tsx` — Form/table styling
13. `src/pages/Reports.tsx` — Chart colors, switcher pills
14. `src/pages/StaffManagement.tsx` — Dialog/table styling

### Verification
- All pages should render with sage green background, dark cards, mint/purple accents
- Text contrast passes WCAG AA on dark cards
- Hover animations (lift + scale) on cards
- Login page: dark card on sage green bg
- Charts use mint green + purple colors
- Sidebar: dark with mint active
