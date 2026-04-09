import { DataBrowserSchema } from '@/types/workspace';

interface SchemaTreeProps {
  schemas: DataBrowserSchema[];
  selectedTableId: string;
  onSelectTable: (tableId: string) => void;
}

export function SchemaTree({ schemas, selectedTableId, onSelectTable }: SchemaTreeProps) {
  return (
    <aside className="rounded-3xl border border-neutral-800/50 bg-surface-container p-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Schema Tree</p>
        <h2 className="mt-2 text-lg font-headline font-semibold text-on-surface">Browse Structure</h2>
      </div>

      <div className="mt-5 space-y-5">
        {schemas.map((schema) => (
          <section key={schema.id}>
            <div className="flex items-center gap-2 text-sm text-on-surface">
              <span className="material-symbols-outlined text-base text-primary">folder_open</span>
              <span className="font-label uppercase tracking-[0.18em]">{schema.name}</span>
            </div>

            <div className="mt-3 space-y-2 border-l border-neutral-800/50 pl-4">
              {schema.tables.map((table) => {
                const isSelected = table.id === selectedTableId;

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => onSelectTable(table.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'border-primary/30 bg-primary-container/10 text-on-surface'
                        : 'border-transparent bg-surface-container-low text-on-surface-variant hover:border-neutral-800/60 hover:text-on-surface'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="material-symbols-outlined text-base">table_rows</span>
                      <span className="truncate text-sm font-medium">{table.name}</span>
                    </span>
                    <span className="text-[11px] font-label uppercase tracking-[0.18em] text-on-surface-variant">
                      {table.rowCountLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
