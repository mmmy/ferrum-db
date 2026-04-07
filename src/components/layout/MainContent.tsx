import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

export function MainContent({ children, className = '' }: MainContentProps) {
  return (
    <main className={`flex-1 p-6 overflow-auto custom-scrollbar ${className}`}>
      {children}
    </main>
  );
}