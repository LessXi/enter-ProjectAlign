import type { StockStatus, POStatus } from '@/types/inventory';

const stockMap: Record<StockStatus, { label: string; className: string }> = {
  normal: { label: '正常', className: 'bg-success-bg text-success' },
  warning: { label: '预警', className: 'bg-warning-bg text-warning' },
  critical: { label: '告急', className: 'bg-destructive-bg text-destructive' },
};

const poMap: Record<POStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-muted text-muted-foreground' },
  pending: { label: '待审批', className: 'bg-warning-bg text-warning' },
  approved: { label: '已批准', className: 'bg-success-bg text-success' },
  rejected: { label: '已驳回', className: 'bg-destructive-bg text-destructive' },
  received: { label: '已收货', className: 'bg-info-bg text-info' },
};

export function StockBadge({ status }: { status: StockStatus }) {
  const s = stockMap[status];
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>;
}

export function POBadge({ status }: { status: POStatus }) {
  const s = poMap[status];
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>;
}
