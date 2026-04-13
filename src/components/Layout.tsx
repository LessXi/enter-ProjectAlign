import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Loader2 } from 'lucide-react';

const roleLabel: Record<string, string> = {
  warehouse: '仓管',
  purchasing: '采购',
  boss: '老板',
};

const roleBg: Record<string, string> = {
  warehouse: 'bg-info-bg text-info',
  purchasing: 'bg-warning-bg text-warning',
  boss: 'bg-success-bg text-success',
};

export function Layout() {
  const { user, loading, role, displayName, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-full flex overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b flex items-center justify-between px-6 flex-shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleBg[role] ?? 'bg-secondary text-foreground'}`}>
              {roleLabel[role] ?? role}
            </span>
            <span className="text-sm font-medium text-foreground">
              {displayName || user.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
