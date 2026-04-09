import { ConnectionLifecycleStatus } from '@/types/workspace';

interface ConnectionStatusBadgeProps {
  status: ConnectionLifecycleStatus;
}

const statusStyles: Record<ConnectionLifecycleStatus, string> = {
  idle: 'border-neutral-800 bg-surface-container-low text-on-surface-variant',
  connected: 'border-primary/25 bg-primary-container/15 text-primary',
  failed: 'border-error/25 bg-error-container/15 text-error',
  reconnecting: 'border-secondary/25 bg-secondary-container/15 text-secondary',
};

const statusLabels: Record<ConnectionLifecycleStatus, string> = {
  idle: 'Idle',
  connected: 'Connected',
  failed: 'Failed',
  reconnecting: 'Reconnecting',
};

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-label uppercase tracking-[0.18em] ${statusStyles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full bg-current ${status === 'reconnecting' ? 'animate-pulse' : ''}`}
      />
      {statusLabels[status]}
    </span>
  );
}
