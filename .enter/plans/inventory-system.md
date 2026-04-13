# Mobile Responsive Layout Fix

## Context
On mobile, the sidebar is always visible (w-56 fixed) which leaves only ~150px for content. Cards, text, and charts are squeezed and wrapping vertically. Need to make the entire app mobile-friendly.

## Changes

### 1. `src/components/AppSidebar.tsx`
- On mobile (< lg), sidebar becomes a **slide-out drawer** triggered by a hamburger button
- On desktop (>= lg), sidebar stays as-is (w-56 fixed)
- Use state + overlay pattern (no new dependencies needed)

### 2. `src/components/Layout.tsx`
- Add a mobile header with hamburger menu button (visible only on `lg:hidden`)
- Pass sidebar open/close state down or lift to Layout
- On desktop, keep current side-by-side layout unchanged

### 3. `src/pages/Index.tsx` (Dashboard)
- Bento grid: change from `grid-cols-2 lg:grid-cols-4` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Chart card: on mobile, `col-span-1` with a fixed height instead of row-span
- Content cards row: `grid-cols-1 lg:grid-cols-5` (already has this, just needs col-span adjustments on mobile)

### 4. Other pages (Inbound, Outbound, Inventory, PurchaseOrders, Reports, StaffManagement)
- Quick scan for any hardcoded widths or grids that break on mobile
- Most use table layouts which should get horizontal scroll on mobile

### 5. `src/components/StatsCard.tsx`
- No changes needed — already flexible

## Verification
- Test on mobile viewport (~375px wide)
- Sidebar should be hidden by default, accessible via hamburger
- Dashboard cards should stack vertically on small screens, 2-col on medium, 4-col on large
- All tables should be scrollable horizontally on mobile
