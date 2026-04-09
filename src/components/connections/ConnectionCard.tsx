import { Connection } from '@/types/connection';
import { ConnectionRuntimeState } from '@/types/workspace';
import { ConnectionCardActions } from './ConnectionCardActions';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { EnvironmentBadge } from './EnvironmentBadge';

interface ConnectionCardProps {
  connection: Connection;
  runtimeState?: ConnectionRuntimeState;
  isActiveSession?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onTestConnection?: () => void;
  onRetryConnection?: () => void;
  onEnterWorkspace?: () => void;
}

export function ConnectionCard({
  connection,
  runtimeState,
  isActiveSession = false,
  onEdit,
  onDelete,
  onTestConnection,
  onRetryConnection,
  onEnterWorkspace,
}: ConnectionCardProps) {
  const resolvedRuntimeState = runtimeState ?? {
    connectionId: connection.id,
    status: 'idle' as const,
    detail: 'Ready to validate and open a workspace session.',
  };
  const isProduction = connection.environment === 'production';
  const accentIcon = connection.db_type === 'postgresql' ? 'database' : 'dns';
  const accentColor = connection.db_type === 'postgresql' ? 'text-primary' : 'text-secondary';
  const databaseLabel = connection.database ? `DB: ${connection.database}` : 'No default database';
  const accessLabel = 'Credentials stored locally';

  return (
    <div
      className={`
        bg-surface-container border p-5 rounded-2xl
        ${isProduction ? 'border-error/20' : 'border-neutral-800/50'}
        hover:bg-surface-container-high transition-colors
      `}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <EnvironmentBadge environment={connection.environment} />
          <ConnectionStatusBadge status={resolvedRuntimeState.status} />
          {isActiveSession ? (
            <span className="rounded-full border border-primary/20 bg-primary-container/15 px-2.5 py-1 text-[10px] font-label uppercase tracking-[0.18em] text-primary">
              Active Session
            </span>
          ) : null}
          {isProduction && resolvedRuntimeState.status === 'connected' ? (
            <span className="rounded-full border border-error/20 bg-error-container/15 px-2.5 py-1 text-[10px] font-label uppercase tracking-[0.18em] text-error">
              Read-Only On Entry
            </span>
          ) : null}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg px-2.5 py-1.5 text-xs font-label uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            title="Edit"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-error transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl border border-neutral-800/50 bg-surface-container-low flex items-center justify-center">
          <span className={`material-symbols-outlined text-2xl ${accentColor}`}>{accentIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-headline font-semibold tracking-tight text-on-surface truncate">
            {connection.name}
          </h3>
          <p className="mt-1 text-sm font-mono text-on-surface-variant truncate">
            {connection.host}:{connection.port}
          </p>
        </div>
      </div>

      <dl className="grid gap-3 border-t border-neutral-800/50 pt-4 text-sm text-on-surface-variant sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Database</dt>
          <dd className="mt-1 text-on-surface">
            <span className="rounded-full border border-neutral-800/60 bg-surface-container-low px-2.5 py-1 text-[11px] font-label uppercase tracking-[0.18em] text-on-surface-variant">
              {connection.db_type}
            </span>
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Context</dt>
          <dd className="mt-1 truncate text-on-surface">{databaseLabel}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Access</dt>
          <dd className="mt-1 truncate text-on-surface">{accessLabel}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Storage</dt>
          <dd className="mt-1 text-on-surface">Saved locally</dd>
        </div>
      </dl>

      {connection.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {connection.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-800 bg-surface-container-low px-2.5 py-1 text-[11px] font-label text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 border-t border-neutral-800/50 pt-4">
        <p className="text-sm text-on-surface-variant">{resolvedRuntimeState.detail}</p>
        {resolvedRuntimeState.lastError ? (
          <p className="mt-2 text-sm text-error">{resolvedRuntimeState.lastError}</p>
        ) : null}

        <div className="mt-4">
          <ConnectionCardActions
            runtimeState={resolvedRuntimeState}
            isActiveSession={isActiveSession}
            onTest={onTestConnection ?? (() => undefined)}
            onRetry={onRetryConnection ?? (() => undefined)}
            onEnterWorkspace={onEnterWorkspace ?? (() => undefined)}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="font-label uppercase tracking-[0.18em] text-on-surface-variant">
            Managed Connection
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-label uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/10 hover:text-primary-dim"
          >
            Edit Details
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
