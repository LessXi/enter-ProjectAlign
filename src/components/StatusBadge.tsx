import { cn } from '@/lib/utils';
import type { StockStatus, POStatus } from '@/types/inventory';

const stockStatusConfig: Record<StockStatus, { label: string; className: string }> = {
  normal: { label: '正常', className: 'bg-success-bg text-success' },
  warning: { label: '预警', className: 'bg-warning-bg text-warning' },
  critical: { label: '告急', className: 'bg-destructive-bg text-destructive' },
};

const poStatusConfig: Record<POStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-muted text-muted-foreground' },
  pending: { label: '待审批', className: 'bg-info-bg text-info' },
  approved: { label: '已批准', className: 'bg-warning-bg text-warning' },
  received: { label: '已收货', className: 'bg-success-bg text-success' },
  rejected: { label: '已驳回', className: 'bg-destructive-bg text-destructive' },
};

export function StockBadge({ status }: { status: StockStatus }) {
  const config = stockStatusConfig[status];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}

export function POBadge({ status }: { status: POStatus }) {
  const config = poStatusConfig[status];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}


