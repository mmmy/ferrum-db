interface EmptyStateProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  icon?: string;
  tone?: 'default' | 'error' | 'subtle';
  onAction?: () => void;
}

export function EmptyState({
  eyebrow = 'Connections',
  title = 'No connections yet',
  description = 'Add your first database connection to get started.',
  actionLabel = 'Add Connection',
  icon = 'hub',
  tone = 'default',
  onAction,
}: EmptyStateProps) {
  const toneClasses = {
    default: 'border-neutral-800/50 bg-surface-container-low text-primary',
    error: 'border-error/20 bg-error-container/10 text-error',
    subtle: 'border-neutral-800/50 bg-surface-container text-on-surface-variant',
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-800/50 bg-surface-container-low px-6 py-16 text-center">
      <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary/80">{eyebrow}</p>
      <h3 className="text-xl font-headline font-semibold text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant mb-6 text-center max-w-md">{description}</p>
      {onAction ? (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-neutral-950 rounded-lg text-sm font-label font-medium hover:bg-primary-dim transition-colors"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
