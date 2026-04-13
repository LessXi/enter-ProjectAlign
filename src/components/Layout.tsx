import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useInventoryStore } from '@/store/inventoryStore';
import type { Role } from '@/types/inventory';
import { User, ShoppingCart, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const roleConfig: Record<Role, { label: string; icon: typeof User }> = {
  warehouse: { label: '仓管', icon: User },
  purchasing: { label: '采购', icon: ShoppingCart },
  boss: { label: '老板', icon: Crown },
};

const roles: Role[] = ['warehouse', 'purchasing', 'boss'];

export function Layout() {
  const currentRole = useInventoryStore((s) => s.currentRole);
  const setRole = useInventoryStore((s) => s.setRole);

  return (
    <div className="h-full flex overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b flex items-center justify-between px-6 flex-shrink-0">
          <div />
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {roles.map((role) => {
              const config = roleConfig[role];
              const isActive = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setRole(role)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <config.icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
