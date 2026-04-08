import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

export function MainContent({ children, className = '' }: MainContentProps) {
  return (
    <main className={`custom-scrollbar flex-1 overflow-auto px-6 py-8 md:px-8 ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {children}
      </div>
    </main>
  );
}
