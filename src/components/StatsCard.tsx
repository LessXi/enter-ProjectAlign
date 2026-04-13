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
    <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4 transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5 hover:scale-[1.01]">
      <div className={cn('flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center', iconClassName || 'bg-primary/20 text-primary')}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-card-foreground/50 truncate">{title}</p>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        {trend && <p className="text-xs text-card-foreground/40 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
