import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Loader2 } from 'lucide-react';

const roleLabel: Record<string, string> = {
  warehouse: '仓管',
  purchasing: '采购',
  boss: '老板',
};

const roleBadge: Record<string, string> = {
  warehouse: 'bg-accent/20 text-accent',
  purchasing: 'bg-warning/20 text-warning',
  boss: 'bg-primary/20 text-primary',
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
    <div className="h-full flex overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border/30 flex items-center justify-between px-6 flex-shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge[role] ?? 'bg-secondary text-secondary-foreground'}`}>
              {roleLabel[role] ?? role}
            </span>
            <span className="text-sm font-medium text-card-foreground">
              {displayName || user.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-card-foreground/50 hover:text-card-foreground hover:bg-card-foreground/10 transition-all duration-200"
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
