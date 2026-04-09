import { ConnectionRuntimeState } from '@/types/workspace';

interface ConnectionCardActionsProps {
  runtimeState: ConnectionRuntimeState;
  isActiveSession: boolean;
  onTest: () => void;
  onRetry: () => void;
  onEnterWorkspace: () => void;
}

export function ConnectionCardActions({
  runtimeState,
  isActiveSession,
  onTest,
  onRetry,
  onEnterWorkspace,
}: ConnectionCardActionsProps) {
  if (runtimeState.status === 'reconnecting') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-secondary/20 bg-secondary-container/10 px-3 py-2 text-sm font-label uppercase tracking-[0.18em] text-secondary/85"
      >
        <span className="material-symbols-outlined text-base">sync</span>
        Reconnecting...
      </button>
    );
  }

  if (runtimeState.status === 'connected') {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onEnterWorkspace}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-label font-medium uppercase tracking-[0.18em] text-neutral-950 transition-colors hover:bg-primary-dim"
        >
          <span className="material-symbols-outlined text-base">
            {isActiveSession ? 'launch' : 'table_rows'}
          </span>
          {isActiveSession ? 'Resume Workspace' : 'Enter Workspace'}
        </button>
        <button
          type="button"
          onClick={onTest}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-800/60 bg-surface-container-low px-3 py-2 text-sm font-label uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Retest
        </button>
      </div>
    );
  }

  if (runtimeState.status === 'failed') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-error/25 bg-error-container/10 px-3 py-2 text-sm font-label uppercase tracking-[0.18em] text-error transition-colors hover:bg-error-container/20"
      >
        <span className="material-symbols-outlined text-base">refresh</span>
        Retry Connection
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onTest}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-label font-medium uppercase tracking-[0.18em] text-neutral-950 transition-colors hover:bg-primary-dim"
    >
      <span className="material-symbols-outlined text-base">bolt</span>
      Test Connection
    </button>
  );
}
