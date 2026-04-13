import { cn } from '@/lib/utils';
import type { StockStatus, POStatus } from '@/types/inventory';

const stockStatusConfig: Record<StockStatus, { label: string; className: string }> = {
  normal: { label: '正常', className: 'bg-primary/20 text-primary' },
  warning: { label: '预警', className: 'bg-warning/20 text-warning' },
  critical: { label: '告急', className: 'bg-destructive/20 text-destructive' },
};

const poStatusConfig: Record<POStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-card-foreground/10 text-card-foreground/60' },
  pending: { label: '待审批', className: 'bg-accent/20 text-accent' },
  approved: { label: '已批准', className: 'bg-warning/20 text-warning' },
  received: { label: '已收货', className: 'bg-primary/20 text-primary' },
  rejected: { label: '已驳回', className: 'bg-destructive/20 text-destructive' },
};

export function StockBadge({ status }: { status: StockStatus }) {
  const config = stockStatusConfig[status];
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}

export function POBadge({ status }: { status: POStatus }) {
  const config = poStatusConfig[status];
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}
