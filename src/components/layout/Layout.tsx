import { ReactNode } from 'react';
import { Sidebar, type NavItem } from './Sidebar';
import { Header } from './Header';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerActions?: ReactNode;
  activeNavItem?: string;
  sidebarItems?: NavItem[];
  onNavSelect?: (itemName: string) => void;
  banner?: ReactNode;
}

export function Layout({
  children,
  headerTitle = 'Connections',
  headerSubtitle = 'Local workspace shell',
  headerActions,
  activeNavItem = 'Connections',
  sidebarItems,
  onNavSelect,
  banner,
}: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={activeNavItem} items={sidebarItems} onSelect={onNavSelect} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          actions={headerActions}
        />
        {banner}
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

export { Sidebar } from './Sidebar';
export type { NavItem } from './Sidebar';
export { Header } from './Header';
export { MainContent } from './MainContent';
