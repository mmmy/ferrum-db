interface EnvironmentBadgeProps {
  environment?: 'production' | 'staging' | 'development';
}

export function EnvironmentBadge({ environment }: EnvironmentBadgeProps) {
  if (!environment) return null;

  const styles = {
    production: 'bg-error-container/20 text-error',
    staging: 'bg-secondary-container/20 text-secondary',
    development: 'bg-primary-container/20 text-primary',
  };

  const labels = {
    production: 'Production',
    staging: 'Staging',
    development: 'Dev',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-label ${styles[environment]}`}>
      {labels[environment]}
    </span>
  );
}