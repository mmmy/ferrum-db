import { EnvironmentBadge } from '@/components/connections/EnvironmentBadge';
import { ActiveSession } from '@/types/workspace';

interface SessionStripProps {
  session: ActiveSession;
  onShowConnections: () => void;
  onCloseSession: () => void;
}

export function SessionStrip({ session, onShowConnections, onCloseSession }: SessionStripProps) {
  return (
    <section className="border-b border-neutral-800/50 bg-neutral-950/90 px-6 py-3 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/80">
              Active Session
            </span>
            {session.environment ? <EnvironmentBadge environment={session.environment} /> : null}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-label uppercase tracking-[0.18em] ${
                session.safetyMode === 'read-only'
                  ? 'border-error/25 bg-error-container/15 text-error'
                  : 'border-primary/20 bg-primary-container/15 text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {session.safetyMode === 'read-only' ? 'lock' : 'verified'}
              </span>
              {session.safetyMode === 'read-only' ? 'Read-Only' : 'Standard Access'}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-base font-headline font-semibold text-on-surface">
              {session.connectionName}
            </h2>
            <span className="text-sm text-on-surface-variant">
              {session.database ?? 'No default database'} • {session.dbType}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onShowConnections}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-800/60 bg-surface-container-low px-3 py-2 text-sm font-label uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-base">hub</span>
            Connections
          </button>
          <button
            type="button"
            onClick={onCloseSession}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-800/60 bg-surface-container-low px-3 py-2 text-sm font-label uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:border-error/20 hover:text-error"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Close Session
          </button>
        </div>
      </div>
    </section>
  );
}
