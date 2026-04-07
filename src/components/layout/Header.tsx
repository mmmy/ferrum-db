interface HeaderProps {
  title?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onAdd?: () => void;
}

export function Header({
  title = 'Connections',
  searchPlaceholder = 'Search connections...',
  onSearch,
  onAdd,
}: HeaderProps) {
  return (
    <header className="h-12 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50 flex items-center justify-between px-4">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-headline font-semibold text-on-surface">{title}</h2>
        <div className="flex gap-1">
          <button className="px-3 py-1 text-xs font-label text-primary border-b-2 border-primary">
            All
          </button>
          <button className="px-3 py-1 text-xs font-label text-on-surface-variant hover:text-on-surface transition-colors">
            Production
          </button>
          <button className="px-3 py-1 text-xs font-label text-on-surface-variant hover:text-on-surface transition-colors">
            Staging
          </button>
        </div>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-64 bg-surface-container border border-neutral-800/50 rounded-lg pl-9 pr-3 py-1.5 text-sm font-body text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-neutral-950 rounded-lg text-sm font-label font-medium hover:bg-primary-dim transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Connect
        </button>

        {/* User Actions */}
        <button className="p-1.5 rounded-lg hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
        </button>
      </div>
    </header>
  );
}