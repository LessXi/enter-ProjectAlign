import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Loader2, Menu } from 'lucide-react';

const roleLabel: Record<string, string> = {
  warehouse: '仓管',
  purchasing: '采购',
  boss: '老板',
};

const roleBadge: Record<string, string> = {
  warehouse: 'bg-info-bg text-info',
  purchasing: 'bg-warning-bg text-warning',
  boss: 'bg-success-bg text-success',
};

export function Layout() {
  const { user, loading, role, displayName, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-full flex overflow-hidden bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-background flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-card transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          {/* Spacer on desktop */}
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleBadge[role] ?? 'bg-secondary text-secondary-foreground'}`}>
              {roleLabel[role] ?? role}
            </span>
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {displayName || user.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto px-4 sm:px-6 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
