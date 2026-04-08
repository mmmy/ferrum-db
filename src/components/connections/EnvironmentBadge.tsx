interface EnvironmentBadgeProps {
  environment?: 'production' | 'staging' | 'development';
}

export function EnvironmentBadge({ environment }: EnvironmentBadgeProps) {
  if (!environment) return null;

  const styles = {
    production: 'border-error/20 bg-error-container/20 text-error',
    staging: 'border-secondary/20 bg-secondary-container/20 text-secondary',
    development: 'border-primary/20 bg-primary-container/20 text-primary',
  };

  const labels = {
    production: 'Production',
    staging: 'Staging',
    development: 'Development',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-label uppercase tracking-[0.18em] ${styles[environment]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[environment]}
    </span>
  );
}
