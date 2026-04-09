import { ActiveSession } from '@/types/workspace';

interface WorkspacePlaceholderProps {
  title: string;
  description: string;
  session: ActiveSession;
}

export function WorkspacePlaceholder({
  title,
  description,
  session,
}: WorkspacePlaceholderProps) {
  return (
    <section className="rounded-3xl border border-neutral-800/50 bg-surface-container p-8">
      <div className="max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/80">
          Workspace Module
        </p>
        <h1 className="mt-3 text-3xl font-headline font-black tracking-tight text-on-surface">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">{description}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-800/50 bg-surface-container-low p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Connection</p>
          <p className="mt-2 text-base font-headline text-on-surface">{session.connectionName}</p>
        </div>
        <div className="rounded-2xl border border-neutral-800/50 bg-surface-container-low p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Database</p>
          <p className="mt-2 text-base font-headline text-on-surface">
            {session.database ?? 'No default database'}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-800/50 bg-surface-container-low p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Session Mode</p>
          <p className="mt-2 text-base font-headline text-on-surface">
            {session.safetyMode === 'read-only' ? 'Read-Only' : 'Standard Access'}
          </p>
        </div>
      </div>
    </section>
  );
}
