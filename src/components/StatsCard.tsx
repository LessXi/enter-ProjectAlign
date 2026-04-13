import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: string;
}

export function StatsCard({ title, value, icon: Icon, iconClassName, trend }: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg p-5 shadow-card flex items-center gap-4">
      <div className={cn('flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center', iconClassName || 'bg-primary/10 text-primary')}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{title}</p>
        <p className="text-2xl font-semibold text-card-foreground">{value}</p>
        {trend && <p className="text-xs text-muted-foreground mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
