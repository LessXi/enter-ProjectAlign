import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingCart,
  BarChart3,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/inventory';

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  { title: '工作台', icon: LayoutDashboard, path: '/', roles: ['warehouse', 'purchasing', 'boss'] },
  { title: '库存管理', icon: Package, path: '/inventory', roles: ['warehouse', 'purchasing', 'boss'] },
  { title: '入库登记', icon: ArrowDownToLine, path: '/inbound', roles: ['warehouse', 'boss'] },
  { title: '出库登记', icon: ArrowUpFromLine, path: '/outbound', roles: ['warehouse', 'boss'] },
  { title: '采购单', icon: ShoppingCart, path: '/purchase-orders', roles: ['purchasing', 'boss'] },
  { title: '对账报表', icon: BarChart3, path: '/reports', roles: ['warehouse', 'purchasing', 'boss'] },
  { title: '员工管理', icon: Users, path: '/staff', roles: ['boss'] },
];

interface AppSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { role } = useAuth();
  const filtered = navItems.filter((item) => item.roles.includes(role));

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-3 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1A1A2E] tracking-tight">
            <span className="inline-block w-2 h-2 rounded-full bg-mint mr-2 translate-y-[-1px]" />
            衣仓管家
          </h1>
          <p className="text-[11px] text-[#1A1A2E]/40 mt-0.5 pl-4">服装批发进销存</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X className="w-5 h-5 text-[#1A1A2E]/60" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {filtered.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#1A1A2E] text-white shadow-md shadow-[#1A1A2E]/20'
                  : 'text-[#1A1A2E]/60 hover:text-[#1A1A2E] hover:bg-[#1A1A2E]/5'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-mint' : ''}`} />
              {item.title}
              {isActive && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-mint" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-white/70 backdrop-blur-sm border-r border-[#1A1A2E]/5 flex-col py-6 px-3 gap-1">
        {sidebarContent}
      </aside>

      {/* Mobile overlay + drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md shadow-elevated flex flex-col py-6 px-3 gap-1 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
