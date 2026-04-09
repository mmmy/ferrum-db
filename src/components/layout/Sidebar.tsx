
export type NavItem = {
  name: string;
  icon: string;
  available: boolean;
};

const defaultNavigation: NavItem[] = [
  { name: 'Connections', icon: 'hub', available: true },
  { name: 'SQL Editor', icon: 'terminal', available: false },
  { name: 'Data Browser', icon: 'table_rows', available: false },
  { name: 'ER Diagram', icon: 'schema', available: false },
  { name: 'History', icon: 'history', available: false },
  { name: 'Settings', icon: 'settings', available: false },
];

interface SidebarProps {
  activeItem?: string;
  items?: NavItem[];
  onSelect?: (itemName: string) => void;
}

export function Sidebar({
  activeItem = 'Connections',
  items = defaultNavigation,
  onSelect,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800/50 flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-6 border-b border-neutral-800/50">
        <h1 className="text-xl font-headline font-bold text-on-surface">FerrumDB</h1>
        <p className="text-sm text-on-surface-variant font-label mt-1">v0.2 preview</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                disabled={!item.available}
                onClick={() => {
                  if (item.available) {
                    onSelect?.(item.name);
                  }
                }}
                aria-current={activeItem === item.name ? 'page' : undefined}
                className={`
                  w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-label border
                  transition-colors duration-150
                  ${activeItem === item.name
                    ? 'text-primary bg-primary-container/20 border-primary/30'
                    : item.available
                      ? 'text-on-surface-variant border-transparent'
                      : 'text-on-surface-variant/60 border-transparent disabled:cursor-not-allowed'
                  }
                `}
              >
                <span className="flex items-center gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.name}
                </span>
                {!item.available ? (
                  <span
                    aria-hidden="true"
                    className="rounded-full border border-neutral-800 bg-surface-container px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-on-surface-variant"
                  >
                    Soon
                  </span>
                ) : null}
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
