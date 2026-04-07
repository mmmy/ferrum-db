import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onAdd?: () => void;
}

export function Layout({
  children,
  title = 'Connections',
  searchPlaceholder,
  onSearch,
  onAdd,
}: LayoutProps) {
  const [activeNav, setActiveNav] = useState('Connections');

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={title}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          onAdd={onAdd}
        />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}

export { Sidebar } from './Sidebar';
export { Header } from './Header';
export { MainContent } from './MainContent';