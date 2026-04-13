import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  BarChart3,
  Warehouse,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/inventory';

const allMenuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard, roles: ['warehouse', 'purchasing', 'boss'] as Role[] },
  { path: '/inventory', label: '库存管理', icon: Package, roles: ['warehouse', 'purchasing', 'boss'] as Role[] },
  { path: '/inbound', label: '入库管理', icon: ArrowDownToLine, roles: ['warehouse', 'purchasing'] as Role[] },
  { path: '/outbound', label: '出库管理', icon: ArrowUpFromLine, roles: ['warehouse', 'purchasing'] as Role[] },
  { path: '/purchase-orders', label: '采购单', icon: ClipboardList, roles: ['warehouse', 'purchasing', 'boss'] as Role[] },
  { path: '/reports', label: '对账报表', icon: BarChart3, roles: ['warehouse', 'purchasing', 'boss'] as Role[] },
  { path: '/staff', label: '员工管理', icon: Users, roles: ['boss'] as Role[] },
];

export function AppSidebar() {
  const location = useLocation();
  const { role } = useAuth();

  const visibleItems = allMenuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-60 h-full bg-sidebar flex flex-col flex-shrink-0">
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Warehouse className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-sidebar-foreground">进销存系统</h1>
          <p className="text-xs text-sidebar-foreground/60">服装批发管理</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 px-3">v1.0 · 服装批发ERP</p>
      </div>
    </aside>
  );
}
