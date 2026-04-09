import { DataBrowserTable } from '@/types/workspace';

interface TableSummaryPanelProps {
  table: DataBrowserTable;
  databaseLabel: string;
}

export function TableSummaryPanel({ table, databaseLabel }: TableSummaryPanelProps) {
  return (
    <section className="rounded-3xl border border-neutral-800/50 bg-surface-container p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">
            {databaseLabel}
          </p>
          <h1 className="mt-2 text-3xl font-headline font-black tracking-tight text-on-surface">
            {table.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            {table.description}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800/50 bg-surface-container-low px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Rows</p>
            <p className="mt-2 text-lg font-headline font-semibold text-on-surface">{table.rowCountLabel}</p>
          </div>
          <div className="rounded-2xl border border-neutral-800/50 bg-surface-container-low px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Columns</p>
            <p className="mt-2 text-lg font-headline font-semibold text-on-surface">
              {table.columns.length}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800/50 bg-surface-container-low px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Preview</p>
            <p className="mt-2 text-lg font-headline font-semibold text-on-surface">
              {table.previewRows.length > 0 ? `${table.previewRows.length} rows` : 'Empty'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {table.columns.map((column) => (
          <article
            key={column.name}
            className="rounded-2xl border border-neutral-800/50 bg-surface-container-low px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-on-surface">{column.name}</p>
              {column.isPrimaryKey ? (
                <span className="rounded-full border border-primary/25 bg-primary-container/15 px-2 py-0.5 text-[10px] font-label uppercase tracking-[0.18em] text-primary">
                  PK
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-mono text-xs text-on-surface-variant">{column.type}</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {column.nullable ? 'Nullable' : 'Required'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
