
type NavItem = {
  name: string;
  icon: string;
  href: string;
};

const navigation: NavItem[] = [
  { name: 'Connections', icon: 'hub', href: '/connections' },
  { name: 'SQL Editor', icon: 'terminal', href: '/sql' },
  { name: 'Data Browser', icon: 'table_rows', href: '/data' },
  { name: 'ER Diagram', icon: 'schema', href: '/er' },
  { name: 'History', icon: 'history', href: '/history' },
  { name: 'Settings', icon: 'settings', href: '/settings' },
];

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

export function Sidebar({ activeItem = 'Connections', onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800/50 flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-6 border-b border-neutral-800/50">
        <h1 className="text-xl font-headline font-bold text-on-surface">FerrumDB</h1>
        <p className="text-sm text-on-surface-variant font-label mt-1">v0.1.0</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => onNavigate?.(item.name)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-label
                  transition-colors duration-150
                  ${activeItem === item.name
                    ? 'text-primary bg-primary-container/20 border-r-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }
                `}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Links */}
      <div className="p-3 border-t border-neutral-800/50">
        <div className="flex gap-4 text-xs font-label text-on-surface-variant">
          <a href="#" className="hover:text-on-surface transition-colors">Docs</a>
          <a href="#" className="hover:text-on-surface transition-colors">Help</a>
        </div>
      </div>
    </aside>
  );
}