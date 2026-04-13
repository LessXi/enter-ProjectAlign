import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingCart,
  BarChart3,
  Users,
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

export function AppSidebar() {
  const location = useLocation();
  const { role } = useAuth();
  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-56 shrink-0 bg-white/70 backdrop-blur-sm border-r border-[#1A1A2E]/5 flex flex-col py-6 px-3 gap-1">
      {/* Brand */}
      <div className="px-3 mb-6">
        <h1 className="text-lg font-bold text-[#1A1A2E] tracking-tight">
          <span className="inline-block w-2 h-2 rounded-full bg-mint mr-2 translate-y-[-1px]" />
          衣仓管家
        </h1>
        <p className="text-[11px] text-[#1A1A2E]/40 mt-0.5 pl-4">服装批发进销存</p>
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
    </aside>
  );
}
