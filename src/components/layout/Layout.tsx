import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerActions?: ReactNode;
  activeNavItem?: string;
}

export function Layout({
  children,
  headerTitle = 'Connections',
  headerSubtitle = 'Local workspace shell',
  headerActions,
  activeNavItem = 'Connections',
}: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={activeNavItem} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          actions={headerActions}
        />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

export { Sidebar } from './Sidebar';
export { Header } from './Header';
export { MainContent } from './MainContent';
