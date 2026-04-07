interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No connections yet',
  description = 'Add your first database connection to get started.',
  actionLabel = 'Add Connection',
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">hub</span>
      </div>
      <h3 className="text-xl font-headline font-semibold text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant mb-6 text-center max-w-md">{description}</p>
      <button
        onClick={onAction}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-neutral-950 rounded-lg text-sm font-label font-medium hover:bg-primary-dim transition-colors"
      >
        <span className="material-symbols-outlined">add_circle</span>
        {actionLabel}
      </button>
    </div>
  );
}