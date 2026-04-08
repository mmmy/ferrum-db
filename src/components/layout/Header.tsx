import { ReactNode } from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Header({
  title = 'Connections',
  subtitle = 'Local workspace shell',
  actions,
}: HeaderProps) {
  return (
    <header className="border-b border-neutral-800/50 bg-neutral-950/85 px-6 py-4 backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/80">
            Workspace Shell
          </p>
          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-base font-headline font-semibold text-on-surface">{title}</h2>
            <p className="text-sm text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        {actions ? (
          <div className="flex items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
