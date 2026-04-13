import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'mint' | 'lavender' | 'dark';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: CardVariant;
  className?: string;
}

const variantStyles: Record<CardVariant, { card: string; icon: string; title: string; value: string; subtitle: string }> = {
  default: {
    card: 'bg-card border border-border/50',
    icon: 'bg-muted/60 text-foreground/60',
    title: 'text-muted-foreground',
    value: 'text-card-foreground',
    subtitle: 'text-muted-foreground',
  },
  mint: {
    card: 'bg-mint border-none',
    icon: 'bg-black/10 text-black/70',
    title: 'text-black/50',
    value: 'text-black',
    subtitle: 'text-black/40',
  },
  lavender: {
    card: 'bg-lavender border-none',
    icon: 'bg-white/20 text-white/80',
    title: 'text-white/60',
    value: 'text-white',
    subtitle: 'text-white/50',
  },
  dark: {
    card: 'bg-[#1A1A2E] border-none',
    icon: 'bg-white/10 text-white/70',
    title: 'text-white/50',
    value: 'text-white',
    subtitle: 'text-white/40',
  },
};

export function StatsCard({ title, value, subtitle, icon: Icon, variant = 'default', className }: StatsCardProps) {
  const s = variantStyles[variant];

  return (
    <div className={cn(
      'rounded-3xl p-5 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5',
      s.card,
      className
    )}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', s.icon)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={cn('text-xs font-medium mb-1', s.title)}>{title}</p>
      <p className={cn('text-2xl font-bold tracking-tight', s.value)}>{value}</p>
      {subtitle && <p className={cn('text-xs mt-1', s.subtitle)}>{subtitle}</p>}
    </div>
  );
}
